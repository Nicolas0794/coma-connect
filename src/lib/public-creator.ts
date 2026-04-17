import { prisma } from "@/lib/prisma";

export async function findPublicCreatorBySlug(slug: string) {
  return prisma.creator.findFirst({
    where: {
      slug,
      profileStatus: "PUBLISHED",
      profileVisibility: { in: ["PUBLIC", "CLIENTS_ONLY"] },
    },
    include: {
      socialProfiles: true,
      services: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
      portfolioItems: {
        orderBy: [{ isFeatured: "desc" }, { order: "asc" }],
      },
      reviews: {
        where: { isPublic: true },
        include: { client: { select: { name: true, logoUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      _count: { select: { reviews: true, campaignCreators: true } },
    },
  });
}

export async function listPublicCreators(filters: {
  city?: string;
  niche?: string;
  type?: string;
  limit?: number;
}) {
  const { city, niche, type, limit = 48 } = filters;

  return prisma.creator.findMany({
    where: {
      profileStatus: "PUBLISHED",
      profileVisibility: "PUBLIC",
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(niche ? { niches: { has: niche } } : {}),
      ...(type ? { creatorTypes: { has: type as never } } : {}),
    },
    select: {
      id: true,
      slug: true,
      fullName: true,
      artistName: true,
      headline: true,
      city: true,
      country: true,
      profileImageUrl: true,
      niches: true,
      creatorTypes: true,
      comaVerifiedAt: true,
      availability: true,
    },
    orderBy: [{ comaVerifiedAt: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }],
    take: limit,
  });
}

export function averageRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
