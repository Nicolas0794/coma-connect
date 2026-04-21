import { z } from "zod";

// ─── Primitivas reutilizables ────────────────────────────────────────────────

export const shortText = z.string().trim().max(200);
export const mediumText = z.string().trim().max(1000);
export const longText = z.string().trim().max(5000);

// URLs públicas — bloquea javascript:, data:, file:, etc. (CRÍTICA-4 XSS)
export const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
    message: "La URL debe empezar con http(s)://",
  });

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Slug inválido");

export const emailSchema = z.string().trim().toLowerCase().email().max(200);
export const phoneSchema = z.string().trim().max(30);

export const positiveIntFromForm = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().finite().positive().int());

export const positiveMoneyFromForm = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().finite().positive());

// ─── Enums ───────────────────────────────────────────────────────────────────

export const CREATOR_TYPES = [
  "UGC",
  "INFLUENCER",
  "FILMMAKER",
  "PHOTOGRAPHER",
  "EDITOR",
  "STRATEGIST",
  "COPYWRITER",
  "DESIGNER",
  "MODEL",
] as const;
export const CONTENT_FORMATS = [
  "REEL",
  "TIKTOK_VIDEO",
  "PHOTO",
  "LONG_VIDEO",
  "CAROUSEL",
  "LIVE",
  "PODCAST",
  "BLOG",
] as const;
export const LANGUAGES = ["ES", "EN", "PT"] as const;
export const AVAILABILITY = ["AVAILABLE", "LIMITED", "BUSY", "CLOSED"] as const;
export const SOCIAL_PLATFORMS = ["INSTAGRAM", "TIKTOK"] as const;

// ─── Schemas por action ──────────────────────────────────────────────────────

export const saveIdentitySchema = z.object({
  artistName: shortText.optional(),
  headline: shortText.optional(),
  valuePitch: longText.optional(),
  profileImageUrl: httpsUrl.optional(),
});

export const saveLocationSchema = z.object({
  city: shortText.optional(),
  country: shortText.optional(),
});

export const saveSocialProfileSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  handle: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z0-9._-]+$/, "Handle inválido")
    .transform((v) => v.replace(/^@/, "")),
});

export const portfolioItemSchema = z.object({
  title: shortText.min(1),
  externalUrl: httpsUrl.optional(),
  coverImageUrl: httpsUrl.optional(),
  brandName: shortText.optional(),
});

export const serviceSchema = z.object({
  title: shortText.min(1),
  description: longText.optional(),
  priceCOP: positiveMoneyFromForm.optional(),
  deliveryDays: positiveIntFromForm.optional(),
});

export const inquiryMessageSchema = z.object({
  inquiryId: z.string().trim().min(1).max(40),
  body: mediumText.min(1),
});

export const quoteSchema = z.object({
  inquiryId: z.string().trim().min(1).max(40),
  priceCOP: positiveMoneyFromForm,
  scope: mediumText.min(1),
  deliveryDays: positiveIntFromForm.optional(),
  terms: longText.optional(),
});

export const reviewResponseSchema = z.object({
  id: z.string().trim().min(1).max(40),
  response: mediumText.min(1),
});

export const createInquirySchema = z.object({
  slug: slugSchema,
  brief: mediumText.min(20),
  contactName: shortText.min(1),
  contactEmail: emailSchema,
  contactPhone: phoneSchema.optional(),
  budgetCOP: positiveMoneyFromForm.optional(),
  deadline: z.coerce.date().optional(),
});

export const brandLeadSchema = z.object({
  brandName: shortText.min(2),
  contactName: shortText.min(2),
  contactEmail: emailSchema,
  contactPhone: phoneSchema.optional(),
  website: httpsUrl.optional(),
  industry: shortText.optional(),
  message: longText.optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convierte FormData a un objeto plano listo para zod.
 * - Usa getAll para keys que aparecen múltiples veces (checkbox groups)
 * - Convierte "" a undefined para que `.optional()` funcione con inputs vacíos
 */
export function formToObject(
  formData: FormData,
  multiKeys: string[] = [],
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const seenMulti = new Set(multiKeys);

  for (const key of new Set(formData.keys())) {
    if (seenMulti.has(key)) {
      obj[key] = formData.getAll(key).map((v) => String(v));
      continue;
    }
    const raw = formData.get(key);
    if (raw === null) continue;
    const str = typeof raw === "string" ? raw : "";
    if (str === "") {
      obj[key] = undefined;
      continue;
    }
    obj[key] = str;
  }
  return obj;
}
