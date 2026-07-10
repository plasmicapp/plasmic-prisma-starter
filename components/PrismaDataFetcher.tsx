'use client';

import React from 'react';
import { DataProvider } from '@plasmicapp/loader-nextjs';
import { prismaQuery } from '@/functions/prismaQuery';
import { PrismaQueryParams, PrismaFieldsContext, PrismaOperations } from '@/lib/types';
import type { Prisma } from '@/app/generated/prisma/client';

interface PrismaDataFetcherProps extends React.PropsWithChildren {
    args?: Partial<PrismaQueryParams>,
    table?: Prisma.ModelName,
    operation?: typeof PrismaOperations[number],
    setControlContextData?: (data: PrismaFieldsContext) => void,
}

export function PrismaDataFetcher(props: PrismaDataFetcherProps) {
    const { args, children, setControlContextData, table, operation } = props;
    const [data, setData] = React.useState<unknown>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    // Fetch data from Prisma based on the provided props
    React.useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const isTeardownError = (e: unknown) =>
            signal.aborted ||
            (e instanceof DOMException && e.name === "AbortError") ||
            (e instanceof Error && /global scope is shutting down/i.test(e.message));

        // This is where we fetch the field information for the Plasmic Studio UI based on the selected model.
        const fetchStudioFields = async () => {
            if (!setControlContextData || signal.aborted) return;
            try {
                const config = await fetch(`/api/prisma-fields?model=${table}`, { signal });
                if (!signal.aborted) setControlContextData(await config.json());
            } catch (error: unknown) {
                if (isTeardownError(error)) return;
                console.error("Error fetching Prisma fields:", error);
            }
        }
        const fetchData = async () => {
            if (!table || !operation) {
                setError('Please select a table and an operation to execute.');
                setLoading(false);
                return;
            }
            try {
                const result = await prismaQuery({ table, operation, ...(args ?? {}) }, true);
                if (!signal.aborted) setData(result);
            } catch (error: unknown) {
                if (isTeardownError(error)) return;
                console.error("Error executing Prisma query:", error);
                setError(`Error executing query: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        }
        fetchData();
        fetchStudioFields();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, operation, JSON.stringify(args ?? {}), setControlContextData]);

    if (!table || !operation) {
        return children;
    }

    return (
        <DataProvider name={`${table}${operation}`} data={{ data, error, loading }}>
            {children}
        </DataProvider>
    );
}
