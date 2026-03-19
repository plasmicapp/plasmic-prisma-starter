'use server';

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkPermissions } from "@/lib/checkPermissions";
import { PrismaOperations } from "@/lib/types";
import { tableNameToMethodName, jsonLogicToPrismaWhere, flattenToUniqueWhere } from "@/lib/db-helpers";

export const prismaQuery = async <
    TModel extends Prisma.ModelName,
    TOp extends typeof PrismaOperations[number]
>(
    table: TModel,
    operation: TOp,
    where?: Record<string, unknown>,
    orderBy?: string,
    orderByDirection?: 'asc' | 'desc',
    take?: number,
    skip?: number,
    select?: string[],
    omit?: string[],
    include?: string[],
    cursorId?: string,
    distinct?: string[],
) => {
    if (!(await checkPermissions(operation))) {
        return {
            error: 'You do not have permission to perform this operation.'
        }
    }

    const methodName = tableNameToMethodName(table || '');
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
        // @ts-expect-error - The union is too hard for TS to type check
        result = await prisma[methodName][operation](finalArgs);
    } catch (error: unknown) {
        console.error("Error executing Prisma query:", error);
        return {
            error: `Error executing query ${error}`
        };
    }

    return result;
};