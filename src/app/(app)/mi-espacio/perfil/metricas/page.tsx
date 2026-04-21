import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getMetaConfig } from "@/lib/meta-oauth";
import { getTikTokConfig } from "@/lib/tiktok-oauth";
import {
  syncInstagramInsights,
  disconnectInstagram,
  syncTikTokInsights,
  disconnectTikTok,
} from "./actions";

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

const ERR_LABEL: Record<string, string> = {
  not_connected: "Primero tenés que conectar tu cuenta.",
  token_expired:
    "El acceso expiró. Reconectá tu cuenta para seguir recibiendo métricas.",
  pull_failed:
    "Meta no devolvió datos. Revisá que tu cuenta sea Business/Creator y tenga >100 followers.",
  meta_unconfigured:
    "Meta App no configurada. Agregá INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET a .env.",
  missing_code: "Meta no devolvió el código de autorización.",
  bad_state: "Sesión OAuth expiró o no coincide. Intentá de nuevo.",
  no_creator_profile: "No encontramos tu perfil de creador.",
  no_ig_business_account:
    "Tu cuenta IG no es Business/Creator o no está vinculada a una Facebook Page.",
  token_exchange_failed: "Falló el intercambio del token con Meta.",

  tt_not_connected: "Conectá primero tu cuenta de TikTok.",
  tt_missing_code: "TikTok no devolvió el código de autorización.",
  tt_bad_state: "Sesión OAuth TikTok expiró. Intentá de nuevo.",
  tt_token_exchange_failed: "Falló el intercambio del token con TikTok.",
  tt_user_fetch_failed:
    "TikTok rechazó la lectura de tu perfil. Revisá los permisos otorgados.",
  tt_pull_failed: "No pudimos traer tus stats de TikTok.",
  tt_refresh_failed:
    "El refresh token de TikTok expiró (365 días). Reconectá tu cuenta.",
  tiktok_unconfigured:
    "TikTok no configurado. Agregá TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET a .env.",
};

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{
    connected?: string;
    connected_tt?: string;
    synced?: string;
    synced_tt?: string;
    disconnected?: string;
    disconnected_tt?: string;
    error?: string;
  }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true, slug: true },
  });
  if (!creator) redirect("/mi-espacio");

  const params = await searchParams;
  const isMetaConfigured = !!getMetaConfig();
  const isTikTokConfigured = !!getTikTokConfig();

  const profiles = await prisma.creatorSocialProfile.findMany({
    where: { creatorId: creator.id },
    include: {
      insights: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });

  const igProfile = profiles.find((p) => p.platform === "INSTAGRAM") ?? null;
  const ttProfile = profiles.find((p) => p.platform === "TIKTOK") ?? null;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <Link
          href="/mi-espacio/perfil"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a mi perfil
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] flex items-center justify-center text-white text-xl">
            📊
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Mis métricas verificadas
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Data oficial de las redes — verificada directamente por Meta y
              TikTok. Las marcas ven esto en tu perfil público como prueba real
              de tu audiencia.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(params.connected === "1" || params.connected_tt === "1") && (
        <div className="rounded-lg border border-[#D6E889]/60 bg-[#D6E889]/20 px-4 py-3 text-sm">
          ✓ Cuenta conectada. Tocá &quot;Sincronizar ahora&quot; para hacer el
          primer pull.
        </div>
      )}
      {(params.synced === "1" || params.synced_tt === "1") && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✓ Métricas actualizadas. Tu perfil público ya las muestra.
        </div>
      )}
      {(params.disconnected === "1" || params.disconnected_tt === "1") && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          Cuenta desconectada. Tu historial queda guardado pero se deja de
          actualizar.
        </div>
      )}
      {params.error && ERR_LABEL[params.error] && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {ERR_LABEL[params.error]}
        </div>
      )}

      <InstagramCard
        configured={isMetaConfigured}
        profile={igProfile}
      />

      <TikTokCard
        configured={isTikTokConfigured}
        profile={ttProfile}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Instagram
// ────────────────────────────────────────────────────────────────────────

