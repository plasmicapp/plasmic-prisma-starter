import { prismaQuery } from '@/functions/prismaQuery';
import { Prisma } from '@prisma/client';

/** Typed tuple of the arguments currently passed to prismaQuery in the Plasmic UI */
export type PrismaQueryParams = Partial<Parameters<typeof prismaQuery>>;

/** Returns true (hidden) when no table/op is selected, or the op is not in the given set */
export const hideIfUnsupported =
    (ops: Set<string>) =>
    (_params: PrismaQueryParams, ctx?: PrismaFnContext): boolean => {
        if (!ctx?.table || !ctx?.operation) return true;
        return !ops.has(ctx.operation);
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

/** Derive a Set of operation names that support a given capability */
export const opsWithParam = (cap: OperationCap): Set<string> => 
    new Set(
        Object.entries(OPERATION_CAPS)
            .filter(([, caps]) => caps.includes(cap))
            .map(([op]) => op),
    );
    
/** The shape of the context pre-fetched by `prismaFnContext` */
export type PrismaFnContext = {
    models: { value: Prisma.ModelName; label: string }[];
    table: string | undefined;
    operation: string | undefined;
    orderBy: string | undefined;
    select: string[] | undefined;
    omit: string[] | undefined;
    include: string[] | undefined;
    whereFields: Record<string, { label: string; type: string }>;
    scalarFields: { value: string; label: string }[];
    enumFields: { value: string; label: string }[];
    objectFields: { value: string; label: string }[];
};

const emptyFnContext: PrismaFnContext = {
    models: [],
    table: undefined,
    operation: undefined,
    orderBy: undefined,
    select: undefined,
    omit: undefined,
    include: undefined,
    whereFields: {},
    scalarFields: [],
    enumFields: [],
    objectFields: [],
};

/**
 * fnContext provider for the prismaQuery function registration.
 * Keyed on the selected model name; fetches field metadata server-side so
 * that param callbacks in the Plasmic Studio have it available as `ctx`.
 */
export const prismaFnContext = (
    table: Prisma.ModelName | undefined,
    operation: string | undefined,
    where: unknown,
    orderBy: string | undefined,
    orderByDirection: unknown,
    take: unknown,
    skip: unknown,
    select: string[] | undefined,
    omit: string[] | undefined,
    include: string[] | undefined,
) => {
    if (!table) {
        return { dataKey: '', fetcher: async () => emptyFnContext };
    }
    const currentParams = {
        table,
        operation,
        where,
        orderBy,
        orderByDirection,
        take,
        skip,
        select,
        omit,
        include
    }
    return {
        dataKey: `${table}-${operation}`, // re-fetch when any param changes
        fetcher: async () => {
            const res = await fetch(`/api/prisma-fields?${new URLSearchParams({ model: table })}`);
            const { whereFields, scalarFields, enumFields, objectFields, models } = await res.json();

            return {
                ...currentParams,
                models,
                whereFields,
                scalarFields,
                enumFields,
                objectFields,
            };
        },
    };
};

export const queryBuilderConfig = (_p: PrismaQueryParams, ctx?: PrismaFnContext) => ({
    fields: ctx?.whereFields ?? {},
    operators: {
        // RAQB's built-in starts_with / ends_with have jsonLogic: undefined.
        // Override them to emit custom JsonLogic keys that db-helpers.ts handles.
        starts_with: {
            label: 'Starts with',
            labelForFormat: 'Starts with',
            valueSources: ['value'],
            jsonLogic: (field: unknown, _op: string, val: unknown) =>
                ({ startsWith: [field, val] }),
        },
        ends_with: {
            label: 'Ends with',
            labelForFormat: 'Ends with',
            valueSources: ['value'],
            jsonLogic: (field: unknown, _op: string, val: unknown) =>
                ({ endsWith: [field, val] }),
        },
    },
});
