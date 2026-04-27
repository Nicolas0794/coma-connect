"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { autofillCreatorFromInstagram } from "@/lib/creator-autofill";
import { setCreatorNiches } from "@/lib/niches-db";
import { recomputeCreatorCompleteness } from "@/lib/creator-profile";
import {
  autofillLimiter,
  checkLimit,
} from "@/lib/ratelimit";
import type {
  AutofillResult,
  AutofillError,
} from "@/lib/creator-autofill";
import type {
  ContentFormat,
  CreatorType,
  Language,
} from "@/generated/prisma/enums";

async function requireCreator() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true, userId: true },
  });
  if (!creator) redirect("/mi-espacio");
  return { creator, userId: session.user.id! };
}

export interface AutofillFormState {
  result: AutofillResult | AutofillError | null;
}

/**
 * Server action invocada desde el form de /mi-espacio/perfil/autofill.
 * Recibe el handle, ejecuta scrape + Claude, devuelve el resultado al client
 * component que lo usa vía useActionState.
 */
export async function runAutofill(
  _prev: AutofillFormState,
  formData: FormData,
): Promise<AutofillFormState> {
  const { creator, userId } = await requireCreator();

  const { allowed } = await checkLimit(autofillLimiter(), `user:${userId}`);
  if (!allowed) {
    return {
      result: {
        ok: false,
        error: "ai_failed",
        message:
          "Ya probaste varias veces. Esperá un rato antes de volver a intentar.",
      },
    };
  }

  const handle = String(formData.get("handle") ?? "").trim();
  if (!handle) {
    return {
      result: {
        ok: false,
        error: "invalid_handle",
        message: "Ingresá tu handle de Instagram (ej: @maria).",
      },
    };
  }

  const res = await autofillCreatorFromInstagram(handle, {
    userId,
    creatorId: creator.id,
  });
  return { result: res };
}

/**
 * Aplica las sugerencias recibidas al perfil del creator.
 * El client component pasa los valores finales (ya editados) en el formData.
 */
export async function applyAutofill(formData: FormData) {
  const { creator } = await requireCreator();

  const artistName = str(formData, "artistName");
  const headline = str(formData, "headline");
  const valuePitch = str(formData, "valuePitch");
  const bio = str(formData, "bio");
  const city = str(formData, "city");
  const country = str(formData, "country");
  const suggestedBaseRateCOP = numOrNull(formData, "suggestedBaseRateCOP");
  const sourceUrl = str(formData, "sourceUrl");

  const creatorTypes = csvEnum(formData, "creatorTypes", [
    "UGC",
    "INFLUENCER",
    "FILMMAKER",
    "PHOTOGRAPHER",
    "EDITOR",
    "STRATEGIST",
    "COPYWRITER",
    "DESIGNER",
    "MODEL",
  ]) as CreatorType[];
  const contentFormats = csvEnum(formData, "contentFormats", [
    "REEL",
    "TIKTOK_VIDEO",
    "PHOTO",
    "LONG_VIDEO",
    "CAROUSEL",
    "LIVE",
    "PODCAST",
    "BLOG",
  ]) as ContentFormat[];
  const languages = csvEnum(formData, "languages", [
    "ES",
    "EN",
    "PT",
  ]) as Language[];

  // Nichos — vienen como slugs separados por coma
  const nicheSlugs = (formData.get("niches") as string | null)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      artistName,
      headline,
      valuePitch,
      bio,
      city,
      country,
      creatorTypes,
      contentFormats,
      languages,
      niches: nicheSlugs,
      ...(suggestedBaseRateCOP != null
        ? { baseRateCOP: suggestedBaseRateCOP }
        : {}),
      autofillSourceUrl: sourceUrl,
      autofillAt: new Date(),
    },
  });

  if (nicheSlugs.length > 0) {
    await setCreatorNiches(creator.id, nicheSlugs).catch((err) =>
      console.error("[applyAutofill] setCreatorNiches failed:", err),
    );
  }

  await recomputeCreatorCompleteness(creator.id);
  revalidatePath("/mi-espacio/perfil");
  redirect("/mi-espacio/perfil?autofilled=1");
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

function numOrNull(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (typeof v !== "string" || !v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function csvEnum<T extends string>(
  fd: FormData,
  key: string,
  allowed: T[],
): T[] {
  const raw = (fd.get(key) as string | null) ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((v): v is T => allowed.includes(v as T));
}
