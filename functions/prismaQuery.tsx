'use server';

import prisma, { PrismaOperations, tableNameToMethodName } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const prismaQuery = async <
    TModel extends Prisma.ModelName,
    TOp extends typeof PrismaOperations[number]
>(
    table: TModel,
    operation: TOp,
    args?: Prisma.TypeMap["model"][TModel]["operations"][TOp]["args"],
) => {
    const methodName = tableNameToMethodName(table);
    // check if method exists
    if (!(operation in prisma[methodName])) {
        return 'Please select a table and an operation to execute.';
    }

    let result;
    try {
        // This cast is safe because we've verified the operation exists
        // @ts-expect-error - The union is too hard for TS to type check
        result = await prisma[methodName][operation](args);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return `Error executing query ${error}`;
    }

    return result;
};