import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const creators = await prisma.creator.findMany({
    where: {
      profileStatus: "PUBLISHED",
      profileVisibility: "PUBLIC",
      slug: { not: null },
    },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const creatorEntries: MetadataRoute.Sitemap = creators
    .filter((c): c is { slug: string; updatedAt: Date } => Boolean(c.slug))
    .map((c) => ({
      url: `${BASE_URL}/@${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    { url: `${BASE_URL}/talento`, changeFrequency: "daily", priority: 1 },
    ...creatorEntries,
  ];
}
