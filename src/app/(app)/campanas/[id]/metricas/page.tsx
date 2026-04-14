import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

async function saveMetrics(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  const contentPieceId = formData.get("contentPieceId") as string;

  await prisma.contentMetric.create({
    data: {
      contentPieceId,
      views: parseInt(formData.get("views") as string) || null,
      likes: parseInt(formData.get("likes") as string) || null,
      comments: parseInt(formData.get("comments") as string) || null,
      saves: parseInt(formData.get("saves") as string) || null,
      shares: parseInt(formData.get("shares") as string) || null,
      reach: parseInt(formData.get("reach") as string) || null,
      impressions: parseInt(formData.get("impressions") as string) || null,
    },
  });

  redirect(`/campanas/${campaignId}/metricas`);
}

export default async function MetricasCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      campaignCreators: {
        include: {
          creator: { select: { fullName: true } },
          contentPieces: {
            where: { status: "PUBLISHED" },
            include: {
              metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!campaign) notFound();

  // Calcular totales
  let totalViews = 0, totalLikes = 0, totalComments = 0, totalSaves = 0, totalShares = 0;

  const creatorStats = campaign.campaignCreators
    .filter((cc) => cc.contentPieces.length > 0)
    .map((cc) => {
      let views = 0, likes = 0, comments = 0, saves = 0, shares = 0;
      for (const piece of cc.contentPieces) {
        const m = piece.metrics[0];
        if (m) {
          views += m.views ?? 0;
          likes += m.likes ?? 0;
          comments += m.comments ?? 0;
          saves += m.saves ?? 0;
          shares += m.shares ?? 0;
        }
      }
      totalViews += views;
      totalLikes += likes;
      totalComments += comments;
      totalSaves += saves;
      totalShares += shares;
      return { creator: cc.creator.fullName, pieces: cc.contentPieces, views, likes, comments, saves, shares };
    });

  const piecesWithoutMetrics = campaign.campaignCreators.flatMap((cc) =>
    cc.contentPieces
      .filter((p) => p.metrics.length === 0)
      .map((p) => ({ ...p, creatorName: cc.creator.fullName }))
  );

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link href={`/campanas/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {campaign.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Métricas y Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">{campaign.client.name}</p>
      </div>

      {/* Totales */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 mb-8">
        {[
          { label: "Visualizaciones", value: totalViews, color: "text-primary" },
          { label: "Likes", value: totalLikes, color: "text-pink-600" },
          { label: "Comentarios", value: totalComments, color: "text-amber-600" },
          { label: "Guardados", value: totalSaves, color: "text-teal-600" },
          { label: "Compartidos", value: totalShares, color: "text-lime-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>
              {stat.value.toLocaleString("es-CO")}
            </p>
          </div>
        ))}
      </div>

      {/* Por creadora */}
      {creatorStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">KPIs por creadora</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creadora</th>
                  <th className="text-right px-3 py-3 font-medium text-muted-foreground">Views</th>
                  <th className="text-right px-3 py-3 font-medium text-muted-foreground">Likes</th>
                  <th className="text-right px-3 py-3 font-medium text-muted-foreground">Comments</th>
                  <th className="text-right px-3 py-3 font-medium text-muted-foreground">Saves</th>
                  <th className="text-right px-3 py-3 font-medium text-muted-foreground">Shares</th>
                  <th className="text-right px-3 py-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {creatorStats
                  .sort((a, b) => b.views - a.views)
                  .map((cs) => (
                    <tr key={cs.creator} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{cs.creator}</td>
                      <td className="px-3 py-3 text-right">{cs.views.toLocaleString("es-CO")}</td>
                      <td className="px-3 py-3 text-right">{cs.likes.toLocaleString("es-CO")}</td>
                      <td className="px-3 py-3 text-right">{cs.comments.toLocaleString("es-CO")}</td>
                      <td className="px-3 py-3 text-right">{cs.saves.toLocaleString("es-CO")}</td>
                      <td className="px-3 py-3 text-right">{cs.shares.toLocaleString("es-CO")}</td>
                      <td className="px-3 py-3 text-right font-bold text-primary">
                        {(cs.views + cs.likes + cs.comments + cs.saves + cs.shares).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                <tr className="bg-secondary/30 font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-3 py-3 text-right">{totalViews.toLocaleString("es-CO")}</td>
                  <td className="px-3 py-3 text-right">{totalLikes.toLocaleString("es-CO")}</td>
                  <td className="px-3 py-3 text-right">{totalComments.toLocaleString("es-CO")}</td>
                  <td className="px-3 py-3 text-right">{totalSaves.toLocaleString("es-CO")}</td>
                  <td className="px-3 py-3 text-right">{totalShares.toLocaleString("es-CO")}</td>
                  <td className="px-3 py-3 text-right text-primary">
                    {(totalViews + totalLikes + totalComments + totalSaves + totalShares).toLocaleString("es-CO")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cargar métricas */}
      {piecesWithoutMetrics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Piezas sin métricas ({piecesWithoutMetrics.length})
          </h2>
          <div className="space-y-3">
            {piecesWithoutMetrics.map((piece) => (
              <div key={piece.id} className="rounded-xl border border-[#F4D79D]/50 bg-[#F4D79D]/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium text-sm">{piece.title}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {piece.platform === "INSTAGRAM" ? "IG" : "TK"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">— {piece.creatorName}</span>
                </div>
                <form action={saveMetrics} className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  <input type="hidden" name="campaignId" value={id} />
                  <input type="hidden" name="contentPieceId" value={piece.id} />
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Views</Label>
                    <Input name="views" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Likes</Label>
                    <Input name="likes" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Comments</Label>
                    <Input name="comments" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Saves</Label>
                    <Input name="saves" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Shares</Label>
                    <Input name="shares" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Reach</Label>
                    <Input name="reach" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Impressions</Label>
                    <Input name="impressions" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" size="sm" className="w-full">Guardar</Button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {creatorStats.length === 0 && piecesWithoutMetrics.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no hay contenido publicado para medir. Las métricas aparecen cuando las piezas llegan a estado "Publicado".
          </p>
        </div>
      )}
    </div>
  );
}
