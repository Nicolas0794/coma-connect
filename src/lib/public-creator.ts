import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

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
        take: 20,
      },
      _count: {
        select: {
          reviews: { where: { isPublic: true } },
          campaignCreators: true,
        },
      },
    },
  });
}

export type SortKey = "relevant" | "verified" | "recent" | "complete";

export interface DiscoveryFilters {
  q?: string;
  city?: string;
  niche?: string;
  type?: string;
  format?: string;
  availability?: string;
  verifiedOnly?: boolean;
  minFollowers?: number;
  minRating?: number;
  sort?: SortKey;
  limit?: number;
  offset?: number;
}

function buildWhere(filters: DiscoveryFilters): Prisma.CreatorWhereInput {
  const where: Prisma.CreatorWhereInput = {
    profileStatus: "PUBLISHED",
    profileVisibility: "PUBLIC",
  };

  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { artistName: { contains: q, mode: "insensitive" } },
      { headline: { contains: q, mode: "insensitive" } },
      { valuePitch: { contains: q, mode: "insensitive" } },
      { niches: { has: q.toLowerCase() } },
    ];
  }

  if (filters.city) {
    where.city = { equals: filters.city, mode: "insensitive" };
  }
  if (filters.niche) {
    where.niches = { has: filters.niche.toLowerCase() };
  }
  if (filters.type) {
    where.creatorTypes = { has: filters.type as never };
  }
  if (filters.format) {
    where.contentFormats = { has: filters.format as never };
  }
  if (filters.availability) {
    where.availability = filters.availability as never;
  }
  if (filters.verifiedOnly) {
    where.comaVerifiedAt = { not: null };
  }
  if (filters.minFollowers && filters.minFollowers > 0) {
    where.socialProfiles = {
      some: { verifiedFollowers: { gte: filters.minFollowers } },
    };
  }
  if (filters.minRating && filters.minRating > 0) {
    where.avgRating = { gte: filters.minRating };
  }

  return where;
}

function buildOrderBy(sort: SortKey): Prisma.CreatorOrderByWithRelationInput[] {
  switch (sort) {
    case "verified":
      return [
        { comaVerifiedAt: { sort: "desc", nulls: "last" } },
        { profileCompleteness: "desc" },
      ];
    case "recent":
      return [{ publishedAt: { sort: "desc", nulls: "last" } }];
    case "complete":
      return [{ profileCompleteness: "desc" }, { publishedAt: "desc" }];
    case "relevant":
    default:
      return [
        { comaVerifiedAt: { sort: "desc", nulls: "last" } },
        { profileCompleteness: "desc" },
        { publishedAt: { sort: "desc", nulls: "last" } },
      ];
  }
}

export async function searchPublicCreators(filters: DiscoveryFilters) {
  const where = buildWhere(filters);
  const orderBy = buildOrderBy(filters.sort ?? "relevant");
  const limit = Math.max(1, Math.min(filters.limit ?? 24, 100));
  const offset = Math.max(0, filters.offset ?? 0);

  const [items, total] = await Promise.all([
    prisma.creator.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
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
        avgRating: true,
        reviewsCount: true,
        socialProfiles: {
          select: { platform: true, verifiedFollowers: true },
          orderBy: { verifiedFollowers: { sort: "desc", nulls: "last" } },
          take: 1,
        },
      },
    }),
    prisma.creator.count({ where }),
  ]);

  return { items, total, limit, offset };
}

export function averageRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export interface CreatorBadge {
  key: string;
  emoji: string;
  label: string;
  description: string;
}

type BadgeInput = {
  avgRating: number | null;
  reviewsCount: number;
  campaignsCount: number;
  comaVerifiedAt: Date | null;
  publishedAt: Date | null;
};

export function getDerivedBadges(input: BadgeInput): CreatorBadge[] {
  const badges: CreatorBadge[] = [];
  const { avgRating, reviewsCount, campaignsCount, comaVerifiedAt, publishedAt } = input;

  if (avgRating === 5 && reviewsCount >= 3) {
    badges.push({
      key: "perfect",
      emoji: "💯",
      label: "Rating perfecto",
      description: `${reviewsCount} reseñas con 5⭐`,
    });
  } else if (avgRating != null && avgRating >= 4.5 && reviewsCount >= 3) {
    badges.push({
      key: "top",
      emoji: "🏆",
      label: "Top rated",
      description: `${avgRating.toFixed(1)}⭐ promedio (${reviewsCount} reseñas)`,
    });
  }

  if (campaignsCount >= 10) {
    badges.push({
      key: "veterana",
      emoji: "💎",
      label: "Veterana",
      description: `${campaignsCount} campañas ejecutadas`,
    });
  }

  if (comaVerifiedAt && publishedAt) {
    const daysSincePublished =
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 30 && campaignsCount < 3) {
      badges.push({
        key: "new",
        emoji: "🌱",
        label: "Nueva en CoMa",
        description: "Perfil reciente",
      });
    }
  }

  return badges;
}
