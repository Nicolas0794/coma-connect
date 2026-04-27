/**
 * OAuth 2.0 con Meta (Instagram Business API via Facebook Login).
 *
 * Flow Instagram Business (NO Instagram Basic Display — está deprecado):
 *   1. Redirigir a Facebook Login con scope instagram_basic + instagram_manage_insights
 *   2. FB devuelve a nuestro callback con ?code=...
 *   3. Intercambiar code → short-lived access token (1h)
 *   4. Intercambiar short-lived → long-lived token (60 días)
 *   5. Obtener las páginas de Facebook del user + Instagram Business Account linkeado
 *   6. Guardar externalId (IG Business Account ID) + accessToken
 *
 * Requisitos:
 *   - INSTAGRAM_APP_ID + INSTAGRAM_APP_SECRET en .env
 *   - Redirect URI configurado en developers.facebook.com:
 *     http://localhost:3000/api/oauth/instagram/callback (dev)
 *   - La cuenta IG del creator debe ser Business/Creator + linkeada a una FB Page
 *   - La app en Meta debe estar en Development mode (o aprobada por App Review)
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface MetaConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export function getMetaConfig(): MetaConfig | null {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  if (!appId || !appSecret) return null;

  return {
    appId,
    appSecret,
    redirectUri: `${baseUrl}/api/oauth/instagram/callback`,
  };
}

/** URL a la que redirigir para iniciar el flow OAuth. */
export function buildAuthorizeUrl(state: string): string | null {
  const config = getMetaConfig();
  if (!config) return null;

  const scopes = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
}

interface ShortLivedToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<ShortLivedToken> {
  const config = getMetaConfig();
  if (!config) throw new Error("INSTAGRAM_APP_ID/SECRET no configurados");

  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`, {
    method: "GET",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta token exchange failed: ${res.status} ${body}`);
  }
  return (await res.json()) as ShortLivedToken;
}

interface LongLivedToken {
  access_token: string;
  token_type: string;
  expires_in: number; // segundos (~5184000 = 60 días)
}

export async function exchangeForLongLivedToken(
  shortLived: string,
): Promise<LongLivedToken> {
  const config = getMetaConfig();
  if (!config) throw new Error("INSTAGRAM_APP_ID/SECRET no configurados");

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLived,
  });

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta long-lived exchange failed: ${res.status} ${body}`);
  }
  return (await res.json()) as LongLivedToken;
}

/** Resuelve el Instagram Business Account ID asociado a las FB Pages del user. */
export async function findInstagramBusinessAccount(
  accessToken: string,
): Promise<{ igBusinessId: string; pageId: string; igUsername: string } | null> {
  const pagesRes = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
  );
  if (!pagesRes.ok) return null;

  const pagesData = (await pagesRes.json()) as {
    data: Array<{
      id: string;
      name: string;
      instagram_business_account?: { id: string };
    }>;
  };

  const page = pagesData.data.find((p) => p.instagram_business_account);
  if (!page?.instagram_business_account) return null;

  const igBusinessId = page.instagram_business_account.id;

  // Obtener el username de la cuenta IG
  const igRes = await fetch(
    `${GRAPH_BASE}/${igBusinessId}?fields=username&access_token=${accessToken}`,
  );
  if (!igRes.ok) return null;
  const igData = (await igRes.json()) as { username: string };

  return {
    igBusinessId,
    pageId: page.id,
    igUsername: igData.username,
  };
}
