import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { syncCreatorVerificationOnComplete } from "@/lib/creator-triggers";

async function rateCreator(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  const creatorId = formData.get("creatorId") as string;
  const rating = parseInt(formData.get("rating") as string);
  const notes = (formData.get("notes") as string)?.trim();
  const ccId = formData.get("ccId") as string;

  if (rating >= 1 && rating <= 5) {
    await prisma.creator.update({
      where: { id: creatorId },
      data: { internalRating: rating, notes },
    });
    await prisma.campaignCreator.update({
      where: { id: ccId },
      data: { status: "COMPLETED", completedAt: new Date(), notes },
    });
    await syncCreatorVerificationOnComplete(ccId);
  }

  redirect(`/campanas/${campaignId}/evaluacion`);
}

async function closeCampaign(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "COMPLETED" },
  });
  redirect(`/campanas/${campaignId}`);
}

export default async function EvaluacionCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      campaignCreators: {
        where: { status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } },
        include: {
          creator: {
            select: { id: true, fullName: true, internalRating: true, notes: true },
          },
          contentPieces: {
            where: { status: "PUBLISHED" },
            include: { metrics: { orderBy: { capturedAt: "desc" }, take: 1 } },
          },
          _count: { select: { contentPieces: true } },
        },
      },
    },
  });

  if (!campaign) notFound();

  const evaluatedCount = campaign.campaignCreators.filter((cc) => cc.status === "COMPLETED").length;
  const totalCount = campaign.campaignCreators.length;
  const allEvaluated = evaluatedCount === totalCount && totalCount > 0;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href={`/campanas/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {campaign.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Evaluación y cierre</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {evaluatedCount}/{totalCount} creadoras evaluadas
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {campaign.campaignCreators.map((cc) => {
          const totalViews = cc.contentPieces.reduce((sum, p) => sum + (p.metrics[0]?.views ?? 0), 0);
          const totalLikes = cc.contentPieces.reduce((sum, p) => sum + (p.metrics[0]?.likes ?? 0), 0);
          const isEvaluated = cc.status === "COMPLETED";

          return (
            <div
              key={cc.id}
              className={`rounded-xl border p-5 ${
                isEvaluated ? "border-[#D6E889]/50 bg-[#D6E889]/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{cc.creator.fullName}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{cc._count.contentPieces} pieza{cc._count.contentPieces !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{totalViews.toLocaleString("es-CO")} views</span>
                      <span>·</span>
                      <span>{totalLikes.toLocaleString("es-CO")} likes</span>
                    </div>
                  </div>
                </div>
                {isEvaluated && cc.creator.internalRating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= cc.creator.internalRating! ? "text-[#F4D79D]" : "text-border"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isEvaluated ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#D6E889]/30 text-lime-700">Evaluada</Badge>
                  {cc.notes && (
                    <span className="text-xs text-muted-foreground">{cc.notes}</span>
                  )}
                </div>
              ) : (
                <form action={rateCreator} className="flex items-end gap-3 mt-2">
                  <input type="hidden" name="campaignId" value={id} />
                  <input type="hidden" name="creatorId" value={cc.creator.id} />
                  <input type="hidden" name="ccId" value={cc.id} />
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Rating (1-5)</label>
                    <select
                      name="rating"
                      required
                      className="h-9 rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                    >
                      <option value="">—</option>
                      <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                      <option value="4">⭐⭐⭐⭐ Muy buena</option>
                      <option value="3">⭐⭐⭐ Buena</option>
                      <option value="2">⭐⭐ Regular</option>
                      <option value="1">⭐ Deficiente</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Notas</label>
                    <input
                      name="notes"
                      placeholder="Observaciones sobre la creadora..."
                      className="h-9 w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <Button type="submit" size="default">Evaluar</Button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {allEvaluated && campaign.status !== "COMPLETED" && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-foreground font-medium mb-3">
            Todas las creadoras fueron evaluadas. ¿Cerrar esta campaña?
          </p>
          <form action={closeCampaign}>
            <input type="hidden" name="campaignId" value={id} />
            <Button type="submit">Cerrar campaña</Button>
          </form>
        </div>
      )}

      {campaign.status === "COMPLETED" && (
        <div className="rounded-xl border border-[#D6E889]/50 bg-[#D6E889]/10 p-6 text-center">
          <p className="text-lime-700 font-medium">Esta campaña está cerrada y evaluada. ✓</p>
        </div>
      )}
    </div>
  );
}