interface LatestInsight {
  id: string;
  capturedAt: Date;
  followers: number | null;
  reach30d: number | null;
  impressions30d: number | null;
  profileViews30d: number | null;
  genderFemalePct: number | null;
  genderMalePct: number | null;
  genderOtherPct: number | null;
  age13_17Pct: number | null;
  age18_24Pct: number | null;
  age25_34Pct: number | null;
  age35_44Pct: number | null;
  age45_54Pct: number | null;
  age55PlusPct: number | null;
  topCities: unknown;
  topCountries: unknown;
  rawPayload: unknown;
}

type ProfileWithInsights = {
  id: string;
  handle: string;
  accessToken: string | null;
  externalId: string | null;
  lastSyncedAt: Date | null;
  insights: LatestInsight[];
};

function InstagramCard({
  configured,
  profile,
}: {
  configured: boolean;
  profile: ProfileWithInsights | null;
}) {
  const connected = !!profile?.accessToken;
  const latest = profile?.insights[0] ?? null;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#E1306C] to-[#833AB4] flex items-center justify-center text-white text-sm font-bold">
            IG
          </div>
          <h2 className="font-semibold">Instagram</h2>
          {connected && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D6E889]/30 text-[#4a5f10]">
              Conectado
            </span>
          )}
        </div>
        {connected && (
          <div className="flex gap-2">
            <form action={syncInstagramInsights}>
              <Button type="submit" size="sm">
                Sincronizar
              </Button>
            </form>
            <form action={disconnectInstagram}>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="text-destructive"
              >
                Desconectar
              </Button>
            </form>
          </div>
        )}
      </header>

      <div className="p-5">
        {!configured ? (
          <p className="text-sm text-muted-foreground">
            Config pendiente: falta <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">INSTAGRAM_APP_ID</code>{" "}
            en el servidor.
          </p>
        ) : !connected ? (
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Te redirigimos a Meta para autorizar solo-lectura de tus insights.
              Nunca posteamos por vos.{" "}
              <span className="text-[11px]">
                (Requisitos: cuenta IG Business/Creator vinculada a una FB Page,
                100+ followers para demografía.)
              </span>
            </p>
            <Link href="/api/oauth/instagram/start">
              <Button className="bg-[#E1306C] hover:bg-[#E1306C]/90">
                Conectar Instagram →
              </Button>
            </Link>
          </div>
        ) : !latest ? (
          <div className="text-sm text-muted-foreground">
            @{profile!.handle} conectado — tocá &quot;Sincronizar&quot; para el
            primer pull.
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-[11px] text-muted-foreground">
              @{profile!.handle} · Captura{" "}
              {new Date(latest.capturedAt).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Followers" value={fmt(latest.followers)} />
              <Stat label="Alcance 30d" value={fmt(latest.reach30d)} />
              <Stat label="Impresiones 30d" value={fmt(latest.impressions30d)} />
              <Stat label="Views perfil" value={fmt(latest.profileViews30d)} />
            </div>
            <IgDemographics latest={latest} />
          </div>
        )}
      </div>
    </section>
  );
}

