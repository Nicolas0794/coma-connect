/**
 * Scraping público de Instagram usando Googlebot UA.
 * La API interna de IG bloquea con agent normal; Googlebot pasa contra
 * la página pública y nos deja leer og:tags + JSON-LD.
 *
 * No usa la Graph API oficial (requiere OAuth del creator).
 */

const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

export interface InstagramProfile {
  handle: string;
  profileUrl: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
}

function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
}

function parseCompactNumber(str: string): number {
  return parseInt(str.replace(/[,.]/g, "").trim()) || 0;
}

/**
 * Extrae content="..." del primer meta tag con el property dado.
 * No usamos regex sobre atributos (frágil) — scanneamos linealmente.
 */
function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)="${property}"[^>]*content="([^"]+)"`,
    "i",
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function scrapeInstagramProfile(
  rawHandle: string,
): Promise<InstagramProfile | null> {
  const handle = cleanHandle(rawHandle);
  if (!handle || !/^[a-zA-Z0-9._]+$/.test(handle)) return null;

  const profileUrl = `https://www.instagram.com/${encodeURIComponent(handle)}/`;

  let html: string;
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent": GOOGLEBOT_UA,
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  // og:description suele tener "{X} Followers, {Y} Following, {Z} Posts - @handle"
  // con la bio opcional al final. El title tiene el fullName.
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");

  let followers: number | null = null;
  let following: number | null = null;
  let posts: number | null = null;
  if (ogDescription) {
    const m = ogDescription.match(
      /([\d,.]+)\s*Followers?,\s*([\d,.]+)\s*Following,\s*([\d,.]+)\s*Posts?/i,
    );
    if (m) {
      followers = parseCompactNumber(m[1]);
      following = parseCompactNumber(m[2]);
      posts = parseCompactNumber(m[3]);
    }
  }

  // fullName: og:title es "@handle" o "Full Name (@handle)". Preferimos JSON-LD si está.
  let fullName: string | null = null;
  const ldJsonMatch = html.match(
    /<script type="application\/ld\+json">([^<]+)<\/script>/,
  );
  if (ldJsonMatch) {
    try {
      const ld = JSON.parse(ldJsonMatch[1]);
      if (ld.name && typeof ld.name === "string") fullName = ld.name;
    } catch {
      /* ignore */
    }
  }
  if (!fullName && ogTitle) {
    const m = ogTitle.match(/^(.+?)\s+\(@/);
    fullName = m ? m[1].trim() : ogTitle.replace(/^@/, "").trim();
    if (fullName === handle) fullName = null;
  }

  // Bio: og:description cortado después del "X Posts - @handle -"
  let bio: string | null = null;
  if (ogDescription) {
    const bioMatch = ogDescription.match(
      /Posts?\s*-\s*@[^\s-]+\s*-\s*(.+)$/i,
    );
    if (bioMatch) bio = decodeEntities(bioMatch[1].trim()) || null;
  }
  // Fallback: el atributo alt de la profile pic a veces tiene bio info.
  if (!bio) {
    const altMatch = html.match(
      /<meta name="description" content="([^"]+)"/i,
    );
    if (altMatch) {
      const content = decodeEntities(altMatch[1]);
      // Mismo truco: cortar después de "- @handle -"
      const m = content.match(/@[^\s-]+\s*-\s*(.+)$/);
      if (m) bio = m[1].trim();
    }
  }

  return {
    handle,
    profileUrl,
    fullName,
    bio,
    avatarUrl: ogImage,
    followers,
    following,
    posts,
  };
}

/**
 * Descarga el avatar del perfil y lo devuelve como base64 para pasar a Claude
 * vision. Retorna null si falla o si el tamaño supera el límite.
 */
export async function fetchImageAsBase64(
  url: string,
  maxBytes = 5 * 1024 * 1024,
): Promise<{ data: string; mediaType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": GOOGLEBOT_UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const mediaType = contentType.split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType)) {
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > maxBytes) return null;

    return { data: buffer.toString("base64"), mediaType };
  } catch {
    return null;
  }
}
