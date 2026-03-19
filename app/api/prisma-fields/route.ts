import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { PRISMA_TYPE_TO_QUERY_BUILDER } from '@/lib/types';


/** "createdAt" → "Created At", "userId" → "User Id" */
const toLabel = (name: string) =>
    name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
const getModel = (modelName?: Prisma.ModelName) =>
    modelName ? Prisma.dmmf.datamodel.models.find(m => m.name === modelName) : undefined;
const toOptions = (f: { name: string }) => ({ value: f.name, label: toLabel(f.name) });
const toFields = (kind: string, model: Prisma.DMMF.Model) =>
    model.fields.filter(f => f.kind === kind).map(toOptions);

/** Prisma enum name → RAQB listValues for select widgets */
const enumListValues = (enumName: string) =>
    (Prisma.dmmf.datamodel.enums.find(e => e.name === enumName)?.values ?? [])
        .map(v => ({ value: v.name, title: v.name }));

export async function GET(request: NextRequest) {
    const models = Prisma.dmmf.datamodel.models.map(toOptions);
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
