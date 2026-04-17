import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listPublicCreators } from "@/lib/public-creator";

export const metadata: Metadata = {
  title: "Explorar talento — CoMa Connect",
  description:
    "Descubre creadores de contenido verificados en LATAM: UGC, influencers, filmmakers, fotógrafos y más.",
};

type SearchParams = Promise<{
  ciudad?: string;
  nicho?: string;
  tipo?: string;
}>;

const CREATOR_TYPES = [
  { key: "UGC", label: "UGC" },
  { key: "INFLUENCER", label: "Influencer" },
  { key: "FILMMAKER", label: "Filmmaker" },
  { key: "PHOTOGRAPHER", label: "Fotografía" },
  { key: "EDITOR", label: "Edición" },
  { key: "STRATEGIST", label: "Estrategia" },
];

export default async function TalentoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const creators = await listPublicCreators({
    city: params.ciudad,
    niche: params.nicho,
    type: params.tipo,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Encuentra el <span className="text-[#FF4B2C]">creador</span> perfecto para tu marca
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          Red profesional de creadores de contenido verificados en LATAM. Portafolios reales,
          reputación respaldada por campañas ejecutadas.
        </p>
      </div>

      {/* Filtros */}
      <form method="get" className="mb-8 flex flex-col md:flex-row gap-3">
        <Input
          name="ciudad"
          defaultValue={params.ciudad ?? ""}
          placeholder="Ciudad (Cali, Bogotá, Medellín…)"
          className="md:max-w-xs"
        />
        <Input
          name="nicho"
          defaultValue={params.nicho ?? ""}
          placeholder="Nicho (moda, comida, fitness…)"
          className="md:max-w-xs"
        />
        <select
          name="tipo"
          defaultValue={params.tipo ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm md:max-w-xs"
        >
          <option value="">Todos los tipos</option>
          {CREATOR_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 px-6 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {creators.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">Aún no hay creadores que coincidan con tu búsqueda.</p>
          <p className="mt-1 text-sm">Prueba ajustando los filtros.</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {creators.length} {creators.length === 1 ? "creador" : "creadores"} disponibles
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {creators.map((c) => {
              const displayName = c.artistName || c.fullName;
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
                          <span
                            title="Verificado por CoMa"
                            className="text-[#FF4B2C] shrink-0"
                            aria-label="Verificado"
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      {c.headline && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {c.headline}
                        </p>
                      )}
                      {c.city && (
                        <p className="mt-1 text-xs text-muted-foreground">📍 {c.city}</p>
                      )}
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
        </>
      )}
    </div>
  );
}
