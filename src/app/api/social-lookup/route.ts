import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseCompactNumber(str: string): number {
  const cleaned = str.replace(/,/g, "").trim();
  return parseInt(cleaned) || 0;
}

async function lookupInstagram(handle: string) {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Instagram muestra stats en og:description para crawlers
    // Formato: "1,037 Followers, 636 Following, 202 Posts - See Instagram photos..."
    const match = html.match(
      /content="([\d,.]+)\s+Followers?,\s*([\d,.]+)\s+Following,\s*([\d,.]+)\s+Posts?/i
    );
    if (!match) return null;

    const followers = parseCompactNumber(match[1]);
    const following = parseCompactNumber(match[2]);
    const posts = parseCompactNumber(match[3]);

    // Extraer nombre del título o og:title
    const nameMatch = html.match(/content="([^"]+)\s+\(@[^)]+\)/);
    const fullName = nameMatch ? nameMatch[1].trim() : "";

    return { followers, following, posts, fullName };
  } catch {
    return null;
  }
}

async function lookupTikTok(handle: string) {
  const cleanHandle = handle.replace("@", "");
  const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(cleanHandle)}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;

  const html = await res.text();

  const statsMatch = html.match(
    /"stats":\{"followerCount":(\d+),"followingCount":(\d+),"heart":(\d+),"heartCount":(-?\d+),"videoCount":(\d+)/
  );
  if (!statsMatch) return null;

  const followers = parseInt(statsMatch[1]);
  const following = parseInt(statsMatch[2]);
  const posts = parseInt(statsMatch[5]);
  const hearts = parseInt(statsMatch[3]);

  let avgEngagement: number | undefined;
  if (followers > 0 && posts > 0) {
    avgEngagement = Math.round((hearts / posts / followers) * 10000) / 100;
  }

  // Extraer nombre
  const nameMatch = html.match(/"nickname":"([^"]+)"/);
  const fullName = nameMatch ? nameMatch[1] : "";

  return { followers, following, posts, fullName, avgEngagement };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "TEAM"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const platform = req.nextUrl.searchParams.get("platform");
  const handle = req.nextUrl.searchParams.get("handle")?.replace("@", "").trim();

  if (!platform || !handle) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    const data =
      platform === "INSTAGRAM"
        ? await lookupInstagram(handle)
        : await lookupTikTok(handle);

    if (!data) {
      const msg =
        platform === "INSTAGRAM"
          ? "Instagram limitó las consultas temporalmente. Intentá de nuevo en unos minutos."
          : "No se encontró el perfil. Verificá el usuario.";
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error al consultar" }, { status: 500 });
  }
}
