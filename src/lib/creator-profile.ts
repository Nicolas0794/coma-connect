import { prisma } from "@/lib/prisma";
import type { Creator } from "@/generated/prisma/client";

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateUniqueSlug(
  name: string,
  excludeCreatorId?: string,
): Promise<string> {
  const base = slugify(name) || "creador";
  let slug = base;
  let attempt = 1;

  while (true) {
    const existing = await prisma.creator.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeCreatorId) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

type CompletenessInput = Pick<
  Creator,
  | "fullName"
  | "artistName"
  | "headline"
  | "valuePitch"
  | "bio"
  | "profileImageUrl"
  | "city"
  | "country"
  | "niches"
  | "creatorTypes"
  | "contentFormats"
  | "languages"
> & {
  socialProfilesCount: number;
  portfolioItemsCount: number;
  servicesCount: number;
};

const COMPLETENESS_WEIGHTS: Array<[keyof CompletenessInput | "has", number, (v: CompletenessInput) => boolean]> = [
  ["has", 10, (v) => Boolean(v.profileImageUrl)],
  ["has", 10, (v) => Boolean(v.headline)],
  ["has", 10, (v) => Boolean(v.valuePitch || v.bio)],
  ["has", 5, (v) => Boolean(v.artistName)],
  ["has", 5, (v) => Boolean(v.city && v.country)],
  ["has", 10, (v) => v.niches.length > 0],
  ["has", 10, (v) => v.creatorTypes.length > 0],
  ["has", 5, (v) => v.contentFormats.length > 0],
  ["has", 5, (v) => v.languages.length > 0],
  ["has", 15, (v) => v.socialProfilesCount > 0],
  ["has", 10, (v) => v.portfolioItemsCount >= 3],
  ["has", 5, (v) => v.servicesCount > 0],
];

export function calculateCompleteness(input: CompletenessInput): number {
  let score = 0;
  for (const [, weight, check] of COMPLETENESS_WEIGHTS) {
    if (check(input)) score += weight;
  }
  return Math.min(100, score);
}

export async function recomputeCreatorCompleteness(creatorId: string): Promise<number> {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      _count: {
        select: {
          socialProfiles: true,
          portfolioItems: true,
          services: true,
        },
      },
    },
  });

  if (!creator) return 0;

  const completeness = calculateCompleteness({
    fullName: creator.fullName,
    artistName: creator.artistName,
    headline: creator.headline,
    valuePitch: creator.valuePitch,
    bio: creator.bio,
    profileImageUrl: creator.profileImageUrl,
    city: creator.city,
    country: creator.country,
    niches: creator.niches,
    creatorTypes: creator.creatorTypes,
    contentFormats: creator.contentFormats,
    languages: creator.languages,
    socialProfilesCount: creator._count.socialProfiles,
    portfolioItemsCount: creator._count.portfolioItems,
    servicesCount: creator._count.services,
  });

  await prisma.creator.update({
    where: { id: creatorId },
    data: { profileCompleteness: completeness },
  });

  return completeness;
}
