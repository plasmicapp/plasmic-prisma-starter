'use server';

import prisma from "@/lib/prisma";
import { checkPermissions } from "@/lib/checkPermissions";
import { prismaModelToMethod, jsonLogicToPrismaWhere, flattenToUniqueWhere } from "@/lib/db-helpers";
import { PrismaQueryParams } from "@/lib/types";

export const prismaQuery = async ({
    table,
    operation,
    where,
    orderBy,
    orderByDirection,
    take,
    skip,
    select,
    omit,
    include,
    cursorId,
    distinct,
}: PrismaQueryParams) => {
    if (!(await checkPermissions(operation))) {
        return {
            error: 'You do not have permission to perform this operation.'
        }
    }

    const methodName = prismaModelToMethod(table || '');
    if (!methodName || !(operation in prisma[methodName])) {
        return {
            error: 'Please select a table and an operation to execute.'
        };
    }

    const toFields = (fields?: string[]) =>
        fields?.length ? Object.fromEntries(fields.map(f => [f, true])) : undefined;

    const finalArgs = Object.fromEntries(
        Object.entries({
            where: where ? flattenToUniqueWhere(jsonLogicToPrismaWhere(where)) : undefined,
            orderBy: orderBy ? { [orderBy]: orderByDirection ?? 'asc' } : undefined,
            take,
            skip,
            select:   toFields(select),
            omit:     toFields(omit),
            include:  toFields(include),
            cursor:   cursorId ? { id: cursorId } : undefined,
            distinct: distinct?.length ? distinct : undefined,
        }).filter(([, v]) => v !== undefined)
    );

    let result;
    try {
        const delegate = prisma[methodName] as Record<string, (args: unknown) => Promise<unknown>>;
        result = await delegate[operation](finalArgs);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return {
            error: `Error executing query ${error}`
        };
    }

    /**
     * If you want prismaQuery to return typed results, you can add generic type parameters to the PrismaQueryParams
     * And then cast the result here like this: 
     * result as Prisma.TypeMap['model'][TModel]['operations'][TOp]['result'];
    */
    return result;
};
