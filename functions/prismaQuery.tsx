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
    where?: Record<string, unknown>,
    _orderBy?: string,
    _orderByDirection?: 'asc' | 'desc',
    take?: number,
    skip?: number,
    _select?: string[],
    _omit?: string[],
    _include?: string[],
    _cursorId?: string,
    _distinct?: string[],
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

    // Build structured args from the individual Plasmic params, falling back to
    // the legacy `args` object if the structured fields are not set.
    const orderBy = _orderBy
        ? { [_orderBy]: _orderByDirection ?? 'asc' }
        : undefined;
    const select = _select?.length
        ? Object.fromEntries(_select.map(f => [f, true]))
        : undefined;
    const omit = _omit?.length
        ? Object.fromEntries(_omit.map(f => [f, true]))
        : undefined;
    const include = _include?.length
        ? Object.fromEntries(_include.map(f => [f, true]))
        : undefined;
    const cursor = _cursorId ? { id: _cursorId } : undefined;
    const distinct = _distinct?.length ? _distinct : undefined;

    const resolvedArgs = (args ?? {}) as Record<string, unknown>;
    const finalArgs = {
        ...resolvedArgs,
        ...(where !== undefined && { where }),
        ...(orderBy !== undefined && { orderBy }),
        ...(take !== undefined && { take }),
        ...(skip !== undefined && { skip }),
        ...(select !== undefined && { select }),
        ...(omit !== undefined && { omit }),
        ...(include !== undefined && { include }),
        ...(cursor !== undefined && { cursor }),
        ...(distinct !== undefined && { distinct }),
    };

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