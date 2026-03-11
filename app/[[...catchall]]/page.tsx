import { PLASMIC } from "@/plasmic-init";
import { renderPlasmicPage, resolvePlasmicMetadata } from "@/components/PlasmicPage";
import { Metadata, ResolvingMetadata } from "next";

export const revalidate = 60;

interface Params {
  /**
   * Array of path segments (e.g. `["a", "b"]` for "/a/b", or `undefined` if path is empty (i.e. "/").
   *
   * We use `undefined` instead of an empty array `[]` because Next.js converts
   * the empty array to `undefined` (not sure why they do that).
   */
  catchall: string[] | undefined;
}

export async function generateStaticParams(): Promise<Params[]> {
  const pageModules = await PLASMIC.fetchPages();
  return pageModules.map((mod) => {
    const catchall =
      mod.path === "/" ? undefined : mod.path.substring(1).split("/");
    return {
      catchall,
    };
  });
}

interface LoaderPageProps {
  params: Promise<Params>;
}

export async function generateMetadata(
  { params }: LoaderPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { catchall } = await params;
  const pagePath = catchall ? `/${catchall.join("/")}` : "/";
  const metadata = await resolvePlasmicMetadata(pagePath, parent);
  if (!metadata) {
    return parent as Promise<Metadata>;
  }
  return metadata;
}

export default async function PlasmicLoaderPage({ params }: LoaderPageProps) {
  const { catchall } = await params;
  const pagePath = catchall ? `/${catchall.join("/")}` : "/";
  return await renderPlasmicPage(pagePath);
}
