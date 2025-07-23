import prisma from "@/lib/prisma";
import { DataProvider } from "@plasmicapp/loader-nextjs";
import { Prisma } from "@prisma/client";

export const PrismaQueryOperationType = {
    findUnique: 'findUnique',
    findMany: 'findMany',
    findFirst: 'findFirst',
    aggregate: 'aggregate',
    count: 'count'
}

export type PrismaQueryOperationType = keyof typeof PrismaQueryOperationType;

export const PrismaQuery = async <
    TModel extends Prisma.ModelName,
    TOp extends PrismaQueryOperationType
>(props: {
    table: Prisma.TypeMap["meta"]["modelProps"]
    operation: TOp;
    args?: Prisma.TypeMap["model"][TModel]["operations"][TOp]["args"];
    children?: React.ReactNode;
}) => {
    const { table, operation, children, args } = props;
    // check if method exists
    if (!(operation in prisma[table])) {
        return 'Please select a table and an operation to execute.';
    }

    let result;
    // Execute the operation
    try {
        // This cast is safe because we've verified the operation exists
        const prismaMethod = prisma[table][operation];
        result = await prismaMethod(args);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return `Error executing query`;
    }

    return (
        <DataProvider data={result}>
            {children}
        </DataProvider>
    );
};