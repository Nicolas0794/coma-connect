import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getMetaConfig } from "@/lib/meta-oauth";
import { syncInstagramInsights, disconnectInstagram } from "./actions";

function fmt(n: number | null | undefined, unit = ""): string {
  if (n == null) return "—";
  return n.toLocaleString("es-CO", { maximumFractionDigits: 1 }) + unit;
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
  bad_state:
    "Sesión OAuth expiró o no coincide. Intentá de nuevo desde cero.",
  no_creator_profile: "No encontramos tu perfil de creador.",
  no_ig_business_account:
    "Tu cuenta IG no es Business/Creator o no está vinculada a una Facebook Page. Meta solo expone métricas para ese tipo de cuenta.",
  token_exchange_failed: "Falló el intercambio del token con Meta.",
};

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{
    connected?: string;
    synced?: string;
    disconnected?: string;
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

  const profile = await prisma.creatorSocialProfile.findUnique({
    where: {
      creatorId_platform: { creatorId: creator.id, platform: "INSTAGRAM" },
    },
    include: {
      insights: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });

  const isConnected = !!profile?.accessToken;
  const latest = profile?.insights[0] ?? null;

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
              Data oficial de Instagram — verificada directamente por Meta. Las
              marcas ven esto en tu perfil público como prueba real de tu
              audiencia.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {params.connected === "1" && (
        <div className="rounded-lg border border-[#D6E889]/60 bg-[#D6E889]/20 px-4 py-3 text-sm">
          ✓ Instagram conectado. Tocá &quot;Sincronizar ahora&quot; para hacer
          el primer pull de métricas.
        </div>
      )}
      {params.synced === "1" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✓ Métricas actualizadas. Tu perfil público ya las muestra.
        </div>
      )}
      {params.disconnected === "1" && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          Desconectaste tu Instagram. Tu historial queda guardado pero se deja
          de actualizar.
        </div>
      )}
      {params.error && ERR_LABEL[params.error] && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {ERR_LABEL[params.error]}
        </div>
      )}

      {!isMetaConfigured ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-1">Config pendiente del equipo</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta feature necesita que el admin configure{" "}
            <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
              INSTAGRAM_APP_ID
            </code>{" "}
            e{" "}
            <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
              INSTAGRAM_APP_SECRET
            </code>{" "}
            en el servidor. Mientras tanto tus métricas manuales siguen
            funcionando.
          </p>
        </div>
      ) : !isConnected ? (
        <div className="rounded-xl border border-[#FF4B2C]/30 bg-gradient-to-br from-[#FF4B2C]/8 to-transparent p-6">
          <h3 className="font-semibold mb-2">
            Conectá tu Instagram Business/Creator
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Te redirigimos a Meta para que autorices el acceso de solo-lectura a
            tus insights. Nunca vamos a postear por vos — solo leemos métricas
            agregadas (followers, reach, demografía, ciudades).
          </p>
          <Link href="/api/oauth/instagram/start">
            <Button size="lg" className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90">
              Conectar Instagram →
            </Button>
          </Link>
          <div className="mt-5 text-[11px] text-muted-foreground space-y-1 max-w-lg">
            <p>
              <strong>Requisitos de Meta:</strong>
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Tu cuenta IG tiene que ser Business o Creator</li>
              <li>Tiene que estar vinculada a una Facebook Page</li>
              <li>
                La demografía solo aparece si la cuenta tiene 100+ followers
                (política de privacy de Meta)
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {/* Perfil conectado — header con sync */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Conectado
                </p>
                <p className="font-semibold text-lg">@{profile!.handle}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Última sync:{" "}
                  {profile!.lastSyncedAt
                    ? new Date(profile!.lastSyncedAt).toLocaleString("es-CO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "nunca"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={syncInstagramInsights}>
                  <Button type="submit" size="sm">
                    Sincronizar ahora
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
            </div>
          </div>

          {!latest ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
              Todavía no hiciste ningún sync. Tocá &quot;Sincronizar ahora&quot;
              para traer tus métricas de Meta.
            </div>
          ) : (
            <InsightsView
              latest={latest}
              capturedAt={latest.capturedAt}
              handle={profile!.handle}
            />
          )}
        </>
      )}
    </div>
  );
}

interface LatestInsight {
  followers: number | null;
  reach30d: number | null;
  impressions30d: number | null;
  profileViews30d: number | null;
  websiteClicks30d: number | null;
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
}

function InsightsView({
  latest,
  capturedAt,
  handle,
}: {
  latest: LatestInsight;
  capturedAt: Date;
  handle: string;
}) {
  const ageRows: Array<[string, number | null]> = [
    ["13-17", latest.age13_17Pct],
    ["18-24", latest.age18_24Pct],
    ["25-34", latest.age25_34Pct],
    ["35-44", latest.age35_44Pct],
    ["45-54", latest.age45_54Pct],
    ["55+", latest.age55PlusPct],
  ];
  const cities = (latest.topCities as Array<{ name: string; pct: number }> | null) ?? [];
  const countries = (latest.topCountries as Array<{ name: string; pct: number }> | null) ?? [];

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Capturado {new Date(capturedAt).toLocaleString("es-CO")} · Fuente:
        Meta Graph API · Cuenta @{handle}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Followers" value={fmt(latest.followers)} />
        <Stat label="Alcance 30d" value={fmt(latest.reach30d)} />
        <Stat label="Impresiones 30d" value={fmt(latest.impressions30d)} />
        <Stat label="Views perfil 30d" value={fmt(latest.profileViews30d)} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4">Demografía · Género</h3>
        <DemoBar
          rows={[
            ["Mujeres", latest.genderFemalePct, "#F4C0D1"],
            ["Hombres", latest.genderMalePct, "#B0E4EA"],
            ["Otro / sin dato", latest.genderOtherPct, "#F4D79D"],
          ]}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4">Demografía · Edad</h3>
        <div className="space-y-2">
          {ageRows.map(([label, pct]) => (
            <AgeRow key={label} label={label} pct={pct} />
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Top ciudades</h3>
          {cities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin datos (Meta requiere 100+ followers).
            </p>
          ) : (
            <ul className="space-y-2">
              {cities.map((c) => (
                <li key={c.name} className="text-sm flex justify-between">
                  <span>{c.name}</span>
                  <span className="tabular-nums font-medium">
                    {c.pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Top países</h3>
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ul className="space-y-2">
              {countries.map((c) => (
                <li key={c.name} className="text-sm flex justify-between">
                  <span>{c.name}</span>
                  <span className="tabular-nums font-medium">
                    {c.pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function DemoBar({
  rows,
}: {
  rows: Array<[string, number | null, string]>;
}) {
  const total = rows.reduce((s, [, v]) => s + (v ?? 0), 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin datos (Meta requiere 100+ followers para exponer demografía).
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="h-3 flex rounded-full overflow-hidden bg-muted">
        {rows.map(([label, v, color]) =>
          v ? (
            <div
              key={label}
              style={{ width: `${v}%`, background: color }}
              title={`${label} ${v.toFixed(1)}%`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {rows.map(([label, v, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: color }}
            />
            <span>
              {label} <strong>{v != null ? v.toFixed(1) + "%" : "—"}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgeRow({ label, pct }: { label: string; pct: number | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        {pct != null && (
          <div
            className="h-full bg-[#FF4B2C] rounded-full"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        )}
      </div>
      <span className="w-14 text-right text-xs tabular-nums font-medium">
        {pct != null ? pct.toFixed(1) + "%" : "—"}
      </span>
    </div>
  );
}
