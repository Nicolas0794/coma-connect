import type {
  CreatorSocialProfile,
  SocialInsight,
  SocialPlatform,
} from "@/generated/prisma/client";

type ProfileWithInsights = CreatorSocialProfile & {
  insights: SocialInsight[];
};

interface Props {
  profiles: ProfileWithInsights[];
}

function fmtNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("es-CO");
}

const PLATFORM_INFO: Record<SocialPlatform, { label: string; color: string; bgGradient: string }> = {
  INSTAGRAM: {
    label: "Instagram",
    color: "#E1306C",
    bgGradient: "from-[#E1306C] to-[#833AB4]",
  },
  TIKTOK: {
    label: "TikTok",
    color: "#000000",
    bgGradient: "from-black to-stone-800",
  },
};

/**
 * Sección de métricas verificadas para el perfil público.
 * Solo se renderiza si al menos una plataforma tiene insights conectados.
 * Es el diferencial comercial: data oficial de Meta/TikTok, no scraping.
 */
export function CreatorVerifiedMetrics({ profiles }: Props) {
  const withInsights = profiles.filter(
    (p) => p.accessToken && p.insights.length > 0,
  );
  if (withInsights.length === 0) return null;

  return (
    <section className="py-8 border-t border-border">
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <h2 className="text-xl font-semibold">Métricas verificadas</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#D6E889]/30 text-[#4a5f10] border border-[#D6E889]/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
          ✓ Data oficial
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl leading-relaxed">
        Todas estas métricas vienen firmadas directamente de la API de la
        plataforma. No son declaradas por el creador — son lo que Meta y
        TikTok ven internamente.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {withInsights.map((p) => (
          <PlatformCard key={p.id} profile={p} />
        ))}
      </div>
    </section>
  );
}

function PlatformCard({ profile }: { profile: ProfileWithInsights }) {
  const info = PLATFORM_INFO[profile.platform];
  const latest = profile.insights[0]!;
  const age = Date.now() - new Date(latest.capturedAt).getTime();
  const ageDays = Math.round(age / (24 * 60 * 60 * 1000));

  const isInstagram = profile.platform === "INSTAGRAM";

  // TikTok data vive en rawPayload
  const rawTT = !isInstagram
    ? (latest.rawPayload as {
        likes?: number | null;
        following?: number | null;
        videoCount?: number | null;
      } | null)
    : null;

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden">
      <header
        className={`bg-gradient-to-r ${info.bgGradient} text-white px-5 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{info.label}</span>
          <a
            href={profile.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white text-sm"
          >
            @{profile.handle}
          </a>
        </div>
        <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
          Sync · {ageDays === 0 ? "hoy" : `hace ${ageDays}d`}
        </span>
      </header>

      <div className="p-5 space-y-5">
        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Followers" value={fmtNumber(latest.followers)} big />
          {isInstagram ? (
            <Stat label="Alcance 30d" value={fmtNumber(latest.reach30d)} big />
          ) : (
            <Stat label="Likes totales" value={fmtNumber(rawTT?.likes)} big />
          )}
        </div>

        {isInstagram ? (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Impresiones 30d" value={fmtNumber(latest.impressions30d)} />
            <Stat label="Views perfil 30d" value={fmtNumber(latest.profileViews30d)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Videos" value={fmtNumber(rawTT?.videoCount)} />
            <Stat label="Siguiendo" value={fmtNumber(rawTT?.following)} />
          </div>
        )}

        {isInstagram && <IgDemographics latest={latest} />}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`${big ? "text-2xl" : "text-lg"} font-bold tabular-nums leading-tight mt-0.5`}
      >
        {value}
      </p>
    </div>
  );
}

function IgDemographics({ latest }: { latest: SocialInsight }) {
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
  const topAge = ageRows
    .filter(([, v]) => v != null)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];

  const cities =
    (latest.topCities as Array<{ name: string; pct: number }> | null) ?? [];

  if (genderTotal === 0 && !topAge && cities.length === 0) return null;

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      {genderTotal > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Género audiencia
          </p>
          <div className="h-2 flex rounded-full overflow-hidden bg-muted">
            {latest.genderFemalePct ? (
              <div
                style={{
                  width: `${latest.genderFemalePct}%`,
                  background: "#F4C0D1",
                }}
              />
            ) : null}
            {latest.genderMalePct ? (
              <div
                style={{
                  width: `${latest.genderMalePct}%`,
                  background: "#B0E4EA",
                }}
              />
            ) : null}
            {latest.genderOtherPct ? (
              <div
                style={{
                  width: `${latest.genderOtherPct}%`,
                  background: "#F4D79D",
                }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] mt-1.5">
            {latest.genderFemalePct != null && (
              <span>
                Mujeres{" "}
                <strong>{latest.genderFemalePct.toFixed(0)}%</strong>
              </span>
            )}
            {latest.genderMalePct != null && (
              <span>
                Hombres <strong>{latest.genderMalePct.toFixed(0)}%</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {topAge && (
        <div className="text-sm">
          <span className="text-muted-foreground">Edad dominante: </span>
          <strong>{topAge[0]}</strong>
          <span className="text-muted-foreground">
            {" "}
            ({(topAge[1] ?? 0).toFixed(0)}% de la audiencia)
          </span>
        </div>
      )}

      {cities.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Top ciudades
          </p>
          <ul className="text-xs space-y-0.5">
            {cities.slice(0, 3).map((c) => (
              <li key={c.name} className="flex justify-between">
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
  );
}
