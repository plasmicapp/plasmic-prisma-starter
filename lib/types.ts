
export const PrismaOperations = [
    'findUnique',
    'findUniqueOrThrow',
    'findMany',
    'findFirst',
    'findFirstOrThrow',
    'create',
    'createMany',
    'createManyAndReturn',
    'update',
    'updateMany',
    'updateManyAndReturn',
    'upsert',
    'delete',
    'deleteMany',
    'aggregate',
    'count',
    'groupBy',
] as const;


export type CRUDOperations = "create" | "update" | "delete" | "read";

export interface ResourcePermissions {
  [resource: string]: Partial<Record<CRUDOperations, boolean>>;
}
