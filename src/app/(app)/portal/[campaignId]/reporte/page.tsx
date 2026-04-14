import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ReporteClientePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "CLIENT") redirect("/");

  const { campaignId } = await params;

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true },
  });
  if (!membership) redirect("/portal");

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, clientId: membership.clientId },
    include: {
      campaignCreators: {
        where: { status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } },
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

  let totalViews = 0, totalLikes = 0, totalComments = 0, totalSaves = 0, totalShares = 0;
  let totalPieces = 0;

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
      totalPieces += cc.contentPieces.length;
      return { creator: cc.creator.fullName, piecesCount: cc.contentPieces.length, views, likes, comments, saves, shares };
    });

  const totalEngagement = totalViews + totalLikes + totalComments + totalSaves + totalShares;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href={`/portal/${campaignId}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Orange Space
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Reporte — {campaign.name}</h1>
      </div>

      {/* Resumen ejecutivo */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
          Resumen de campaña
        </h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div>
            <p className="text-3xl font-bold text-primary">{totalViews.toLocaleString("es-CO")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Visualizaciones</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{totalEngagement.toLocaleString("es-CO")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Alcance total</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{totalPieces}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Piezas publicadas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{creatorStats.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Creadoras</p>
          </div>
        </div>
      </div>

      {/* Detalle de KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 mb-8">
        {[
          { label: "Views", value: totalViews, color: "bg-primary/10 text-primary border-primary/20" },
          { label: "Likes", value: totalLikes, color: "bg-[#F4C0D1]/30 text-pink-700 border-[#F4C0D1]/50" },
          { label: "Comments", value: totalComments, color: "bg-[#F4D79D]/30 text-amber-700 border-[#F4D79D]/50" },
          { label: "Saves", value: totalSaves, color: "bg-[#B0E4EA]/30 text-teal-700 border-[#B0E4EA]/50" },
          { label: "Shares", value: totalShares, color: "bg-[#D6E889]/30 text-lime-700 border-[#D6E889]/50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
            <p className="text-[10px] uppercase tracking-wider opacity-70">{stat.label}</p>
            <p className="text-xl font-bold mt-0.5">{stat.value.toLocaleString("es-CO")}</p>
          </div>
        ))}
      </div>

      {/* Tabla por creadora */}
      {creatorStats.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground">Resultados por creadora</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Creadora</th>
                <th className="text-center px-2 py-2.5 text-xs text-muted-foreground font-medium">Piezas</th>
                <th className="text-right px-2 py-2.5 text-xs text-muted-foreground font-medium">Views</th>
                <th className="text-right px-2 py-2.5 text-xs text-muted-foreground font-medium">Likes</th>
                <th className="text-right px-2 py-2.5 text-xs text-muted-foreground font-medium">Comments</th>
                <th className="text-right px-2 py-2.5 text-xs text-muted-foreground font-medium">Saves</th>
                <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Shares</th>
              </tr>
            </thead>
            <tbody>
              {creatorStats
                .sort((a, b) => b.views - a.views)
                .map((cs, i) => (
                  <tr key={cs.creator} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">
                      {i === 0 && creatorStats.length > 1 && <span className="mr-1">⭐</span>}
                      {cs.creator}
                    </td>
                    <td className="px-2 py-2.5 text-center">{cs.piecesCount}</td>
                    <td className="px-2 py-2.5 text-right">{cs.views.toLocaleString("es-CO")}</td>
                    <td className="px-2 py-2.5 text-right">{cs.likes.toLocaleString("es-CO")}</td>
                    <td className="px-2 py-2.5 text-right">{cs.comments.toLocaleString("es-CO")}</td>
                    <td className="px-2 py-2.5 text-right">{cs.saves.toLocaleString("es-CO")}</td>
                    <td className="px-4 py-2.5 text-right">{cs.shares.toLocaleString("es-CO")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no hay métricas disponibles. Aparecen cuando las piezas se publican y el equipo CoMa carga los KPIs.
          </p>
        </div>
      )}
    </div>
  );
}
