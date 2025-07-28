'use client';

import React from 'react';
import { type Prisma } from '@prisma/client';
import { PrismaOperations } from "@/lib/types";
import { DataProvider } from '@plasmicapp/loader-nextjs';
import { prismaQuery } from '@/functions/prismaQuery';


interface PrismaDataFetcherProps<
    TModel extends Prisma.ModelName,
    TOp extends typeof PrismaOperations[number]
> extends React.PropsWithChildren {
    table: TModel,
    operation: TOp,
    args?: Prisma.TypeMap["model"][TModel]["operations"][TOp]["args"],
}

export function PrismaDataFetcher<
    TModel extends Prisma.ModelName,
    TOp extends typeof PrismaOperations[number]
>(props: PrismaDataFetcherProps<TModel, TOp>) {
    const { table, operation, args, children } = props;
    const [data, setData] = React.useState<unknown>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    // Fetch data from Prisma based on the provided props
    React.useEffect(() => {
        const fetchData = async () => {
            if (!table || !operation) {
                setError('Please select a table and an operation to execute.');
                setLoading(false);
                return;
            }
            try {
                const data = await prismaQuery(table, operation, args);
                setData(data);
            } catch (error: unknown) {
                console.error("Error executing Prisma query:", error);
                setError(`Error executing query: ${error instanceof Error ? error.message : String(error)}`);
            }

            setLoading(false);
        }
        fetchData();
    }, [table, operation, args]);

    if (!table || !operation) {
        return children;
    }

    return (
        <DataProvider name={`${table}${operation}`} data={{ data, error, loading }}>
            {children}
        </DataProvider>
    );
}
