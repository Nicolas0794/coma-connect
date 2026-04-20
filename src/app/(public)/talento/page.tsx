import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { searchPublicCreators, type SortKey } from "@/lib/public-creator";
import { CrossNav } from "@/components/cross-nav";
import { CreativeBg } from "@/components/creative-bg";

export const metadata: Metadata = {
  title: "Explorar talento — CoMa Connect",
  description:
    "Descubre creadores de contenido verificados en LATAM: UGC, influencers, filmmakers, fotógrafos y más.",
};

type SearchParams = Promise<{
  q?: string;
  ciudad?: string;
  nicho?: string;
  tipo?: string;
  formato?: string;
  disponibilidad?: string;
  verificados?: string;
  seguidores?: string;
  rating?: string;
  skill?: string;
  academy?: string;
  speaker?: string;
  orden?: string;
  page?: string;
}>;

const CREATOR_TYPES = [
  { key: "UGC", label: "UGC" },
  { key: "INFLUENCER", label: "Influencer" },
  { key: "FILMMAKER", label: "Filmmaker" },
  { key: "PHOTOGRAPHER", label: "Fotografía" },
  { key: "EDITOR", label: "Edición" },
  { key: "STRATEGIST", label: "Estrategia" },
  { key: "COPYWRITER", label: "Copywriter" },
  { key: "DESIGNER", label: "Diseño" },
  { key: "MODEL", label: "Modelo" },
];

const CONTENT_FORMATS = [
  { key: "REEL", label: "Reel" },
  { key: "TIKTOK_VIDEO", label: "TikTok" },
  { key: "PHOTO", label: "Foto" },
  { key: "LONG_VIDEO", label: "Video largo" },
  { key: "CAROUSEL", label: "Carrusel" },
];

