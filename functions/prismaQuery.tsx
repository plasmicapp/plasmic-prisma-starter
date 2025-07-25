'use server';

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkPermissions } from "@/lib/checkPermissions";
import { PrismaOperations } from "@/lib/types";
import { tableNameToMethodName } from "@/lib/db-helpers";

export const prismaQuery = async <
    TModel extends Prisma.ModelName,
    TOp extends typeof PrismaOperations[number]
>(
    table: TModel,
    operation: TOp,
    args?: Prisma.TypeMap["model"][TModel]["operations"][TOp]["args"],
) => {
    if (!(await checkPermissions(operation))) {
        return {
            error: 'You do not have permission to perform this operation.'
        }
    }
    
    const methodName = tableNameToMethodName(table || '');
    // check if method exists
    if (!methodName || !(operation in prisma[methodName])) {
        return {
            error: 'Please select a table and an operation to execute.'
        };
    }

    let result;
    try {
        // This cast is safe because we've verified the operation exists
        // @ts-expect-error - The union is too hard for TS to type check
        result = await prisma[methodName][operation](args);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return {
            error: `Error executing query ${error}`
        };
    }

    return result;
};