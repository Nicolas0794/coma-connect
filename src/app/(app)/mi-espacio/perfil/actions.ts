"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recomputeCreatorCompleteness } from "@/lib/creator-profile";

async function requireCreator() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
  });
  if (!creator) redirect("/mi-espacio");
  return creator;
}

function pickArray<T extends string>(formData: FormData, key: string, allowed: T[]): T[] {
  const raw = formData.getAll(key).map((v) => String(v));
  return raw.filter((v): v is T => allowed.includes(v as T));
}

const CREATOR_TYPES = [
  "UGC", "INFLUENCER", "FILMMAKER", "PHOTOGRAPHER", "EDITOR",
  "STRATEGIST", "COPYWRITER", "DESIGNER", "MODEL",
] as const;
const CONTENT_FORMATS = [
  "REEL", "TIKTOK_VIDEO", "PHOTO", "LONG_VIDEO", "CAROUSEL",
  "LIVE", "PODCAST", "BLOG",
] as const;
const LANGUAGES = ["ES", "EN", "PT"] as const;
const AVAILABILITY = ["AVAILABLE", "LIMITED", "BUSY", "CLOSED"] as const;

export async function saveIdentity(formData: FormData) {
  const creator = await requireCreator();
  const artistName = ((formData.get("artistName") as string) ?? "").trim() || null;
  const headline = ((formData.get("headline") as string) ?? "").trim() || null;
  const valuePitch = ((formData.get("valuePitch") as string) ?? "").trim() || null;
  const profileImageUrl = ((formData.get("profileImageUrl") as string) ?? "").trim() || null;

  await prisma.creator.update({
    where: { id: creator.id },
    data: { artistName, headline, valuePitch, profileImageUrl },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function saveLocation(formData: FormData) {
  const creator = await requireCreator();
  const city = ((formData.get("city") as string) ?? "").trim() || null;
  const country = ((formData.get("country") as string) ?? "").trim() || null;

  await prisma.creator.update({
    where: { id: creator.id },
    data: { city, country },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function saveClassification(formData: FormData) {
  const creator = await requireCreator();
  const creatorTypes = pickArray(formData, "creatorTypes", [...CREATOR_TYPES]);
  const contentFormats = pickArray(formData, "contentFormats", [...CONTENT_FORMATS]);
  const languages = pickArray(formData, "languages", [...LANGUAGES]);
  const niches = ((formData.get("niches") as string) ?? "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
  const yrs = Number(formData.get("yearsOfExperience"));
  const yearsOfExperience = Number.isFinite(yrs) && yrs > 0 ? Math.floor(yrs) : null;

  await prisma.creator.update({
    where: { id: creator.id },
    data: { creatorTypes, contentFormats, languages, niches, yearsOfExperience },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function saveAvailability(formData: FormData) {
  const creator = await requireCreator();
  const raw = (formData.get("availability") as string) ?? "AVAILABLE";
  const availability = (AVAILABILITY as readonly string[]).includes(raw)
    ? (raw as (typeof AVAILABILITY)[number])
    : "AVAILABLE";
  const showPricing = formData.get("showPricing") === "on";
  const rateRaw = Number(formData.get("baseRateCOP"));
  const baseRateCOP = Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw : null;

  await prisma.creator.update({
    where: { id: creator.id },
    data: { availability, showPricing, baseRateCOP },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function saveSocialProfile(formData: FormData) {
  const creator = await requireCreator();
  const platform = (formData.get("platform") as string) === "TIKTOK" ? "TIKTOK" : "INSTAGRAM";
  const handle = ((formData.get("handle") as string) ?? "").trim().replace(/^@/, "");
  if (!handle) return;
  const url =
    platform === "INSTAGRAM"
      ? `https://instagram.com/${handle}`
      : `https://tiktok.com/@${handle}`;

  await prisma.creatorSocialProfile.upsert({
    where: { creatorId_platform: { creatorId: creator.id, platform } },
    update: { handle, url },
    create: { creatorId: creator.id, platform, handle, url },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function addPortfolioItem(formData: FormData) {
  const creator = await requireCreator();
  const title = ((formData.get("title") as string) ?? "").trim();
  if (!title) return;
  const externalUrl = ((formData.get("externalUrl") as string) ?? "").trim() || null;
  const coverImageUrl = ((formData.get("coverImageUrl") as string) ?? "").trim() || null;
  const brandName = ((formData.get("brandName") as string) ?? "").trim() || null;

  await prisma.portfolioItem.create({
    data: { creatorId: creator.id, title, externalUrl, coverImageUrl, brandName },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function removePortfolioItem(formData: FormData) {
  const creator = await requireCreator();
  const id = formData.get("id") as string;
  await prisma.portfolioItem.deleteMany({ where: { id, creatorId: creator.id } });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function addService(formData: FormData) {
  const creator = await requireCreator();
  const title = ((formData.get("title") as string) ?? "").trim();
  if (!title) return;
  const description = ((formData.get("description") as string) ?? "").trim() || null;
  const priceRaw = Number(formData.get("priceCOP"));
  const priceCOP = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : null;
  const daysRaw = Number(formData.get("deliveryDays"));
  const deliveryDays = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.floor(daysRaw) : null;

  await prisma.service.create({
    data: { creatorId: creator.id, title, description, priceCOP, deliveryDays },
  });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function removeService(formData: FormData) {
  const creator = await requireCreator();
  const id = formData.get("id") as string;
  await prisma.service.deleteMany({ where: { id, creatorId: creator.id } });
  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
}

export async function submitForReview() {
  const creator = await requireCreator();
  const fresh = await prisma.creator.findUnique({ where: { id: creator.id } });
  if (!fresh) return;
  if (fresh.profileCompleteness < 60) {
    redirect("/mi-espacio/perfil?error=incomplete");
  }
  await prisma.creator.update({
    where: { id: creator.id },
    data: { profileStatus: "PENDING_REVIEW" },
  });
  revalidatePath("/mi-espacio/perfil");
  redirect("/mi-espacio/perfil?sent=1");
}
