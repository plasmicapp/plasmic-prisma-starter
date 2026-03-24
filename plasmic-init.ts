import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";
import { PrismaOperations } from "@/lib/types";
import { prismaQuery } from "@/functions/prismaQuery";
import {
    isMethodAvailable,
    prismaFnContext,
    queryBuilderConfig,
    withPrismaParams,
} from '@/lib/prismaQueryConfig';

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "xpjuD2VqBCGPggNh2kWhnV",  // ID of a project you are using
      token: "KoTB6pMixrtcshRIbTxm4O1eJlvcXdMpTysufELoDziDkJ7yLz6pGCYcUtADcmsNCpZAWVKr9w78UNw9Yp4Q"  // API token for that project
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  // Disable for production to ensure you render only published changes.
  preview: true,
})


export const prismaTableParam = {
    name: 'table' as const,
    type: 'choice' as const,
    multiSelect: false as const,
    options: withPrismaParams((_p, ctx) => ctx?.models || []),
    description: 'Select the Prisma model to query',
};

export const getPrismaOperationParam = <T extends readonly string[]>(operations: T) => ({
    name: 'operation' as const,
    type: 'choice' as const,
    options: [...operations].map((op) => ({
        value: op,
        label: op,
    })),
    description: 'Select the Prisma operation to perform',
    multiSelect: false as const,
});

PLASMIC.registerFunction(prismaQuery, {
    name: 'prismaQuery',
    displayName: 'Prisma Query',
    description: 'Run any Prisma model operation (find, create, update, delete, aggregate, …) with a structured UI.',
    isQuery: true,
    fnContext: prismaFnContext,
    params: [{
        name: 'args',
        type: 'object',
        display: "flatten",
        displayName: 'Query Parameters',
        fields: {
            table: prismaTableParam,
            operation: getPrismaOperationParam(PrismaOperations),
            where: {
                type: 'queryBuilder',
                displayName: 'Where',
                hidden: withPrismaParams((params) => !isMethodAvailable('where', params)),
                description: 'Filter results with a visual query builder',
                config: queryBuilderConfig,
            },
            orderBy: {
                displayName: 'Order By Field',
                type: 'choice',
                options: withPrismaParams((_p, ctx) => ctx?.scalarFields || []),
                hidden: withPrismaParams((params) => !isMethodAvailable('orderBy', params)),
                description: 'Field to sort by',
            },
            orderByDirection: {
                displayName: 'Order Direction',
                type: 'choice',
                options: [
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' },
                ],
                hidden: withPrismaParams((params) =>
                    !isMethodAvailable('orderBy', params) || !params?.orderBy,
                ),
                description: 'Sort direction',
            },
            take: {
                displayName: 'Limit',
                type: 'number',
                hidden: withPrismaParams((params) => !isMethodAvailable('pagination', params)),
                description: 'Maximum number of records to return',
            },
            skip: {
                displayName: 'Offset',
                type: 'number',
                hidden: withPrismaParams((params) => !isMethodAvailable('pagination', params)),
                description: 'Number of records to skip',
            },
            select: {
                displayName: 'Select Fields',
                type: 'choice',
                multiSelect: true,
                options: withPrismaParams((_p, ctx) => [...(ctx?.scalarFields || []), ...(ctx?.enumFields || [])]),
                hidden: withPrismaParams((params) =>
                    !isMethodAvailable('select', params) ||
                    (params?.omit?.length ?? 0) > 0 ||
                    (params?.include?.length ?? 0) > 0,
                ),
                description: 'Return only these fields. Mutually exclusive with Omit Fields and Include Relations.',
            },
            omit: {
                displayName: 'Omit Fields',
                type: 'choice',
                multiSelect: true,
                options: withPrismaParams((_p, ctx) => [...(ctx?.scalarFields || []), ...(ctx?.enumFields || [])]),
                hidden: withPrismaParams((params) =>
                    !isMethodAvailable('select', params) ||
                    (params?.select?.length ?? 0) > 0,
                ),
                description: 'Exclude these fields from results. Mutually exclusive with Select Fields.',
            },
            include: {
                displayName: 'Include Relations',
                type: 'choice',
                multiSelect: true,
                options: withPrismaParams((_p, ctx) => ctx?.objectFields || []),
                hidden: withPrismaParams((params) =>
                    !isMethodAvailable('include', params) ||
                    (params?.select?.length ?? 0) > 0,
                ),
                description: 'Eagerly load these related records. Cannot be used together with Select Fields.',
            },
            cursorId: {
                displayName: 'Cursor (last seen ID)',
                type: 'string',
                hidden: withPrismaParams((params) => !isMethodAvailable('cursor', params)),
                description: 'The id of the last record seen — used for keyset pagination',
            },
            distinct: {
                displayName: 'Distinct Fields',
                type: 'choice',
                multiSelect: true,
                options: withPrismaParams((_p, ctx) => ctx?.scalarFields || []),
                hidden: withPrismaParams((params) => !isMethodAvailable('distinct', params)),
                description: 'Return only unique records across these fields',
            },
        },
    }],
});
