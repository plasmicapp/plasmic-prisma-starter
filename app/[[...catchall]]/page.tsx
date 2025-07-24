import { PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { notFound } from "next/navigation";
import { PLASMIC } from "@/plasmic-init";
import { PlasmicClientRootProvider } from "@/plasmic-init-client";

// Use revalidate if you want incremental static regeneration
export const revalidate = 3600;

export default async function PlasmicLoaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ catchall: string[] | undefined }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const plasmicComponentData = await fetchPlasmicComponentData(
    (
      await params
    )?.catchall,
    await params,
    searchParams
  );
  if (!plasmicComponentData) {
    notFound();
  }

  const { prefetchedData, $serverQueries } = plasmicComponentData;
  if (prefetchedData.entryCompMetas.length === 0) {
    notFound();
  }

  const pageMeta = prefetchedData.entryCompMetas[0];
  return (
    <PlasmicClientRootProvider
      prefetchedData={prefetchedData}
      pageParams={pageMeta.params}
    >
      <PlasmicComponent
        component={pageMeta.displayName}
        componentProps={{
          $serverQueries,
        }}
      />
    </PlasmicClientRootProvider>
  );
}

async function fetchPlasmicComponentData(
  catchall: string[] | undefined,
  params: { catchall: string[] | undefined },
  searchParams?: Promise<Record<string, string | string[]>>
) {
  const plasmicPath = "/" + (catchall ? catchall.join("/") : "");
  const prefetchedData = await PLASMIC.maybeFetchComponentData(plasmicPath);
  if (!prefetchedData) {
    notFound();
  }

  if (prefetchedData.entryCompMetas.length === 0) {
    notFound();
  }

  const pageMeta = prefetchedData.entryCompMetas[0];

  const $ctx = {
    pagePath: plasmicPath,
    params: pageMeta.params,
    query: searchParams,
  };

  const $serverQueries = await PLASMIC.unstable__getServerQueriesData(
    prefetchedData,
    $ctx
  );

  return { prefetchedData, $serverQueries };
}

export async function generateStaticParams() {
  const pageModules = await PLASMIC.fetchPages();
  return pageModules.map((mod) => {
    const catchall =
      mod.path === "/" ? undefined : mod.path.substring(1).split("/");
    return {
      catchall,
    };
  });
}