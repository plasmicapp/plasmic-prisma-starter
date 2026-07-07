import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { PLASMIC } from "@/plasmic-init";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const posts = await prisma.post.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
  });

  const postsPages = posts.map((post) => ({
    path: `/posts/${post.id}`,
    metadata: {
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }
  }));

  const plasmicPages = await PLASMIC.fetchPages();

  return [...plasmicPages, ...postsPages].map((page) => ({
    lastModified: page.metadata?.lastModified || Date.now().toString(),
    changeFrequency: (page.metadata?.changeFrequency  || "weekly" ) as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: (page.metadata?.priority || 1) as number,
    url: new URL(page.path, configuredUrl).toString(),
  }));
}