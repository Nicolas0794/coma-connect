import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { respondToReview, toggleReviewPublic } from "./actions";

export default async function ReviewsPage() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true, avgRating: true, reviewsCount: true },
  });
  if (!creator) redirect("/mi-espacio");

  const reviews = await prisma.creatorReview.findMany({
    where: { creatorId: creator.id },
    include: {
      client: { select: { name: true, logoUrl: true } },
      campaignCreator: {
        include: {
          campaign: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <Link href="/mi-espacio" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Reseñas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calificaciones y feedback de marcas que trabajaron contigo.
        </p>
      </div>

      {/* Resumen */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Promedio</p>
            <p className="text-4xl font-bold">
              {creator.avgRating ? creator.avgRating.toFixed(1) : "—"}
              <span className="text-amber-500 text-2xl ml-1">★</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-4xl font-bold">{creator.reviewsCount}</p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Aún no tenés reseñas.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aparecen cuando un cliente te califica al cerrar una campaña.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-5 ${
                r.isPublic ? "border-border bg-card" : "border-muted bg-muted/30 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.client.name}</span>
                    <span className="text-amber-500">
                      {"★".repeat(r.rating)}
                      <span className="text-muted-foreground/40">{"★".repeat(5 - r.rating)}</span>
                    </span>
                    {!r.isPublic && (
                      <Badge variant="outline" className="text-[10px]">Oculta</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.campaignCreator.campaign.code} — {r.campaignCreator.campaign.name} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <form action={toggleReviewPublic}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    {r.isPublic ? "Ocultar" : "Hacer pública"}
                  </Button>
                </form>
              </div>

              {r.feedback && (
                <p className="mt-3 text-sm text-foreground/80 whitespace-pre-line">{r.feedback}</p>
              )}

              {/* Respuesta existente */}
              {r.creatorResponse && (
                <div className="mt-4 rounded-lg bg-muted p-3 border-l-2 border-[#FF4B2C]">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Tu respuesta ·{" "}
                    {r.creatorResponseAt
                      ? new Date(r.creatorResponseAt).toLocaleDateString("es-CO")
                      : ""}
                  </p>
                  <p className="text-sm whitespace-pre-line">{r.creatorResponse}</p>
                </div>
              )}

              {/* Form para responder (solo si no respondió) */}
              {!r.creatorResponse && r.isPublic && (
                <form action={respondToReview} className="mt-4 flex items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <textarea
                    name="response"
                    rows={2}
                    placeholder="Responder públicamente (opcional)"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button type="submit" size="sm">Responder</Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
