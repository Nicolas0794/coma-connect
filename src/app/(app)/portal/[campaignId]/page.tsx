import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifyButton } from "@/components/verify-button";
import { notifyCreatorSelected, notifyCreatorVideoApproved, notifyCreatorChangesRequested } from "@/lib/notifications";
import { getCreatorTiersBatch } from "@/lib/creator-report";
import { TierBadge } from "@/components/tier-badge";
import {
  syncCreatorVerificationOnComplete,
  upsertPublicReviewFromRating,
  recomputeCreatorRating,
} from "@/lib/creator-triggers";

const contentStatusLabels: Record<string, string> = {
  IDEA: "En producción",
  SCRIPT: "En producción",
  INTERNAL_REVIEW: "En revisión interna",
  CLIENT_REVIEW: "Pendiente tu revisión",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

async function inviteSuggestedCreator(formData: FormData) {
  "use server";
  const creatorId = formData.get("creatorId") as string;
  const campaignId = formData.get("campaignId") as string;

  const session = await auth();
  if (session?.user?.role !== "CLIENT") return;

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true },
  });
  if (!membership) return;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, clientId: membership.clientId },
    select: { name: true, client: { select: { name: true } } },
  });
  if (!campaign) return;

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { email: true, fullName: true },
  });
  if (!creator) return;

  await prisma.campaignCreator.upsert({
    where: { campaignId_creatorId: { campaignId, creatorId } },
    create: {
      campaignId,
      creatorId,
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
    update: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await prisma.clientCreator.upsert({
    where: { clientId_creatorId: { clientId: membership.clientId, creatorId } },
    create: { clientId: membership.clientId, creatorId },
    update: { lastCollaborationAt: new Date(), campaignsCount: { increment: 1 } },
  });

  if (creator.email) {
    await notifyCreatorSelected(creator.email, creator.fullName, campaign.name, campaign.client.name);
  }
  redirect(`/portal/${campaignId}`);
}

async function approveCreator(formData: FormData) {
  "use server";
  const ccId = formData.get("ccId") as string;
  const campaignId = formData.get("campaignId") as string;
  const cc = await prisma.campaignCreator.update({
    where: { id: ccId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
    include: {
      creator: { select: { id: true, email: true, fullName: true, phone: true } },
      campaign: { select: { clientId: true, name: true, client: { select: { name: true } } } },
    },
  });

  // Agregar/actualizar a la comunidad del cliente.
  await prisma.clientCreator.upsert({
    where: {
      clientId_creatorId: {
        clientId: cc.campaign.clientId,
        creatorId: cc.creator.id,
      },
    },
    create: {
      clientId: cc.campaign.clientId,
      creatorId: cc.creator.id,
    },
    update: {
      lastCollaborationAt: new Date(),
      campaignsCount: { increment: 1 },
    },
  });

  if (cc.creator.email) {
    await notifyCreatorSelected(cc.creator.email, cc.creator.fullName, cc.campaign.name, cc.campaign.client.name);
  }
  redirect(`/portal/${campaignId}`);
}

async function rejectCreator(formData: FormData) {
  "use server";
  const ccId = formData.get("ccId") as string;
  const campaignId = formData.get("campaignId") as string;
  await prisma.campaignCreator.update({
    where: { id: ccId },
    data: { status: "DECLINED" },
  });
  redirect(`/portal/${campaignId}`);
}

async function closeCampaign(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;

  const session = await auth();
  if (session?.user?.role !== "CLIENT") return;

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true },
  });
  if (!membership) return;

  const now = new Date();
  await prisma.campaign.update({
    where: { id: campaignId, clientId: membership.clientId },
    data: { status: "COMPLETED" },
  });
  // Capturar los CC que aún no están cerrados para disparar hooks sobre ellos.
  const pending = await prisma.campaignCreator.findMany({
    where: {
      campaignId,
      status: { notIn: ["DECLINED", "REMOVED", "COMPLETED"] },
    },
    select: { id: true },
  });
  await prisma.campaignCreator.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: { status: "COMPLETED", completedAt: now },
  });
  for (const p of pending) {
    await syncCreatorVerificationOnComplete(p.id);
  }
  redirect(`/portal/${campaignId}`);
}

