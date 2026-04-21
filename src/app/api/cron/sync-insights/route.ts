import { NextRequest, NextResponse } from "next/server";
import { syncStaleInsights } from "@/lib/sync-insights";

/**
 * Cron endpoint: sincroniza insights de todos los perfiles OAuth conectados
 * que lleven más de 7 días sin pull.
 *
 * Protección: header `x-cron-secret` debe coincidir con env CRON_SECRET.
 * Si no coincide, 403.
 *
 * Para Vercel Cron (o similar) configurar:
 *   schedule: "0 3 * * *"  (diariamente a las 3am UTC)
 *   headers:  x-cron-secret: $CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado — cron desactivado" },
      { status: 503 },
    );
  }

  const provided = req.headers.get("x-cron-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const maxAgeHours = Number(
    req.nextUrl.searchParams.get("maxAgeHours") ?? 24 * 7,
  );
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

  const startedAt = Date.now();
  const result = await syncStaleInsights({
    maxAgeHours: Number.isFinite(maxAgeHours) ? maxAgeHours : 24 * 7,
    limit: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
  });

  return NextResponse.json({
    ...result,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
