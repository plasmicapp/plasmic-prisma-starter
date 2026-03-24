import { PrismaQueryParams, PrismaFieldsContext, OPERATION_CAPS, OperationCap } from '@/lib/types';

export type PrismaControlArgs = [(PrismaQueryParams | undefined)?];

export const withPrismaParams =
  <R>(fn: (params?: PrismaQueryParams, ctx?: PrismaFieldsContext) => R) =>
  ([params]: PrismaControlArgs, ctx?: PrismaFieldsContext) =>
    fn(params, ctx);

export const isMethodAvailable = (
  cap: OperationCap,
  params?: PrismaQueryParams
): boolean => {
  if (!params?.table || !params?.operation) return true;
  return (OPERATION_CAPS[params.operation] ?? []).includes(cap);
};

const emptyFnContext: PrismaFieldsContext = {
    models: [],
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
export const prismaFnContext = (params?: PrismaQueryParams) => {
    const { table, operation } = params || {};

    if (!table) {
        return { dataKey: '', fetcher: async () => emptyFnContext };
    }

    return {
        dataKey: `${table}-${operation}`, // re-fetch when any param changes
        fetcher: async () => {
            const res = await fetch(`/api/prisma-fields?${new URLSearchParams({ model: table })}`);
            const { whereFields, scalarFields, enumFields, objectFields, models } = await res.json();

            return {
                models,
                whereFields,
                scalarFields,
                enumFields,
                objectFields,
            } as PrismaFieldsContext;
        },
    };
};

export const queryBuilderConfig = withPrismaParams((_p, ctx) => ({
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
}));
