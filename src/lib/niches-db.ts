import { prisma } from "@/lib/prisma";
import { NICHES, slugifyNiche, titleCaseNiche } from "@/lib/niches";

export interface NicheDTO {
  id: string;
  slug: string;
  labelEs: string;
  labelEn: string | null;
}

/**
 * Lista todos los nichos activos ordenados por `order` (y label alfabético).
 * Usado por NicheMultiSelect y filtros del marketplace.
 */
export async function listActiveNiches(): Promise<NicheDTO[]> {
  const niches = await prisma.niche.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { labelEs: "asc" }],
    select: { id: true, slug: true, labelEs: true, labelEn: true },
  });
  return niches;
}

/**
 * Asegura que exista un Niche con el slug dado. Si no existe, se crea con
 * un label derivado del input. Retorna el ID.
 */
export async function ensureNicheBySlug(
  slug: string,
  fallbackLabel?: string,
): Promise<string> {
  const existing = await prisma.niche.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) return existing.id;

  const labelEs = fallbackLabel?.trim() || titleCaseNiche(slug);
  const created = await prisma.niche.create({
    data: { slug, labelEs },
    select: { id: true },
  });
  return created.id;
}

/**
 * Normaliza un array de inputs libres (slugs o labels mezclados) a slugs
 * canónicos únicos. Util para recibir del form y transformar.
 */
export function normalizeSlugs(input: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const raw of input) {
    const slug = slugifyNiche(raw);
    if (slug) seen.add(slug);
  }
  return [...seen];
}

/**
 * Reemplaza todas las asociaciones CreatorNiche de un creador con la lista
 * dada de slugs. Crea Niche nuevos si algún slug no existe.
 */
export async function setCreatorNiches(
  creatorId: string,
  slugs: string[],
): Promise<void> {
  const canonical = normalizeSlugs(slugs);

  // Asegurar que todos los Niche existen (en paralelo).
  const ids = await Promise.all(
    canonical.map((slug) => ensureNicheBySlug(slug)),
  );

  await prisma.$transaction([
    prisma.creatorNiche.deleteMany({ where: { creatorId } }),
    prisma.creatorNiche.createMany({
      data: ids.map((nicheId) => ({ creatorId, nicheId })),
      skipDuplicates: true,
    }),
  ]);
}

/** Mismo patrón para Campaign.requiredNiches */
export async function setCampaignNiches(
  campaignId: string,
  slugs: string[],
): Promise<void> {
  const canonical = normalizeSlugs(slugs);
  const ids = await Promise.all(
    canonical.map((slug) => ensureNicheBySlug(slug)),
  );

  await prisma.$transaction([
    prisma.campaignNiche.deleteMany({ where: { campaignId } }),
    prisma.campaignNiche.createMany({
      data: ids.map((nicheId) => ({ campaignId, nicheId })),
      skipDuplicates: true,
    }),
  ]);
}

/** Siembra la tabla Niche con los nichos canónicos (idempotente). */
export async function seedCanonicalNiches(): Promise<void> {
  for (let i = 0; i < NICHES.length; i++) {
    const label = NICHES[i];
    const slug = slugifyNiche(label);
    await prisma.niche.upsert({
      where: { slug },
      create: { slug, labelEs: label, order: i },
      update: { labelEs: label, order: i, active: true },
    });
  }
}
