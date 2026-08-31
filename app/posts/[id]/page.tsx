import { renderPlasmicPage, resolvePlasmicMetadata } from "@/components/PlasmicPage";
import { Metadata, ResolvingMetadata } from "next";

// Post data is database-backed, so resolve these pages in the Vercel runtime
// instead of requiring database access from the build worker.
export const dynamic = "force-dynamic";

interface Params {
    id: string;
}

interface PostPageProps {
    params: Promise<Params>;
}

/*
 * This is how you can override the metadata for a dynamic page.
 */
export async function generateMetadata(
    { params }: PostPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const metadata = await resolvePlasmicMetadata(`/posts/${id}`, parent);

    if (!metadata) {
        return parent as Promise<Metadata>;
    }
    return metadata;
}

export default async function PostPage({ params }: PostPageProps) {
    const { id } = await params;
    return await renderPlasmicPage(`/posts/${id}`);
}
