import { renderPlasmicPage, resolvePlasmicMetadata } from "@/components/PlasmicPage";
import prisma from "@/lib/prisma";
import { Metadata, ResolvingMetadata } from "next";

export const revalidate = 60;

interface Params {
    id: string;
    postTitle: string;
}

interface PostPageProps {
    params: Promise<Params>;
}

/*
 * This is an example of how you can configure SSG for dynamic routes with Prisma and Plasmic.
 * The `generateStaticParams` function fetches all published posts from the database and generates static paths for them.
 **/
export async function generateStaticParams(): Promise<Params[]> {
    const posts = await prisma.post.findMany({
        where: { published: true },
        select: { id: true, title: true },
    });

    return posts.map((post) => ({
        id: String(post.id),
        postTitle: post.title,
    }));
}
/*
 * This is how you can override the metadata for a dynamic page.
 */
export async function generateMetadata(
    { params }: PostPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id, postTitle } = await params;

    if (!postTitle) {
        return parent as Promise<Metadata>;
    }
    const metadata = await resolvePlasmicMetadata(`/posts/${id}`, parent);

    return {
        ...metadata,
        title: `Post Page | ${postTitle}`,
    };
}

export default async function PostPage({ params }: PostPageProps) {
    const { id } = await params;
    return await renderPlasmicPage(`/posts/${id}`);
}
