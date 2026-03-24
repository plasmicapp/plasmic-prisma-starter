'use client';

import React from 'react';
import { DataProvider } from '@plasmicapp/loader-nextjs';
import { prismaQuery } from '@/functions/prismaQuery';
import { PrismaQueryParams, PrismaFieldsContext } from '@/lib/types';
import { Prisma } from '@prisma/client';


interface PrismaDataFetcherProps extends React.PropsWithChildren {
    args?: Partial<PrismaQueryParams>,
    table?: Prisma.ModelName,
    operation?: string,
    setControlContextData?: (data: PrismaFieldsContext) => void,
}

export function PrismaDataFetcher(props: PrismaDataFetcherProps) {
    const { args, children, setControlContextData } = props;
    const { table, operation } = args || {};
    const [data, setData] = React.useState<unknown>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    // Fetch data from Prisma based on the provided props
    React.useEffect(() => {
        // This is where we fetch the field information for the Plasmic Studio UI based on the selected model.
        const fetchStudioFields = async () => {
            if (!setControlContextData) return;
            try {
                const config = await fetch(`/api/prisma-fields?model=${table}`);
                setControlContextData(await config.json());
                
            } catch (error: unknown) {
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
                const data = await prismaQuery({ table, operation, ...(args ?? {}) });
                setData(data);
            } catch (error: unknown) {
                console.error("Error executing Prisma query:", error);
                setError(`Error executing query: ${error instanceof Error ? error.message : String(error)}`);
            }

            setLoading(false);
        }
        fetchData();
        fetchStudioFields();

    }, [table, operation, args, setControlContextData]);

    if (!table || !operation) {
        return children;
    }

    return (
        <DataProvider name={`${table}${operation}`} data={{ data, error, loading }}>
            {children}
        </DataProvider>
    );
}
