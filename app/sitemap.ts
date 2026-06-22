import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { PLASMIC } from "@/plasmic-init";

type SitemapFieldsSource = {
  lastModified?: unknown;
  changeFrequency?: unknown;
  priority?: unknown;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

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
    },
  }));

  const plasmicPages = await PLASMIC.fetchPages();

  return [...plasmicPages, ...postsPages].map((page) => ({
    url: new URL(page.path, configuredUrl).toString(),
    ...getSitemapFields({ ...page.metadata } as SitemapFieldsSource),
  }));
}

const CHANGE_FREQUENCIES = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const;

function getSitemapFields(source: SitemapFieldsSource) {
  return {
    lastModified: getLastModified(source?.lastModified),
    changeFrequency: getChangeFrequency(source?.changeFrequency),
    priority: getPriority(source?.priority),
  };
}

function getLastModified(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return new Date();
}

function getChangeFrequency(value: unknown): (typeof CHANGE_FREQUENCIES)[number] {
  return typeof value === "string" &&
    CHANGE_FREQUENCIES.includes(value as (typeof CHANGE_FREQUENCIES)[number])
    ? (value as (typeof CHANGE_FREQUENCIES)[number])
    : "monthly";
}

function getPriority(value: unknown): number {
  const priority = Number(value ?? 1);
  return Number.isFinite(priority) ? priority : 1;
}
