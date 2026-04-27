/**
 * OAuth 2.0 con TikTok (Login Kit — TikTok for Developers).
 *
 * Flow:
 *   1. Redirigir a https://www.tiktok.com/v2/auth/authorize/ con client_key
 *   2. TikTok devuelve a nuestro callback con ?code=...
 *   3. Intercambiar code → access_token (24h) + refresh_token (365 días)
 *   4. Guardar open_id como externalId
 *
 * Requisitos:
 *   - TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET en .env
 *   - Redirect URI configurado en developers.tiktok.com:
 *     http://localhost:3000/api/oauth/tiktok/callback (dev)
 *   - App en Sandbox o aprobada (para producción)
 *
 * Nota: el Display API NO expone demografía. Para eso haría falta el
 * Research API (aprobación académica) o Marketing API (cuenta ads).
 */

const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const API_BASE = "https://open.tiktokapis.com/v2";

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
}

export function getTikTokConfig(): TikTokConfig | null {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  if (!clientKey || !clientSecret) return null;

  return {
    clientKey,
    clientSecret,
    redirectUri: `${baseUrl}/api/oauth/tiktok/callback`,
  };
}

export function buildAuthorizeUrl(state: string): string | null {
  const config = getTikTokConfig();
  if (!config) return null;

  const scopes = ["user.info.basic", "user.info.profile", "user.info.stats"].join(",");

  const params = new URLSearchParams({
    client_key: config.clientKey,
    redirect_uri: config.redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  });
  return `${AUTH_BASE}?${params}`;
}

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number; // segundos (24h = 86400)
  token_type: "Bearer";
  refresh_token: string;
  refresh_expires_in: number; // segundos (365d = 31536000)
  scope: string;
  open_id: string;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<TikTokTokenResponse> {
  const config = getTikTokConfig();
  if (!config) throw new Error("TIKTOK_CLIENT_KEY/SECRET no configurados");

  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const res = await fetch(`${API_BASE}/oauth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`TikTok token exchange failed: ${res.status} ${t}`);
  }
  return (await res.json()) as TikTokTokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TikTokTokenResponse> {
  const config = getTikTokConfig();
  if (!config) throw new Error("TIKTOK_CLIENT_KEY/SECRET no configurados");

  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(`${API_BASE}/oauth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`TikTok refresh failed: ${res.status} ${t}`);
  }
  return (await res.json()) as TikTokTokenResponse;
}
