import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Lazy Redis: solo se instancia si hay env vars. Si faltan, el rate limit
// queda DESACTIVADO (útil en dev) con un warning único en logs.
let redis: Redis | null | undefined;
let warned = false;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN no configurados — rate limiting DESACTIVADO.",
      );
      warned = true;
    }
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

const cache = new Map<string, Ratelimit | null>();

function getLimiter(
  name: string,
  limit: number,
  window: Window,
): Ratelimit | null {
  if (cache.has(name)) return cache.get(name)!;
  const r = getRedis();
  if (!r) {
    cache.set(name, null);
    return null;
  }
  const l = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `coma:${name}`,
    analytics: true,
  });
  cache.set(name, l);
  return l;
}

export const loginLimiter = () => getLimiter("login", 5, "15 m");
export const registerLimiter = () => getLimiter("register", 5, "1 h");
export const forgotPasswordLimiter = () => getLimiter("forgot", 3, "1 h");
export const uploadDocLimiter = () => getLimiter("upload-doc", 20, "1 h");
export const uploadVideoLimiter = () => getLimiter("upload-video", 10, "1 h");
export const aiLimiter = () => getLimiter("ai", 20, "1 h");
export const brandLeadLimiter = () => getLimiter("brand-lead", 3, "1 h");

/** Extrae IP de headers (para server actions y route handlers). */
export async function ipKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export function ipKeyFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Ejecuta el chequeo. Si el limiter es null (sin config), permite siempre.
 * Retorna `allowed` + metadata para respuestas 429.
 */
export async function checkLimit(limiter: Ratelimit | null, key: string) {
  if (!limiter) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  const res = await limiter.limit(key);
  return { allowed: res.success, remaining: res.remaining, reset: res.reset };
}
