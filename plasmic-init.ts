import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";
import * as NextNavigation from "next/navigation";
import { Prisma } from '@prisma/client';
import { PrismaOperations } from "@/lib/types";
import { prismaQuery } from '@/functions/prismaQuery';
import {
    type PrismaQueryParams,
    type PrismaFnContext,
    hiddenUnlessOp,
    opsWithParam,
    prismaFnContext,
} from '@/lib/prismaQueryConfig';

export const PLASMIC = initPlasmicLoader({
  nextNavigation: NextNavigation,
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
    name: 'table',
    type: 'choice' as const,
    options: Object.values(Prisma.ModelName).map((name) => ({
        value: name,
        label: name,
    })),
    description: 'Select the Prisma model to query',
};

export const getPrismaOperationParam = <T extends readonly string[]>(operations: T) => ({
    name: 'operation',
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
    namespace: 'prisma',
    isQuery: true,
    fnContext: (table, operation, _args, _where, orderBy, _orderByDir, _take, _skip, select, omit, include) =>
        prismaFnContext(table, operation, select, omit, include, orderBy),
    params: [
        prismaTableParam,
        getPrismaOperationParam(PrismaOperations),
        {
            name: 'args',
            displayName: 'Args (legacy)',
            type: 'object',
            hidden: () => true,
            description: 'Legacy catch-all arguments object – use the structured fields below instead',
        },
        // --- Filtering ---
        {
            type: 'queryBuilder',
            name: 'where',
            displayName: 'Where',
            hidden: hiddenUnlessOp(opsWithParam('where')),
            description: 'Filter results with a visual query builder',
            config: (_params: PrismaQueryParams, ctx?: PrismaFnContext) => ({
                fields: ctx?.whereFields ?? {},
            }),
        },
        // --- Sorting ---
        {
            name: '_orderBy',
            displayName: 'Order By Field',
            type: 'choice',
            options: (_params: PrismaQueryParams, ctx?: PrismaFnContext) => ctx?.scalarFields || [],
            hidden: hiddenUnlessOp(opsWithParam('orderBy')),
            description: 'Field to sort by',
        },
        {
            name: '_orderByDirection',
            displayName: 'Order Direction',
            type: 'choice',
            options: [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
            ],
            // Only show once a field is chosen
            hidden: (_params: PrismaQueryParams, ctx?: PrismaFnContext) =>
                hiddenUnlessOp(opsWithParam('orderBy'))(_params, ctx) || !ctx?.orderBy,
            description: 'Sort direction',
        },
        // --- Pagination ---
        {
            name: 'take',
            displayName: 'Limit',
            type: 'number',
            hidden: hiddenUnlessOp(opsWithParam('pagination')),
            description: 'Maximum number of records to return',
        },
        {
            name: 'skip',
            displayName: 'Offset',
            type: 'number',
            hidden: hiddenUnlessOp(opsWithParam('pagination')),
            description: 'Number of records to skip',
        },
        {
            name: '_select',
            displayName: 'Select Fields',
            type: 'choice',
            multiSelect: true,
            options: (_p, ctx?: PrismaFnContext) => [...(ctx?.scalarFields || []), ...(ctx?.enumFields || [])],
            hidden: (_p, ctx?: PrismaFnContext) =>
                hiddenUnlessOp(opsWithParam('select'))(_p, ctx) ||
                (ctx?.omit?.length ?? 0) > 0 ||
                (ctx?.include?.length ?? 0) > 0,
            description: 'Return only these fields. Mutually exclusive with Omit Fields and Include Relations.',
        },
        {
            name: '_omit',
            displayName: 'Omit Fields',
            type: 'choice',
            multiSelect: true,
            options: (_p, ctx?: PrismaFnContext) => [...(ctx?.scalarFields || []), ...(ctx?.enumFields || [])],
            // Hidden when op doesn't support select, OR _select (params[8]) has items
            hidden: (_p, ctx?: PrismaFnContext) =>
                hiddenUnlessOp(opsWithParam('select'))(_p, ctx) ||
                (ctx?.select?.length ?? 0) > 0,
            description: 'Exclude these fields from results. Mutually exclusive with Select Fields.',
        },
        // --- Relations ---
        {
            name: '_include',
            displayName: 'Include Relations',
            type: 'choice',
            multiSelect: true,
            options: (_p, ctx?: PrismaFnContext) => ctx?.objectFields || [],
            // Hidden when op doesn't support it, OR _select (params[8]) has items
            hidden: (_p, ctx?: PrismaFnContext) =>
                hiddenUnlessOp(opsWithParam('include'))(_p, ctx) ||
                (ctx?.select?.length ?? 0) > 0,
            description: 'Eagerly load these related records. Cannot be used together with Select Fields.',
        },
        // --- Cursor pagination ---
        {
            name: '_cursorId',
            displayName: 'Cursor (last seen ID)',
            type: 'string',
            hidden: hiddenUnlessOp(opsWithParam('cursor')),
            description: 'The id of the last record seen — used for keyset pagination',
        },
        // --- Distinct ---
        {
            name: '_distinct',
            displayName: 'Distinct Fields',
            type: 'choice',
            multiSelect: true,
            options: (_params: PrismaQueryParams, ctx?: PrismaFnContext) => ctx?.scalarFields || [],
            hidden: hiddenUnlessOp(opsWithParam('distinct')),
            description: 'Return only unique records across these fields',
        },
    ],
});
