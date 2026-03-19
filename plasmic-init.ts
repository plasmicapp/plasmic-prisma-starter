import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";
import * as NextNavigation from "next/navigation";
import { PrismaOperations } from "@/lib/types";
import { prismaQuery } from '@/functions/prismaQuery';
import {
    type PrismaQueryParams,
    type PrismaFnContext,
    hideIfUnsupported,
    opsWithParam,
    prismaFnContext,
    queryBuilderConfig,
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
    multiSelect: false as const,
    options: (_p: unknown, ctx?: PrismaFnContext) => ctx?.models || [],
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
    isQuery: true,
    fnContext: prismaFnContext,
    params: [
        prismaTableParam,
        getPrismaOperationParam(PrismaOperations),
        // --- Filtering ---
        {
            type: 'queryBuilder',
            name: 'where',
            displayName: 'Where',
            hidden: hideIfUnsupported(opsWithParam('where')),
            description: 'Filter results with a visual query builder',
            config: queryBuilderConfig,
        },
        // --- Sorting ---
        {
            name: 'orderBy',
            displayName: 'Order By Field',
            type: 'choice',
            options: (_p: PrismaQueryParams, ctx?: PrismaFnContext) => ctx?.scalarFields || [],
            hidden: hideIfUnsupported(opsWithParam('orderBy')),
            description: 'Field to sort by',
        },
        {
            name: 'orderByDirection',
            displayName: 'Order Direction',
            type: 'choice',
            options: [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
            ],
            // Only show once a field is chosen
            hidden: (_p: PrismaQueryParams, ctx?: PrismaFnContext) =>
                hideIfUnsupported(opsWithParam('orderBy'))(_p,ctx) || !ctx?.orderBy,
            description: 'Sort direction',
        },
        // --- Pagination ---
        {
            name: 'take',
            displayName: 'Limit',
            type: 'number',
            hidden: hideIfUnsupported(opsWithParam('pagination')),
            description: 'Maximum number of records to return',
        },
        {
            name: 'skip',
            displayName: 'Offset',
            type: 'number',
            hidden: hideIfUnsupported(opsWithParam('pagination')),
            description: 'Number of records to skip',
        },
        {
            name: 'select',
            displayName: 'Select Fields',
            type: 'choice',
            multiSelect: true,
            options: (_p, ctx?: PrismaFnContext) => [...(ctx?.scalarFields || []), ...(ctx?.enumFields || [])],
            hidden: (_p, ctx?: PrismaFnContext) =>
                hideIfUnsupported(opsWithParam('select'))(_p, ctx) ||
                (ctx?.omit?.length ?? 0) > 0 ||
                (ctx?.include?.length ?? 0) > 0,
            description: 'Return only these fields. Mutually exclusive with Omit Fields and Include Relations.',
        },
        {
            name: 'omit',
            displayName: 'Omit Fields',
            type: 'choice',
            multiSelect: true,
            options: (_p, ctx?: PrismaFnContext) => [...(ctx?.scalarFields || []), ...(ctx?.enumFields || [])],
            // Hidden when op doesn't support select, OR select has items
            hidden: (_p, ctx?: PrismaFnContext) =>
                hideIfUnsupported(opsWithParam('select'))(_p, ctx) ||
                (ctx?.select?.length ?? 0) > 0,
            description: 'Exclude these fields from results. Mutually exclusive with Select Fields.',
        },
        // --- Relations ---
        {
            name: 'include',
            displayName: 'Include Relations',
            type: 'choice',
            multiSelect: true,
            options: (_p, ctx?: PrismaFnContext) => ctx?.objectFields || [],
            // Hidden when op doesn't support it, OR select has items
            hidden: (_p, ctx?: PrismaFnContext) => 
                hideIfUnsupported(opsWithParam('include'))(_p, ctx) ||
                (ctx?.select?.length ?? 0) > 0,
            description: 'Eagerly load these related records. Cannot be used together with Select Fields.',
        },
        // --- Cursor pagination ---
        {
            name: 'cursorId',
            displayName: 'Cursor (last seen ID)',
            type: 'string',
            hidden: hideIfUnsupported(opsWithParam('cursor')),
            description: 'The id of the last record seen — used for keyset pagination',
        },
        // --- Distinct ---
        {
            name: 'distinct',
            displayName: 'Distinct Fields',
            type: 'choice',
            multiSelect: true,
            options: (_p: PrismaQueryParams, ctx?: PrismaFnContext) => ctx?.scalarFields || [],
            hidden: hideIfUnsupported(opsWithParam('distinct')),
            description: 'Return only unique records across these fields',
        },
    ],
});
