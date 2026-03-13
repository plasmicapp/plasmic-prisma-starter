
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

export const PrismaReadOperations = [
    'findUnique',
    'findUniqueOrThrow',
    'findMany',
    'findFirst',
    'findFirstOrThrow',
    'aggregate',
    'count',
    'groupBy',
] as const;


export type CRUDOperations = "create" | "update" | "delete" | "read";

export interface ResourcePermissions {
  [resource: string]: Partial<Record<CRUDOperations, boolean>>;
}

export const PRISMA_TYPE_TO_QUERY_BUILDER: Record<string, string> = {
    String: 'text',
    Int: 'number',
    Float: 'number',
    Decimal: 'number',
    BigInt: 'number',
    Boolean: 'boolean',
    DateTime: 'datetime',
};
