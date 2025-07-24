import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate());
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

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

/**
 * https://github.com/prisma/prisma/issues/11940#issuecomment-3106962088
 */
export function tableNameToMethodName<T extends string>(self: T): Uncapitalize<T> {
  return (self.substring(0, 1).toLowerCase() + self.substring(1)) as Uncapitalize<T>
}