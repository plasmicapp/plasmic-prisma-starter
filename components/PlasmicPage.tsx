import { PLASMIC } from "@/plasmic-init";
import { PlasmicClientRootProvider } from "@/plasmic-init-client";
import {
    ComponentRenderData,
    PlasmicComponent,
} from "@plasmicapp/loader-nextjs";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

export interface PlasmicPageProps {
    pagePath: string;
    componentData: ComponentRenderData;
}

export async function generatePlasmicMetadata(
    componentData: ComponentRenderData | undefined,
    parent: ResolvingMetadata
): Promise<Metadata> {
    if (!componentData) {
        return parent as Promise<Metadata>;
    }
    const pageMeta = componentData.entryCompMetas[0];
    const metadata = await PLASMIC.unstable__generateMetadata(componentData, {
        params: pageMeta.params ?? {},
        query: {},
    });
    return { ...(await parent), ...metadata };
}

export async function fetchPageData(
    pagePath: string
): Promise<{ pagePath: string; componentData?: ComponentRenderData }> {
    const componentData = await PLASMIC.maybeFetchComponentData(pagePath);
    if (!componentData || componentData.entryCompMetas.length === 0) {
        return { pagePath };
    }
    return { pagePath, componentData };
}

export async function resolvePlasmicMetadata(
    pagePath: string,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { componentData } = await fetchPageData(pagePath);
    return generatePlasmicMetadata(componentData, parent);
}

export async function renderPlasmicPage(pagePath: string) {
    const { componentData } = await fetchPageData(pagePath);
    if (!componentData) {
        notFound();
    }
    return <PlasmicPage pagePath={pagePath} componentData={componentData} />;
}

export default async function PlasmicPage({
    pagePath,
    componentData,
}: PlasmicPageProps) {
    const pageMeta = componentData.entryCompMetas[0];
    const prefetchedQueryData = await PLASMIC.unstable__getServerQueriesData(
        componentData,
        {
            pagePath,
            params: pageMeta.params,
            query: {},
        }
    );

    return (
        <PlasmicClientRootProvider
            prefetchedData={componentData}
            prefetchedQueryData={prefetchedQueryData}
            pageParams={pageMeta.params}
        >
            <PlasmicComponent component={pageMeta.displayName} />
        </PlasmicClientRootProvider>
    );
}
