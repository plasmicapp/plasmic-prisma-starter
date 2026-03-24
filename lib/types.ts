import { Prisma } from '@prisma/client';

export const PrismaOperations = [
    'findUnique',
    'findMany',
    'findFirst',
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
    'findMany',
    'findFirst',
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


/** Object passed to Plasmic "params" argument  */
export type PrismaQueryParams = {
    table: Prisma.ModelName;
    operation: typeof PrismaOperations[number];
    where?: Record<string, unknown>;
    orderBy?: string;
    orderByDirection?: 'asc' | 'desc';
    take?: number;
    skip?: number;
    select?: string[];
    omit?: string[];
    include?: string[];
    cursorId?: string;
    distinct?: string[];
};


/** Which UI params each Prisma operation supports */
export type OperationCap = 'where' | 'orderBy' | 'pagination' | 'select' | 'include' | 'cursor' | 'distinct';

export const OPERATION_CAPS: Record<string, OperationCap[]> = {
    findUnique:          ['where', 'select', 'include'],
    findUniqueOrThrow:   ['where', 'select', 'include'],
    findMany:            ['where', 'orderBy', 'pagination', 'select', 'include', 'cursor', 'distinct'],
    findFirst:           ['where', 'orderBy', 'pagination', 'select', 'include', 'cursor', 'distinct'],
    findFirstOrThrow:    ['where', 'orderBy', 'pagination', 'select', 'include', 'cursor', 'distinct'],
    create:              ['select', 'include'],
    createMany:          [],
    createManyAndReturn: ['select', 'include'],
    update:              ['where', 'select', 'include'],
    updateMany:          ['where'],
    updateManyAndReturn: ['where', 'select'],
    upsert:              ['where', 'select', 'include'],
    delete:              ['where', 'select', 'include'],
    deleteMany:          ['where'],
    aggregate:           ['where', 'orderBy', 'pagination', 'cursor'],
    count:               ['where', 'orderBy', 'pagination', 'cursor'],
    groupBy:             ['where', 'orderBy', 'pagination', 'select'],
};

/** return value of /prisma-fields  */
export type PrismaFieldsContext = {
    models: { value: Prisma.ModelName; label: string }[];
    whereFields: Record<string, { label: string; type: string }>;
    scalarFields: { value: string; label: string }[];
    enumFields: { value: string; label: string }[];
    objectFields: { value: string; label: string }[];
};