async function rateCreator(formData: FormData) {
  "use server";
  const ccId = formData.get("ccId") as string;
  const campaignId = formData.get("campaignId") as string;
  const ratingRaw = (formData.get("rating") as string) || "";
  const feedback = (formData.get("feedback") as string)?.trim() || null;
  const rating = Math.min(5, Math.max(1, parseInt(ratingRaw, 10) || 0));

  if (rating < 1) return;

  const session = await auth();
  if (session?.user?.role !== "CLIENT") return;

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true },
  });
  if (!membership) return;

  // Confirmar que el CampaignCreator pertenece a una campaña del cliente.
  const cc = await prisma.campaignCreator.findUnique({
    where: { id: ccId },
    select: { campaign: { select: { clientId: true } } },
  });
  if (!cc || cc.campaign.clientId !== membership.clientId) return;

  const isPublic = formData.get("isPublic") === "on";

  await prisma.campaignCreator.update({
    where: { id: ccId },
    data: {
      clientRating: rating,
      clientFeedback: feedback,
      ratedAt: new Date(),
    },
  });
  await upsertPublicReviewFromRating(ccId);
  // Reflejar la preferencia del cliente (el hook setea public=true por default)
  await prisma.creatorReview.updateMany({
    where: { campaignCreatorId: ccId },
    data: { isPublic },
  });
  const ccAfter = await prisma.campaignCreator.findUnique({
    where: { id: ccId },
    select: { creatorId: true },
  });
  if (ccAfter) await recomputeCreatorRating(ccAfter.creatorId);
  redirect(`/portal/${campaignId}`);
}

async function approveContent(formData: FormData) {
  "use server";
  const pieceId = formData.get("pieceId") as string;
  const campaignId = formData.get("campaignId") as string;
  const existing = await prisma.contentPiece.findUnique({
    where: { id: pieceId },
    select: { approvedAt: true },
  });

  const piece = await prisma.contentPiece.update({
    where: { id: pieceId },
    data: {
      status: "APPROVED",
      approvedAt: existing?.approvedAt ?? new Date(),
    },
    include: {
      campaignCreator: {
        include: {
          creator: { select: { email: true, fullName: true } },
          campaign: { select: { name: true } },
        },
      },
    },
  });
  const creator = piece.campaignCreator.creator;
  if (creator.email) {
    await notifyCreatorVideoApproved(creator.email, creator.fullName, piece.campaignCreator.campaign.name, piece.title);
  }
  redirect(`/portal/${campaignId}`);
}

async function requestChanges(formData: FormData) {
  "use server";
  const pieceId = formData.get("pieceId") as string;
  const campaignId = formData.get("campaignId") as string;
  const feedback = (formData.get("feedback") as string)?.trim();

  const piece = await prisma.contentPiece.findUnique({ where: { id: pieceId } });
  if (!piece) return;

  const lastVersion = await prisma.contentRevision.findFirst({
    where: { contentPieceId: pieceId },
    orderBy: { version: "desc" },
  });

  await prisma.contentRevision.create({
    data: {
      contentPieceId: pieceId,
      version: (lastVersion?.version ?? 0) + 1,
      body: "Cambios solicitados por el cliente",
      feedback: feedback || "Se requieren ajustes",
    },
  });

  const updatedPiece = await prisma.contentPiece.update({
    where: { id: pieceId },
    data: { status: "SCRIPT" },
    include: {
      campaignCreator: {
        include: {
          creator: { select: { email: true, fullName: true } },
          campaign: { select: { name: true } },
        },
      },
    },
  });
  const cr = updatedPiece.campaignCreator.creator;
  if (cr.email) {
    await notifyCreatorChangesRequested(cr.email, cr.fullName, updatedPiece.campaignCreator.campaign.name, updatedPiece.title, feedback || "Se requieren ajustes");
  }

  redirect(`/portal/${campaignId}`);
}

