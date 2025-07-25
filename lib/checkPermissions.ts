'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ResourcePermissions, CRUDOperations, PrismaOperations } from '@/lib/types';

const operationMappings: Record<CRUDOperations, string[]> = {
  read: [
    "findUniqueOrThrow",
    "findFirstOrThrow",
    "findUnique",
    "findFirst",
    "aggregate",
    "findMany",
    "groupBy",
    "count",
  ],
  create: ["createManyAndReturn", "createMany", "create"],
  update: ["updateMany", "update", "upsert"],
  delete: ["deleteMany", "delete"],
};

const operationToActionMap: Record<string, CRUDOperations> = Object.fromEntries(
  Object.entries(operationMappings).flatMap(([action, operations]) =>
    operations.map((operation) => [operation, action as CRUDOperations]),
  ),
);

function isPermissionGranted(
  permissions: ResourcePermissions | undefined | null,
  action: CRUDOperations,
): boolean {
  if (!permissions || !action) return false;
  return !!permissions?.[action];
}

/**
 * Very basic implementation that checks the user's role and permissions.
 * @param operation The Prisma operation to check permissions for.
 * @returns A boolean indicating whether the operation is allowed.
 */
export const checkPermissions = async (operation: typeof PrismaOperations[number]) => {
    const session = await auth();

    const roleName = session?.user?.roleName || 'guest'; // Default to 'guest' if no session or role is found
    
    const role = await prisma.role.findUnique({
        where: { name: roleName },
        cacheStrategy: {
            ttl: 3600*12, // Cache for 12 hours
        },
    });

    if (!role) {
        return false; // No role found, deny access
    }

    const { permissions } = role;
    const action = operationToActionMap[operation];

    return isPermissionGranted(permissions as ResourcePermissions, action); // Return true if action is allowed in permissions object 

}
