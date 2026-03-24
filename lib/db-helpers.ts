import { Prisma } from '@prisma/client';
import prisma from "@/lib/prisma";

/**
 * https://github.com/prisma/prisma/issues/11940#issuecomment-3106962088
 */
export function prismaModelToMethod(self: Prisma.ModelName) {
    return (self.substring(0, 1).toLowerCase() + self.substring(1)) as keyof typeof prisma;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Extract the field name from a JsonLogic var node: {"var": "fieldName"} */
function varOf(x: unknown): string | null {
    return typeof x === 'object' && x !== null && 'var' in x
        ? String((x as { var: unknown }).var)
        : null;
}

/**
 * Resolve [field, value] from a binary arg pair where exactly one side is a var node.
 * Handles both [{"var": "field"}, value] and [value, {"var": "field"}].
 */
function fieldAndValue(args: unknown[]): [string, unknown] | null {
    const [left, right] = args;
    const lv = varOf(left), rv = varOf(right);
    if (lv) return [lv, right];
    if (rv) return [rv, left];
    return null;
}

/** Coerce "YYYY-MM-DD[ HH:mm:ss]" strings to Date objects for Prisma DateTime fields. */
function toDate(v: unknown): unknown {
    if (typeof v !== 'string') return v;
    if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2}(\.\d+)?)?$/.test(v)) {
        const d = new Date(v.replace(' ', 'T'));
        if (!isNaN(d.getTime())) return d;
    }
    return v;
}

/** Extract the values array from RAQB's multiselect condition: {"in": [{"var": ""}, [...]]} */
function multiselectVals(cond: unknown): unknown[] | null {
    if (typeof cond !== 'object' || cond === null || !('in' in cond)) return null;
    const [, vals] = (cond as { in: unknown[] }).in;
    return Array.isArray(vals) ? vals : null;
}

// ─── op maps ────────────────────────────────────────────────────────────────

/** JsonLogic op → Prisma scalar filter key, for simple binary [field, value] ops */
const SCALAR_OPS: Record<string, string> = {
    '==': 'equals',
    '!=': 'not',
    '<':  'lt',      '<=': 'lte',
    '>':  'gt',      '>=': 'gte',
    startsWith: 'startsWith',
    endsWith:   'endsWith',
};

/** RAQB multiselect op → Prisma array filter key */
const ARRAY_OPS: Record<string, string> = {
    some: 'hasSome',
    all:  'hasEvery',
};

// ─── main ───────────────────────────────────────────────────────────────────

/** Convert a JsonLogic rule (from Plasmic's queryBuilder) into a Prisma `where` object. */
export function jsonLogicToPrismaWhere(logic: unknown): Record<string, unknown> {
    if (typeof logic !== 'object' || logic === null) return {};
    const entries = Object.entries(logic as Record<string, unknown>);
    if (!entries.length) return {};
    const [op, args] = entries[0];
    const a = Array.isArray(args) ? args : [];

    // and/or → AND/OR (recurse into each clause)
    if (op === 'and') return { AND: a.map(jsonLogicToPrismaWhere) };
    if (op === 'or')  return { OR:  a.map(jsonLogicToPrismaWhere) };

    // ! → NOT / is_empty,  !! → is_not_empty
    if (op === '!' || op === '!!') {
        const inner = a.length === 1 ? a[0] : args;
        const field = varOf(inner);
        if (field) return op === '!' ? { [field]: { equals: '' } } : { NOT: { [field]: { equals: '' } } };
        return op === '!' ? { NOT: jsonLogicToPrismaWhere(inner) } : {};
    }

    // between: { "<=": [lo, {"var": "field"}, hi] } — 3-arg form only
    if (op === '<=' && a.length === 3) {
        const field = varOf(a[1]);
        if (field) return { [field]: { gte: toDate(a[0]), lte: toDate(a[2]) } };
    }

    // multiselect: some → hasSome, all → hasEvery, none → NOT hasSome
    // Shape: { "some"|"all"|"none": [{"var": "field"}, {"in": [{"var": ""}, [vals]]}] }
    if ((op === 'some' || op === 'all' || op === 'none') && a.length === 2) {
        const field = varOf(a[0]);
        const vals = multiselectVals(a[1]);
        if (field && vals) {
            if (op === 'none') return { NOT: { [field]: { hasSome: vals } } };
            return { [field]: { [ARRAY_OPS[op]]: vals } };
        }
    }

    // in: select_any_in → { field: { in: [vals] } }  or  like/contains → { field: { contains: val } }
    if (op === 'in' && a.length === 2) {
        const fieldLeft = varOf(a[0]), fieldRight = varOf(a[1]);
        if (fieldLeft  && Array.isArray(a[1])) return { [fieldLeft]:  { in: a[1] } };
        if (fieldRight)                         return { [fieldRight]: { contains: a[0] } };
    }

    // matches/regexp → case-insensitive contains (Prisma has no native SQL regex)
    if ((op === 'matches' || op === 'regexp') && a.length === 2) {
        const fv = fieldAndValue(a);
        if (fv) return { [fv[0]]: { contains: fv[1], mode: 'insensitive' } };
    }

    // proximity → all words must be contained (Prisma has no proximity filter)
    // Shape: { "proximity": [{"var": "field"}, word1, word2, distance?] }
    if (op === 'proximity' && a.length >= 3) {
        const field = varOf(a[0]);
        const words = a.slice(1).filter((x): x is string => typeof x === 'string');
        if (field && words.length) return { AND: words.map(w => ({ [field]: { contains: w } })) };
    }

    // Scalar comparisons: ==, !=, <, <=, >, >=, startsWith, endsWith
    if (op in SCALAR_OPS && a.length === 2) {
        const fv = fieldAndValue(a);
        if (fv) {
            const [field, value] = fv;
            if (value === null) return SCALAR_OPS[op] === 'not' ? { [field]: { not: null } } : { [field]: null };
            return { [field]: { [SCALAR_OPS[op]]: toDate(value) } };
        }
    }

    return {};
}


/**
 * `findUnique`/`findUniqueOrThrow` require a flat `WhereUniqueInput`:
 *   { id: 4 }  — NOT { AND: [{ id: { equals: 4 } }] }
 *
 * Recursively walks AND/OR branches at any depth, collects all leaf field
 * conditions, and unwraps single-key `{ equals: val }` back to plain values.
 */
function collectConditions(where: Record<string, unknown>): Record<string, unknown> {
    if ('AND' in where && Array.isArray(where.AND)) {
        return Object.assign({}, ...where.AND.map(c => collectConditions(c as Record<string, unknown>)));
    }
    if ('OR' in where && Array.isArray(where.OR)) {
        return Object.assign({}, ...where.OR.map(c => collectConditions(c as Record<string, unknown>)));
    }
    return Object.fromEntries(
        Object.entries(where).map(([k, v]) => {
            if (typeof v === 'object' && v !== null && 'equals' in v && Object.keys(v as object).length === 1) {
                return [k, (v as { equals: unknown }).equals];
            }
            return [k, v];
        }),
    );
}

export function flattenToUniqueWhere(where: Record<string, unknown>): Record<string, unknown> {
    return collectConditions(where);
}