export default async function PortalCampanaPage({
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
        include: {
          creator: {
            include: { socialProfiles: true },
          },
          contentPieces: {
            orderBy: { createdAt: "desc" },
            include: {
              revisions: { orderBy: { version: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { invitedAt: "desc" },
      },
      attachments: { orderBy: { uploadedAt: "asc" } },
      suggestions: {
        orderBy: { score: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              city: true,
              niches: true,
              profileImageUrl: true,
              socialProfiles: {
                select: {
                  platform: true,
                  handle: true,
                  verifiedFollowers: true,
                  followers: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!campaign) notFound();

  const alreadyInCampaign = new Set(campaign.campaignCreators.map((cc) => cc.creatorId));
  const pendingSuggestions = campaign.suggestions.filter(
    (s) => !alreadyInCampaign.has(s.creatorId),
  );

  const tiers = await getCreatorTiersBatch([
    ...pendingSuggestions.map((s) => s.creatorId),
    ...campaign.campaignCreators.map((cc) => cc.creatorId),
  ]);

  const pendingApproval = campaign.campaignCreators.filter(
    (cc) => cc.status === "INVITED"
  );
  const approved = campaign.campaignCreators.filter(
    (cc) => cc.status !== "INVITED" && cc.status !== "DECLINED"
  );
  const declined = campaign.campaignCreators.filter(
    (cc) => cc.status === "DECLINED"
  );

  const pendingReview = approved.flatMap((cc) =>
    cc.contentPieces
      .filter((p) => p.status === "CLIENT_REVIEW")
      .map((p) => ({ ...p, creatorName: cc.creator.fullName }))
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <a
          href="/portal"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Orange Space
        </a>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl text-foreground">{campaign.name}</h1>
          <div className="flex gap-2">
            <Link href={`/portal/${campaignId}/reporte`}>
              <Button variant="outline" size="sm">Reporte</Button>
            </Link>
            <Link href={`/campanas/${campaignId}/chat`}>
              <Button variant="outline" size="sm">Chat</Button>
            </Link>
            {campaign.status !== "COMPLETED" && campaign.status !== "CANCELLED" && (
              <form action={closeCampaign}>
                <input type="hidden" name="campaignId" value={campaignId} />
                <Button type="submit" size="sm">Cerrar campaña</Button>
              </form>
            )}
          </div>
        </div>
        {campaign.objective && (
          <p className="text-sm text-muted-foreground mt-1">{campaign.objective}</p>
        )}
        {campaign.status === "COMPLETED" && (
          <p className="text-xs text-lime-700 mt-1 font-medium">
            Campaña completada — podés calificar a cada creadora abajo.
          </p>
        )}
      </div>

      {/* Adjuntos del cliente */}
      {campaign.attachments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-3">
            Material de referencia ({campaign.attachments.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {campaign.attachments.map((att) => (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary hover:text-primary transition-colors"
              >
                <span>📎</span>
                <span className="truncate max-w-[240px]">{att.fileName}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sugerencias de creadoras (IA) */}
      {pendingSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-1">
            Sugerencias de creadoras para esta campaña
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            La IA sugiere estas creadoras según el perfil que buscás. Las de tu
            comunidad ya trabajaron con vos antes.
          </p>
          <div className="space-y-3">
            {pendingSuggestions.map((sug) => {
              const c = sug.creator;
              const ig = c.socialProfiles.find((sp) => sp.platform === "INSTAGRAM");
              const tk = c.socialProfiles.find((sp) => sp.platform === "TIKTOK");
              const igFollowers = ig?.verifiedFollowers ?? ig?.followers;
              const tkFollowers = tk?.verifiedFollowers ?? tk?.followers;
              return (
                <div
                  key={sug.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {c.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{c.fullName}</h3>
                          <TierBadge tier={tiers.get(c.id) ?? "BRONZE"} />
                          {sug.fromCommunity && (
                            <Badge className="text-[10px] bg-[#FF4B2C]/15 text-[#FF4B2C] border-0">
                              De tu comunidad
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            Match {sug.score}
                          </Badge>
                        </div>
                        {c.city && (
                          <p className="text-xs text-muted-foreground">{c.city}</p>
                        )}
                        {c.niches.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {c.niches.map((n) => (
                              <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                          {ig && (
                            <span>IG @{ig.handle}{igFollowers ? ` · ${igFollowers.toLocaleString("es-CO")}` : ""}</span>
                          )}
                          {tk && (
                            <span>TK @{tk.handle}{tkFollowers ? ` · ${tkFollowers.toLocaleString("es-CO")}` : ""}</span>
                          )}
                        </div>
                        <p className="text-xs text-foreground mt-2 italic">“{sug.reason}”</p>
                      </div>
                    </div>
                    <form action={inviteSuggestedCreator} className="shrink-0">
                      <input type="hidden" name="creatorId" value={c.id} />
                      <input type="hidden" name="campaignId" value={campaignId} />
                      <Button type="submit" size="sm">Invitar</Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creadores pendientes de aprobación */}
      {pendingApproval.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Creadores propuestos ({pendingApproval.length})
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Estas creadoras se postularon a tu campaña. Revisá sus perfiles y decidí con quién querés trabajar.
          </p>
          <div className="space-y-3">
            {pendingApproval.map((cc) => (
              <div
                key={cc.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">
                          {cc.creator.fullName}
                        </h3>
                        <TierBadge tier={tiers.get(cc.creator.id) ?? "BRONZE"} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cc.creator.city}{cc.creator.country ? `, ${cc.creator.country}` : ""}
                      </p>
                      {cc.creator.niches.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cc.creator.niches.map((n) => (
                            <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 space-y-1">
                        {cc.creator.socialProfiles.map((sp) => {
                          const isVerified = sp.verifiedAt !== null;
                          const selfReported = sp.selfReportedFollowers;
                          const verified = sp.verifiedFollowers;
                          const hasMismatch = selfReported && verified && Math.abs(selfReported - verified) / verified > 0.15;
                          const profileUrl = sp.platform === "INSTAGRAM"
                            ? `https://instagram.com/${sp.handle}`
                            : `https://tiktok.com/@${sp.handle}`;
                          return (
                            <div key={sp.id} className="flex items-center gap-2 text-xs">
                              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                                {sp.platform === "INSTAGRAM" ? "IG" : "TK"} @{sp.handle}
                              </a>
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="inline-block size-3.5 rounded-full bg-[#D6E889] text-[9px] text-center leading-[14px] font-bold text-[#2A3B0F]">✓</span>
                                  <span className="text-foreground font-medium">{verified?.toLocaleString("es-CO")}</span>
                                  {hasMismatch && (
                                    <span className="text-[#FF4B2C]" title={`Reportó ${selfReported?.toLocaleString("es-CO")}`}>
                                      (reportó {selfReported?.toLocaleString("es-CO")})
                                    </span>
                                  )}
                                  {sp.verifiedEngagement != null && (
                                    <span className="text-muted-foreground">· {sp.verifiedEngagement}% eng</span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  {selfReported ? `${selfReported.toLocaleString("es-CO")} (sin verificar)` : "sin datos"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        <VerifyButton creatorId={cc.creator.id} />
                      </div>
                      {cc.creator.bio && (
                        <p className="text-xs text-muted-foreground mt-2 max-w-md">
                          {cc.creator.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={approveCreator}>
                      <input type="hidden" name="ccId" value={cc.id} />
                      <input type="hidden" name="campaignId" value={campaignId} />
                      <Button type="submit" size="sm">Aprobar</Button>
                    </form>
                    <form action={rejectCreator}>
                      <input type="hidden" name="ccId" value={cc.id} />
                      <input type="hidden" name="campaignId" value={campaignId} />
                      <Button type="submit" variant="outline" size="sm">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido pendiente de revisión */}
      {pendingReview.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Videos pendientes de tu revisión ({pendingReview.length})
          </h2>
          <div className="space-y-3">
            {pendingReview.map((piece) => (
              <div
                key={piece.id}
                className="rounded-xl border border-[#F4D79D]/50 bg-[#F4D79D]/10 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{piece.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      por {piece.creatorName}
                      <span className="mx-1">·</span>
                      <Badge variant="outline" className="text-[10px]">{piece.type}</Badge>
                      <span className="mx-1">·</span>
                      <Badge variant="outline" className="text-[10px]">
                        {piece.platform === "INSTAGRAM" ? "IG" : "TK"}
                      </Badge>
                    </p>
                    {piece.caption && (
                      <p className="text-sm text-foreground mt-2">{piece.caption}</p>
                    )}
                    {piece.script && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        &quot;{piece.script}&quot;
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <form action={approveContent}>
                    <input type="hidden" name="pieceId" value={piece.id} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <Button type="submit">Aprobar video</Button>
                  </form>
                  <form action={requestChanges} className="flex items-end gap-2">
                    <input type="hidden" name="pieceId" value={piece.id} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input
                      name="feedback"
                      placeholder="¿Qué hay que cambiar?"
                      className="h-9 flex-1 min-w-[200px] rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                    />
                    <Button type="submit" variant="outline">
                      Pedir cambios
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creadores aprobados */}
      {approved.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Creadores activos ({approved.length})
          </h2>
          <div className="space-y-3">
            {approved.map((cc) => (
              <div
                key={cc.id}
                className="rounded-xl border border-border bg-card px-5 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {cc.creator.fullName}
                    </span>
                    <TierBadge tier={tiers.get(cc.creator.id) ?? "BRONZE"} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{cc.contentPieces.length} pieza{cc.contentPieces.length !== 1 ? "s" : ""}</span>
                    <Badge variant="outline">
                      {cc.contentPieces.filter((p) => p.status === "PUBLISHED").length} publicada{cc.contentPieces.filter((p) => p.status === "PUBLISHED").length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* Rating: si está COMPLETED y todavía no tiene rating, ofrecer form */}
                {campaign.status === "COMPLETED" && cc.clientRating == null && (
                  <form
                    action={rateCreator}
                    className="mt-3 pt-3 border-t border-border"
                  >
                    <input type="hidden" name="ccId" value={cc.id} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <p className="text-xs text-muted-foreground mb-2">
                      ¿Cómo fue trabajar con {cc.creator.fullName.split(" ")[0]}?
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label
                            key={n}
                            className="cursor-pointer"
                            title={`${n} estrella${n !== 1 ? "s" : ""}`}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={n}
                              required
                              className="peer sr-only"
                            />
                            <span className="text-xl grayscale peer-checked:grayscale-0 hover:grayscale-0 transition-all">
                              ⭐
                            </span>
                          </label>
                        ))}
                      </div>
                      <input
                        name="feedback"
                        placeholder="Feedback opcional..."
                        className="flex-1 min-w-[180px] h-9 rounded-lg border border-input/60 bg-secondary px-3 text-xs outline-none focus:border-accent"
                      />
                      <Button type="submit" size="sm">Calificar</Button>
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        name="isPublic"
                        defaultChecked
                        className="cursor-pointer"
                      />
                      Hacer pública esta reseña en el perfil del creador
                    </label>
                  </form>
                )}

                {/* Rating ya dejado: mostrar */}
                {cc.clientRating != null && (
                  <div className="mt-3 pt-3 border-t border-border flex items-start gap-2">
                    <span className="text-sm">
                      {"⭐".repeat(cc.clientRating)}
                      {"☆".repeat(5 - cc.clientRating)}
                    </span>
                    {cc.clientFeedback && (
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{cc.clientFeedback}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {declined.length > 0 && (
        <details className="mb-8">
          <summary className="text-sm text-muted-foreground cursor-pointer">
            Creadores rechazados ({declined.length})
          </summary>
          <div className="mt-2 space-y-1">
            {declined.map((cc) => (
              <p key={cc.id} className="text-sm text-muted-foreground pl-4">
                {cc.creator.fullName}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
