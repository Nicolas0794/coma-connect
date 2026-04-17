import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CreadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ nicho?: string; estado?: string }>;
}) {
  const params = await searchParams;
  const nichoFilter = params.nicho?.trim();
  const estadoFilter = params.estado?.trim();

  const pendingCount = await prisma.creator.count({
    where: { profileStatus: "PENDING_REVIEW" },
  });

  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      ...(nichoFilter ? { niches: { has: nichoFilter } } : {}),
      ...(estadoFilter === "pendientes"
        ? { profileStatus: "PENDING_REVIEW" }
        : estadoFilter === "publicados"
          ? { profileStatus: "PUBLISHED" }
          : {}),
    },
    include: {
      socialProfiles: true,
      _count: { select: { campaignCreators: true } },
    },
  });

  const allNiches = await prisma.creator.findMany({
    select: { niches: true },
  });
  const uniqueNiches = [
    ...new Set(allNiches.flatMap((c) => c.niches)),
  ].sort();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Creadores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {creators.length === 0
              ? "Todavía no hay creadores cargados."
              : `${creators.length} creador${creators.length > 1 ? "es" : ""}`}
          </p>
        </div>
        <Link href="/creadores/nuevo">
          <Button>Nuevo creador</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/creadores">
          <Badge
            variant={!estadoFilter && !nichoFilter ? "default" : "outline"}
            className="cursor-pointer"
          >
            Todos
          </Badge>
        </Link>
        <Link href="/creadores?estado=pendientes">
          <Badge
            variant={estadoFilter === "pendientes" ? "default" : "outline"}
            className={`cursor-pointer ${pendingCount > 0 && estadoFilter !== "pendientes" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}`}
          >
            Pendientes de revisión {pendingCount > 0 && `(${pendingCount})`}
          </Badge>
        </Link>
        <Link href="/creadores?estado=publicados">
          <Badge
            variant={estadoFilter === "publicados" ? "default" : "outline"}
            className="cursor-pointer"
          >
            Publicados
          </Badge>
        </Link>
      </div>

      {uniqueNiches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {uniqueNiches.map((nicho) => (
            <Link key={nicho} href={`/creadores?nicho=${encodeURIComponent(nicho)}`}>
              <Badge
                variant={nichoFilter === nicho ? "default" : "outline"}
                className="cursor-pointer text-xs"
              >
                {nicho}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {creators.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creadores/${creator.id}`}
              className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {creator.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {creator.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {creator.city ?? "Sin ciudad"}
                    {creator.country ? `, ${creator.country}` : ""}
                  </p>
                </div>
              </div>

              {creator.niches.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {creator.niches.map((n) => (
                    <Badge key={n} variant="secondary" className="text-[10px]">
                      {n}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {creator.socialProfiles.map((sp) => (
                  <span key={sp.id}>
                    {sp.platform === "INSTAGRAM" ? "IG" : "TK"}{" "}
                    <span className="font-medium text-foreground">
                      @{sp.handle}
                    </span>
                  </span>
                ))}
                <span className="ml-auto">
                  {creator._count.campaignCreators} campaña
                  {creator._count.campaignCreators !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {nichoFilter
              ? `No hay creadores con el nicho "${nichoFilter}".`
              : "Cargá tu primer creador para armar tu base de talento."}
          </p>
          <Link href="/creadores/nuevo">
            <Button>Crear primer creador</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