function IgDemographics({ latest }: { latest: LatestInsight }) {
  const genderTotal =
    (latest.genderFemalePct ?? 0) +
    (latest.genderMalePct ?? 0) +
    (latest.genderOtherPct ?? 0);
  const ageRows: Array<[string, number | null]> = [
    ["13-17", latest.age13_17Pct],
    ["18-24", latest.age18_24Pct],
    ["25-34", latest.age25_34Pct],
    ["35-44", latest.age35_44Pct],
    ["45-54", latest.age45_54Pct],
    ["55+", latest.age55PlusPct],
  ];
  const ageTotal = ageRows.reduce((s, [, v]) => s + (v ?? 0), 0);
  const cities =
    (latest.topCities as Array<{ name: string; pct: number }> | null) ?? [];
  const countries =
    (latest.topCountries as Array<{ name: string; pct: number }> | null) ?? [];

  if (genderTotal === 0 && ageTotal === 0 && cities.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Meta no devolvió demografía (requiere 100+ followers según su política
        de privacy).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {genderTotal > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Género
          </p>
          <div className="h-2.5 flex rounded-full overflow-hidden bg-muted">
            {latest.genderFemalePct ? (
              <div
                style={{ width: `${latest.genderFemalePct}%`, background: "#F4C0D1" }}
              />
            ) : null}
            {latest.genderMalePct ? (
              <div
                style={{ width: `${latest.genderMalePct}%`, background: "#B0E4EA" }}
              />
            ) : null}
            {latest.genderOtherPct ? (
              <div
                style={{ width: `${latest.genderOtherPct}%`, background: "#F4D79D" }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] mt-2">
            <Legend color="#F4C0D1" label="Mujeres" pct={latest.genderFemalePct} />
            <Legend color="#B0E4EA" label="Hombres" pct={latest.genderMalePct} />
            <Legend color="#F4D79D" label="Otro" pct={latest.genderOtherPct} />
          </div>
        </div>
      )}

      {ageTotal > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Edad
          </p>
          <div className="space-y-1.5">
            {ageRows.map(([label, pct]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-12 text-xs text-muted-foreground">{label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  {pct != null && (
                    <div
                      className="h-full bg-[#FF4B2C]"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  )}
                </div>
                <span className="w-12 text-right text-xs tabular-nums">
                  {pct != null ? pct.toFixed(1) + "%" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(cities.length > 0 || countries.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {cities.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Top ciudades
              </p>
              <ul className="space-y-1">
                {cities.map((c) => (
                  <li
                    key={c.name}
                    className="text-xs flex justify-between"
                  >
                    <span>{c.name}</span>
                    <span className="tabular-nums font-medium">
                      {c.pct.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {countries.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Top países
              </p>
              <ul className="space-y-1">
                {countries.map((c) => (
                  <li
                    key={c.name}
                    className="text-xs flex justify-between"
                  >
                    <span>{c.name}</span>
                    <span className="tabular-nums font-medium">
                      {c.pct.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// TikTok
// ────────────────────────────────────────────────────────────────────────

interface TikTokRaw {
  openId?: string;
  username?: string;
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  following?: number | null;
  likes?: number | null;
  videoCount?: number | null;
}

function TikTokCard({
  configured,
  profile,
}: {
  configured: boolean;
  profile: ProfileWithInsights | null;
}) {
  const connected = !!profile?.accessToken;
  const latest = profile?.insights[0] ?? null;
  const raw = (latest?.rawPayload as TikTokRaw | null) ?? null;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white text-sm font-bold">
            TT
          </div>
          <h2 className="font-semibold">TikTok</h2>
          {connected && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D6E889]/30 text-[#4a5f10]">
              Conectado
            </span>
          )}
        </div>
        {connected && (
          <div className="flex gap-2">
            <form action={syncTikTokInsights}>
              <Button type="submit" size="sm">
                Sincronizar
              </Button>
            </form>
            <form action={disconnectTikTok}>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="text-destructive"
              >
                Desconectar
              </Button>
            </form>
          </div>
        )}
      </header>

      <div className="p-5">
        {!configured ? (
          <p className="text-sm text-muted-foreground">
            Config pendiente: falta{" "}
            <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
              TIKTOK_CLIENT_KEY
            </code>{" "}
            en el servidor.
          </p>
        ) : !connected ? (
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Conectá tu cuenta de TikTok para verificar tus stats públicas
              (followers, videos, likes) directo desde su API.
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 leading-relaxed">
              Nota honesta: TikTok Display API no expone demografía de
              audiencia (género/edad/ciudad). Para eso necesitás TikTok
              Research API (aprobación académica) o Marketing API (cuenta
              ads). Mientras tanto las marcas ven followers/likes verificados.
            </p>
            <Link href="/api/oauth/tiktok/start">
              <Button className="bg-black hover:bg-black/85 text-white">
                Conectar TikTok →
              </Button>
            </Link>
          </div>
        ) : !latest ? (
          <div className="text-sm text-muted-foreground">
            @{profile!.handle} conectado — tocá &quot;Sincronizar&quot; para el
            primer pull.
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-[11px] text-muted-foreground">
              @{profile!.handle} · Captura{" "}
              {new Date(latest.capturedAt).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Followers" value={fmt(latest.followers)} />
              <Stat label="Siguiendo" value={fmt(raw?.following ?? null)} />
              <Stat label="Likes totales" value={fmt(raw?.likes ?? null)} />
              <Stat label="Videos" value={fmt(raw?.videoCount ?? null)} />
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              TikTok Display API no expone demografía todavía — sumaremos eso
              cuando habilitemos Research API.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-bold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function Legend({
  color,
  label,
  pct,
}: {
  color: string;
  label: string;
  pct: number | null;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span>
        {label}{" "}
        <strong>{pct != null ? pct.toFixed(1) + "%" : "—"}</strong>
      </span>
    </div>
  );
}
