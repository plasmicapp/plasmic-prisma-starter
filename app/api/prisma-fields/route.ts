import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import { PRISMA_TYPE_TO_QUERY_BUILDER } from '@/lib/types';

type PrismaRuntimeField = {
    name: string;
    kind: string;
    type: string;
};

type PrismaRuntimeModel = {
    fields: PrismaRuntimeField[];
};

type PrismaRuntimeDataModel = {
    models: Record<string, PrismaRuntimeModel>;
    enums: Record<string, { values: { name: string }[] }>;
};

const getRuntimeDataModel = () =>
    (prisma as unknown as { _runtimeDataModel: PrismaRuntimeDataModel })._runtimeDataModel;

/** "createdAt" → "Created At", "userId" → "User Id" */
const toLabel = (name: string) =>
    name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
const getModel = (modelName?: Prisma.ModelName) =>
    modelName ? getRuntimeDataModel().models[modelName] : undefined;
const toOptions = (f: { name: string }) => ({ value: f.name, label: toLabel(f.name) });
const toFields = (kind: string, model: PrismaRuntimeModel) =>
    model.fields.filter(f => f.kind === kind).map(toOptions);

/** Prisma enum name → RAQB listValues for select widgets */
const enumListValues = (enumName: string) =>
    (getRuntimeDataModel().enums[enumName]?.values ?? [])
        .map(v => ({ value: v.name, title: v.name }));

export async function GET(request: NextRequest) {
    const runtimeDataModel = getRuntimeDataModel();
    const models = Object.keys(runtimeDataModel.models).map(name => ({ value: name, label: toLabel(name) }));
    const defaultResponse = { models, whereFields: {}, scalarFields: [], enumFields: [], objectFields: [] };
    const modelName = new URL(request.url).searchParams.get('model');
    const model = getModel(modelName as Prisma.ModelName);

    if (!modelName || !model) return NextResponse.json(defaultResponse);

    return NextResponse.json({
        models,
        whereFields: Object.fromEntries(
            model.fields
                .filter(f => f.kind === 'scalar' || f.kind === 'enum')
                .map(f => {
                    const isEnum = f.kind === 'enum';
                    const type = isEnum ? 'select' : (PRISMA_TYPE_TO_QUERY_BUILDER[f.type] ?? 'text');
                    const fieldSettings = isEnum ? { listValues: enumListValues(f.type) } : {};
                    return [f.name, { label: toLabel(f.name), type, fieldSettings }];
                }),
        ),
        scalarFields: toFields('scalar', model),
        enumFields:   toFields('enum', model),
        objectFields: toFields('object', model),
    });
}