const FOLLOWER_BUCKETS = [
  { key: "0", label: "Cualquiera" },
  { key: "1000", label: "1K+" },
  { key: "10000", label: "10K+" },
  { key: "50000", label: "50K+" },
  { key: "100000", label: "100K+" },
  { key: "500000", label: "500K+" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevant", label: "Más relevantes" },
  { key: "verified", label: "Verificados primero" },
  { key: "recent", label: "Recién incorporados" },
  { key: "complete", label: "Perfil más completo" },
];

const PAGE_SIZE = 24;

export default async function TalentoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const p = await searchParams;
  const page = Math.max(1, parseInt(p.page ?? "1", 10) || 1);
  const sort = (SORTS.some((s) => s.key === p.orden) ? p.orden : "relevant") as SortKey;
  const minFollowersNum = parseInt(p.seguidores ?? "0", 10) || 0;
  const minRating = parseFloat(p.rating ?? "0") || 0;

  const { items, total } = await searchPublicCreators({
    q: p.q?.trim() || undefined,
    city: p.ciudad?.trim() || undefined,
    niche: p.nicho?.trim() || undefined,
    type: p.tipo?.trim() || undefined,
    format: p.formato?.trim() || undefined,
    availability: p.disponibilidad?.trim() || undefined,
    verifiedOnly: p.verificados === "1",
    minFollowers: minFollowersNum > 0 ? minFollowersNum : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    skillSlug: p.skill?.trim() || undefined,
    academyOnly: p.academy === "1",
    speakerOnly: p.speaker === "1",
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const allSkills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  const selectedSkill = p.skill ? allSkills.find((s) => s.slug === p.skill) : null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilters: string[] = [];
  if (p.q) activeFilters.push(`"${p.q}"`);
  if (p.ciudad) activeFilters.push(p.ciudad);
  if (p.nicho) activeFilters.push(p.nicho);
  if (p.tipo) activeFilters.push(CREATOR_TYPES.find((t) => t.key === p.tipo)?.label ?? p.tipo);
  if (p.formato) activeFilters.push(CONTENT_FORMATS.find((f) => f.key === p.formato)?.label ?? p.formato);
  if (p.verificados === "1") activeFilters.push("Verificados");
  if (minFollowersNum > 0) activeFilters.push(`${minFollowersNum.toLocaleString("es-CO")}+ seguidores`);
  if (minRating > 0) activeFilters.push(`${minRating}⭐+`);
  if (selectedSkill) activeFilters.push(`Skill: ${selectedSkill.name}`);
  if (p.academy === "1") activeFilters.push("Con Academy 🏅");
  if (p.speaker === "1") activeFilters.push("Speaker Nation ⭐");

  // Para paginación: preservar los filtros actuales
  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) {
      if (v && k !== "page") params.set(k, v);
    }
    params.set("page", String(newPage));
    return `/talento?${params.toString()}`;
  };

  return (
    <div>
      {/* Hero enriquecido */}
      <section className="relative overflow-hidden border-b border-border bg-grain">
        <CreativeBg variant="warm" />
        <div className="mx-auto max-w-7xl px-6 py-16 relative">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
            CoMa Connect · Campañas end-to-end
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl">
            Donde la <span className="text-[#FF4B2C]">creatividad</span> se vuelve sistema.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Connect es el motor operativo del ecosistema: una red profesional de creadores
            verificados con portafolios reales y reputación construida campaña a campaña.
            Así trabajan las marcas que entienden que el contenido ya no se produce — se cultiva.
          </p>
        </div>
      </section>

      {/* Para quién y para qué */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-8 w-8 rounded-lg bg-[#FF4B2C]/10 flex items-center justify-center text-sm">💼</span>
                <p className="text-xs uppercase tracking-widest text-[#FF4B2C] font-semibold">Para marcas</p>
              </div>
              <h2 className="text-2xl font-bold mb-3">Selección inteligente, no por vanidad.</h2>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li className="flex gap-2"><span className="text-[#FF4B2C]">→</span><span><strong>Afinidad real</strong>, no solo seguidores. Filtrá por nicho, formato, ciudad, skills y rating de campañas anteriores.</span></li>
                <li className="flex gap-2"><span className="text-[#FF4B2C]">→</span><span><strong>Portafolios verificados</strong> con KPIs reales de campañas ejecutadas en CoMa.</span></li>
                <li className="flex gap-2"><span className="text-[#FF4B2C]">→</span><span><strong>Creator Score público</strong> que refleja rapidez, calidad, cumplimiento y ventas atribuidas.</span></li>
                <li className="flex gap-2"><span className="text-[#FF4B2C]">→</span><span><strong>Inquiry directa</strong> — envías brief, recibes cotización, convertís a campaña sin salir de la plataforma.</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-8 w-8 rounded-lg bg-[#B0E4EA]/40 flex items-center justify-center text-sm">🎨</span>
                <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Para creadores</p>
              </div>
              <h2 className="text-2xl font-bold mb-3">Tu carrera, visible y respaldada.</h2>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li className="flex gap-2"><span className="text-teal-600">→</span><span><strong>Campañas reales llegan a ti</strong> — no DMs, no audios, no renegociaciones.</span></li>
                <li className="flex gap-2"><span className="text-teal-600">→</span><span><strong>Perfil profesional</strong> con historial, KPIs, certificaciones Academy y badges de Nation.</span></li>
                <li className="flex gap-2"><span className="text-teal-600">→</span><span><strong>Verificación automática</strong> de seguidores IG/TikTok y publicaciones — tu número vale.</span></li>
                <li className="flex gap-2"><span className="text-teal-600">→</span><span><strong>Pagos estructurados</strong> con cuenta de cobro auto-generada y plazo garantizado.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo mide — puente al método */}
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">El método CoMa</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                No todos los creadores son iguales. Aquí se ve.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                CoMa Connect no es un directorio. Es un sistema que mide, clasifica y premia
                el trabajo bien hecho. Cada campaña suma XP, cada entrega a tiempo construye
                reputación, cada resultado deja huella visible.
              </p>
              <Link
                href="/metodo"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4B2C] hover:underline"
              >
                Ver cómo funciona el sistema de niveles →
              </Link>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Rookie", color: "bg-[#F4D79D]/60" },
                { label: "Creator", color: "bg-[#B0E4EA]/60" },
                { label: "Pro", color: "bg-[#D6E889]/60" },
                { label: "Elite", color: "bg-[#FF4B2C]/40" },
                { label: "Legend", color: "bg-foreground" },
              ].map((lvl, i) => (
                <div
                  key={lvl.label}
                  className={`rounded-xl p-4 text-center ${lvl.color} ${i === 4 ? "text-background" : "text-foreground"}`}
                >
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Nivel {i + 1}</p>
                  <p className="font-bold mt-1">{lvl.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Listing header */}
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
            Explorar la red
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Encuentra el <span className="text-[#FF4B2C]">creador</span> perfecto.
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Filtrá por nicho, ciudad, formato, skill o rating. Todos los perfiles están verificados.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-14">

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar de filtros */}
        <aside>
          <form method="get" className="space-y-5 lg:sticky lg:top-20">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Buscar
              </label>
              <Input name="q" defaultValue={p.q ?? ""} placeholder="nombre, headline, nicho…" />
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Ciudad
              </label>
              <Input name="ciudad" defaultValue={p.ciudad ?? ""} placeholder="Cali, Bogotá…" />
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Nicho
              </label>
              <Input name="nicho" defaultValue={p.nicho ?? ""} placeholder="moda, comida…" />
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Tipo de creador
              </label>
              <select
                name="tipo"
                defaultValue={p.tipo ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {CREATOR_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Formato
              </label>
              <select
                name="formato"
                defaultValue={p.formato ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {CONTENT_FORMATS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Seguidores mínimos
              </label>
              <select
                name="seguidores"
                defaultValue={p.seguidores ?? "0"}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {FOLLOWER_BUCKETS.map((b) => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Disponibilidad
              </label>
              <select
                name="disponibilidad"
                defaultValue={p.disponibilidad ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Cualquiera</option>
                <option value="AVAILABLE">Disponibles</option>
                <option value="LIMITED">Disponibilidad limitada</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Rating mínimo
              </label>
              <select
                name="rating"
                defaultValue={p.rating ?? "0"}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="0">Cualquiera</option>
                <option value="4">4⭐ o más</option>
                <option value="4.5">4.5⭐ o más</option>
                <option value="5">5⭐ únicamente</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                Skill
              </label>
              <select
                name="skill"
                defaultValue={p.skill ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Cualquiera</option>
                {allSkills.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="verificados"
                  value="1"
                  defaultChecked={p.verificados === "1"}
                />
                Solo verificados ✓
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="academy"
                  value="1"
                  defaultChecked={p.academy === "1"}
                />
                Con certificación Academy 🏅
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="speaker"
                  value="1"
                  defaultChecked={p.speaker === "1"}
                />
                Speaker Nation ⭐
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-9 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90"
            >
              Aplicar filtros
            </button>
            {activeFilters.length > 0 && (
              <Link
                href="/talento"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros
              </Link>
            )}
          </form>
        </aside>

        {/* Main: resultados */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "creador" : "creadores"}
                {activeFilters.length > 0 && <> · {activeFilters.join(" · ")}</>}
              </p>
            </div>
            <form method="get" className="flex items-center gap-2">
              {/* Preservar filtros al cambiar orden */}
              {Object.entries(p).map(([k, v]) =>
                v && k !== "orden" && k !== "page" ? (
                  <input key={k} type="hidden" name={k} value={v} />
                ) : null,
              )}
              <label className="text-xs text-muted-foreground">Ordenar:</label>
              <select
                name="orden"
                defaultValue={sort}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                onChange={undefined}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <button type="submit" className="text-xs text-primary hover:underline">
                Aplicar
              </button>
            </form>
          </div>

          {items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <p className="text-lg">No hay creadores que coincidan.</p>
              <p className="mt-1 text-sm">Ajustá los filtros o <Link href="/talento" className="text-primary hover:underline">limpiá la búsqueda</Link>.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.map((c) => {
                const displayName = c.artistName || c.fullName;
                const topSocial = c.socialProfiles[0];
                return (
                  <Link
                    key={c.id}
                    href={`/c/${c.slug}`}
                    className="group rounded-xl border border-border hover:border-foreground/20 bg-card p-5 transition"
                  >
                    <div className="flex items-start gap-3">
                      {c.profileImageUrl ? (
                        <img
                          src={c.profileImageUrl}
                          alt={displayName}
                          className="h-14 w-14 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold truncate">{displayName}</h3>
                          {c.comaVerifiedAt && (
                            <span title="Verificado por CoMa" className="text-[#FF4B2C] shrink-0" aria-label="Verificado">
                              ✓
                            </span>
                          )}
                        </div>
                        {c.headline && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{c.headline}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {c.city && <span>📍 {c.city}</span>}
                          {topSocial?.verifiedFollowers && (
                            <span>· {topSocial.verifiedFollowers.toLocaleString("es-CO")} seguidores</span>
                          )}
                          {c.avgRating != null && c.reviewsCount > 0 && (
                            <span>· ★ {c.avgRating.toFixed(1)} ({c.reviewsCount})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {c.creatorTypes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.creatorTypes.slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="font-normal text-[10px]">
                            {t.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3 text-sm">
              {page > 1 ? (
                <Link
                  href={buildPageUrl(page - 1)}
                  className="px-4 h-9 inline-flex items-center rounded-md border border-border hover:bg-muted"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="px-4 h-9 inline-flex items-center rounded-md border border-border text-muted-foreground opacity-50">
                  ← Anterior
                </span>
              )}
              <span className="text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={buildPageUrl(page + 1)}
                  className="px-4 h-9 inline-flex items-center rounded-md border border-border hover:bg-muted"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="px-4 h-9 inline-flex items-center rounded-md border border-border text-muted-foreground opacity-50">
                  Siguiente →
                </span>
              )}
            </div>
          )}
        </section>
      </div>
      </div>
      <CrossNav current="connect" />
    </div>
  );
}
