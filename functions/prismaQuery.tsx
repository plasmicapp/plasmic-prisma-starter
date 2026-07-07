'use server';

import prisma from "@/lib/prisma";
import { checkPermissions } from "@/lib/checkPermissions";
import { prismaModelToMethod, jsonLogicToPrismaWhere, flattenToUniqueWhere } from "@/lib/db-helpers";
import { PrismaQueryParams } from "@/lib/types";

// use rawArgs if you pass the args directly from the code, like in PrismaDataFetcher
export const prismaQuery = async (args?: PrismaQueryParams, rawArgs?: boolean) => {
    const { table, operation, ...payload } = args || {};
    const {
        where,
        orderBy,
        orderByDirection,
        take,
        skip,
        select,
        omit,
        include,
        data,
        cursorId,
        distinct,
    } = args || {};


    const methodName = prismaModelToMethod(table);
    if (!methodName || !operation || !(operation in prisma[methodName])) {
        return {
            error: 'Please select a table and an operation to execute.'
        };
    }
    if (!(await checkPermissions(operation))) {
        return {
            error: 'You do not have permission to perform this operation.'
        }
    }


    const toFields = (fields?: string[]) =>
        fields?.length ? Object.fromEntries(fields.map(f => [f, true])) : undefined;

    const parsedArgs = Object.fromEntries(
        Object.entries({
            where: where ? flattenToUniqueWhere(jsonLogicToPrismaWhere(where)) : undefined,
            orderBy: orderBy ? { [orderBy]: orderByDirection ?? 'asc' } : undefined,
            take,
            skip,
            select:   toFields(select),
            omit:     toFields(omit),
            include:  toFields(include),
            data,
            cursor:   cursorId ? { id: cursorId } : undefined,
            distinct: distinct?.length ? distinct : undefined,
        }).filter(([, v]) => v !== undefined)
    );

    let result;
    try {
        // @ts-expect-error The union is too hard to check for TS
        result = await prisma[methodName][operation](rawArgs ? payload : parsedArgs);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return {
            error: `Error executing query ${error}`
        };
    }

    return result;
};
