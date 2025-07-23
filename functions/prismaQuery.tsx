'use server';

import prisma, { PrismaQueryOperationType }from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type PrismaQueryOperationType =  typeof PrismaQueryOperationType[number];

export const prismaQuery = async <
    TModel extends Prisma.ModelName,
    TOp extends PrismaQueryOperationType
>(
    table: TModel,
    operation: TOp,
    args?: Prisma.TypeMap["model"][TModel]["operations"][TOp]["args"],
) => {
    // check if method exists
    if (!(operation in prisma[table as Prisma.TypeMap["meta"]["modelProps"]])) {
        return 'Please select a table and an operation to execute.';
    }

    let result;
    try {
        // This cast is safe because we've verified the operation exists
        result = await prisma[table as Prisma.TypeMap["meta"]["modelProps"]][operation](args);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return `Error executing query ${error}`;
    }

    return result;
};