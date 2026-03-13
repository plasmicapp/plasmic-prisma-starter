import { Prisma } from '@prisma/client';
import { PRISMA_TYPE_TO_QUERY_BUILDER } from '@/lib/types';
import { prismaQuery } from '@/functions/prismaQuery';

/** Typed tuple of the arguments currently passed to prismaQuery in the Plasmic UI */
export type PrismaQueryParams = Partial<Parameters<typeof prismaQuery>>;

/** Returns true (hidden) when no table/op is selected, or the op is not in the given set */
export const hiddenUnlessOp =
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

/** Build a queryBuilder `fields` config from a model's scalar/enum DMMF fields */
export const getPrismaWhereFields = (modelName: unknown) => {
    if (typeof modelName !== 'string') return {};
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    if (!model) return {};
    return Object.fromEntries(
        model.fields
            .filter(f => f.kind === 'scalar' || f.kind === 'enum')
            .map(f => [f.name, {
                label: f.name,
                type: PRISMA_TYPE_TO_QUERY_BUILDER[f.type] ?? 'text',
            }]),
    );
};

/** Build a choice `options` list from a model's fields filtered by kind */
export const getModelFieldOptions = (
    modelName: unknown,
    kinds: ('scalar' | 'object' | 'enum')[],
) => {
    if (typeof modelName !== 'string') return [];
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    if (!model) return [];
    return model.fields
        .filter(f => kinds.includes(f.kind as 'scalar' | 'object' | 'enum'))
        .map(f => ({ value: f.name, label: f.name }));
};

/** The shape of the context pre-fetched by `prismaFnContext` */
export type PrismaFnContext = {
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
    table?: string,
    operation?: string,
    select?: string[],
    omit?: string[],
    include?: string[],
    orderBy?: string,
): { dataKey: string; fetcher: () => Promise<PrismaFnContext> } => {
    if (!table) {
        return { dataKey: '', fetcher: async () => emptyFnContext };
    }
    return {
        dataKey: JSON.stringify({ table, operation }),
        fetcher: async () => ({
            table,
            operation,
            orderBy,
            select,
            omit,
            include,
            whereFields: getPrismaWhereFields(table),
            scalarFields: getModelFieldOptions(table, ['scalar']),
            enumFields: getModelFieldOptions(table, ['enum']),
            objectFields: getModelFieldOptions(table, ['object']),
        }),
    };
};
