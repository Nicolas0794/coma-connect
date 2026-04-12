import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { notifyClientVideoReady, notifyTeamPublicationConfirmed } from "@/lib/notifications";

const contentStatusLabels: Record<string, string> = {
  IDEA: "Pendiente",
  SCRIPT: "En producción",
  INTERNAL_REVIEW: "En revisión interna",
  CLIENT_REVIEW: "En revisión del cliente",
  APPROVED: "¡Aprobado! Publicá ya",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

const contentStatusColors: Record<string, string> = {
  IDEA: "bg-secondary text-muted-foreground",
  SCRIPT: "bg-[#B0E4EA]/30 text-teal-700",
  INTERNAL_REVIEW: "bg-[#F4D79D]/30 text-amber-700",
  CLIENT_REVIEW: "bg-[#F4D79D]/30 text-amber-700",
  APPROVED: "bg-[#D6E889]/30 text-lime-700 border-[#D6E889]/50",
  SCHEDULED: "bg-[#B0E4EA]/30 text-teal-700",
  PUBLISHED: "bg-primary/10 text-primary",
  ARCHIVED: "bg-secondary text-muted-foreground",
};

async function applyToCampaign(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.role !== "CREATOR") return;

  const campaignId = formData.get("campaignId") as string;
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) return;

  const exists = await prisma.campaignCreator.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId: creator.id } },
  });
  if (exists) return;

  await prisma.campaignCreator.create({
    data: {
      campaignId,
      creatorId: creator.id,
      status: "INVITED",
    },
  });

  redirect("/mi-espacio");
}

async function submitVideo(formData: FormData) {
  "use server";
  const pieceId = formData.get("pieceId") as string;
  const videoUrl = (formData.get("videoUrl") as string)?.trim();

  if (!videoUrl) return;

  const piece = await prisma.contentPiece.update({
    where: { id: pieceId },
    data: { script: videoUrl, status: "CLIENT_REVIEW" },
    include: {
      campaignCreator: {
        include: {
          creator: { select: { fullName: true } },
          campaign: {
            include: {
              client: {
                include: {
                  members: { include: { user: { select: { email: true, name: true } } }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });

  const clientMember = piece.campaignCreator.campaign.client.members[0];
  if (clientMember?.user.email) {
    await notifyClientVideoReady(
      clientMember.user.email,
      clientMember.user.name ?? "Cliente",
      piece.campaignCreator.campaign.name,
      piece.campaignCreator.creator.fullName,
      piece.title,
    );
  }

  redirect("/mi-espacio");
}

async function confirmPublished(formData: FormData) {
  "use server";
  const pieceId = formData.get("pieceId") as string;
  const publishedUrl = (formData.get("publishedUrl") as string)?.trim();

  if (!publishedUrl) return;

  const piece = await prisma.contentPiece.update({
    where: { id: pieceId },
    data: { publishedUrl, actualPublishDate: new Date(), status: "PUBLISHED" },
    include: {
      campaignCreator: {
        include: {
          creator: { select: { fullName: true } },
          campaign: { select: { name: true } },
        },
      },
    },
  });

  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "TEAM"] } },
    select: { email: true },
    take: 5,
  });

  for (const admin of adminUsers) {
    await notifyTeamPublicationConfirmed(
      admin.email,
      piece.campaignCreator.creator.fullName,
      piece.campaignCreator.campaign.name,
      piece.title,
      publishedUrl,
    );
  }

  redirect("/mi-espacio");
}

export default async function CreatorSpacePage() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl text-foreground">CoMa Creator Space</h1>
        <p className="text-muted-foreground mt-2">
          Tu cuenta todavía no está vinculada a un perfil de creador. Contactá al equipo de CoMa.
        </p>
      </div>
    );
  }

  // Campañas donde ya participa
  const myCampaigns = await prisma.campaignCreator.findMany({
    where: {
      creatorId: creator.id,
      status: { in: ["ACCEPTED", "ACTIVE", "ONBOARDING"] },
    },
    include: {
      campaign: {
        select: {
          id: true, name: true, briefOptimized: true, briefOriginal: true,
          startDate: true, endDate: true, objective: true,
          client: { select: { name: true } },
        },
      },
      contentPieces: {
        orderBy: { createdAt: "desc" },
        include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  // Campañas donde se postuló (pendiente aprobación)
  const pendingApplications = await prisma.campaignCreator.findMany({
    where: { creatorId: creator.id, status: "INVITED" },
    include: {
      campaign: { select: { id: true, name: true, client: { select: { name: true } } } },
    },
  });

  // Campañas disponibles (activas, donde NO se postuló todavía)
  const appliedCampaignIds = [
    ...myCampaigns.map((mc) => mc.campaignId),
    ...pendingApplications.map((pa) => pa.campaignId),
  ];
  const declinedIds = (await prisma.campaignCreator.findMany({
    where: { creatorId: creator.id, status: "DECLINED" },
    select: { campaignId: true },
  })).map((d) => d.campaignId);

  const availableCampaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ["DRAFT", "ACTIVE"] },
      id: { notIn: [...appliedCampaignIds, ...declinedIds] },
    },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Agrupar por cliente
  const campaignsByClient: Record<string, typeof availableCampaigns> = {};
  for (const c of availableCampaigns) {
    const clientName = c.client.name;
    if (!campaignsByClient[clientName]) campaignsByClient[clientName] = [];
    campaignsByClient[clientName].push(c);
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl text-foreground">
          Hola, {creator.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          CoMa Creator Space
        </p>
      </div>

      {/* Campañas disponibles para postularse */}
      {Object.keys(campaignsByClient).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Campañas disponibles
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Postulate a las campañas que te interesen. El cliente revisará tu perfil.
          </p>
          {Object.entries(campaignsByClient).map(([clientName, campaigns]) => (
            <div key={clientName} className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {clientName}
              </h3>
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <h4 className="font-medium text-sm text-foreground">
                        {campaign.name}
                      </h4>
                      {campaign.objective && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                          {campaign.objective}
                        </p>
                      )}
                      {campaign.startDate && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(campaign.startDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                          {campaign.endDate && ` — ${new Date(campaign.endDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`}
                        </p>
                      )}
                    </div>
                    <form action={applyToCampaign}>
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <Button type="submit" size="sm">
                        Postularme
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Postulaciones pendientes */}
      {pendingApplications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Postulaciones pendientes
          </h2>
          <div className="space-y-2">
            {pendingApplications.map((pa) => (
              <div
                key={pa.id}
                className="flex items-center justify-between rounded-xl border border-[#F4D79D]/50 bg-[#F4D79D]/10 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{pa.campaign.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{pa.campaign.client.name}</span>
                </div>
                <Badge className="bg-[#F4D79D]/30 text-amber-700">Esperando aprobación</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis campañas activas */}
      {myCampaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg text-foreground mb-4">
            Mis campañas activas
          </h2>
          <div className="space-y-6">
            {myCampaigns.map((cc) => (
              <div key={cc.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-primary/5 border-b border-border px-5 py-4">
                  <h3 className="font-medium text-foreground">{cc.campaign.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cc.campaign.client.name}
                    {cc.campaign.startDate && (
                      <span>
                        {" · "}
                        {new Date(cc.campaign.startDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                        {cc.campaign.endDate && ` — ${new Date(cc.campaign.endDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`}
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-5 space-y-5">
                  {(cc.campaign.briefOptimized || cc.campaign.briefOriginal) && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">Brief</h3>
                      <div className="rounded-lg bg-secondary p-4 text-sm text-foreground whitespace-pre-wrap">
                        {cc.campaign.briefOptimized ?? cc.campaign.briefOriginal}
                      </div>
                    </div>
                  )}

                  {cc.campaign.objective && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">Objetivo</h3>
                      <p className="text-sm text-muted-foreground">{cc.campaign.objective}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Tus piezas ({cc.contentPieces.length})
                    </h3>

                    {cc.contentPieces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        El equipo de CoMa todavía no asignó piezas de contenido.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {cc.contentPieces.map((piece) => {
                          const lastFeedback = piece.revisions[0]?.feedback;
                          const needsVideo = piece.status === "IDEA" || piece.status === "SCRIPT";
                          const needsPublish = piece.status === "APPROVED";

                          return (
                            <div
                              key={piece.id}
                              className={`rounded-lg border p-4 ${
                                needsPublish
                                  ? "border-[#D6E889]/50 bg-[#D6E889]/10"
                                  : needsVideo && piece.status === "SCRIPT" && lastFeedback
                                    ? "border-[#F4D79D]/50 bg-[#F4D79D]/10"
                                    : "border-border"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{piece.title}</span>
                                <Badge variant="outline" className="text-[10px]">{piece.type}</Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {piece.platform === "INSTAGRAM" ? "IG" : "TK"}
                                </Badge>
                              </div>
                              <Badge className={`mt-1.5 ${contentStatusColors[piece.status]}`}>
                                {contentStatusLabels[piece.status]}
                              </Badge>

                              {piece.description && (
                                <p className="text-xs text-muted-foreground mt-2">{piece.description}</p>
                              )}

                              {lastFeedback && piece.status === "SCRIPT" && (
                                <div className="mt-3 rounded-lg bg-[#F4D79D]/20 border border-[#F4D79D]/40 px-3 py-2">
                                  <p className="text-xs font-medium text-amber-700">Feedback del cliente:</p>
                                  <p className="text-sm text-foreground mt-0.5">{lastFeedback}</p>
                                </div>
                              )}

                              {needsVideo && (
                                <form action={submitVideo} className="flex items-end gap-2 mt-3">
                                  <input type="hidden" name="pieceId" value={piece.id} />
                                  <div className="flex-1">
                                    <Input name="videoUrl" placeholder="Pegá el link del video (Drive, Dropbox...)" required className="text-xs h-8" />
                                  </div>
                                  <Button type="submit" size="sm">Enviar video</Button>
                                </form>
                              )}

                              {needsPublish && (
                                <form action={confirmPublished} className="flex items-end gap-2 mt-3">
                                  <input type="hidden" name="pieceId" value={piece.id} />
                                  <div className="flex-1">
                                    <Input name="publishedUrl" placeholder="Pegá el link de la publicación en IG/TK" required className="text-xs h-8" />
                                  </div>
                                  <Button type="submit" size="sm">Confirmar publicación</Button>
                                </form>
                              )}

                              {piece.publishedUrl && (
                                <a href={piece.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">
                                  Ver publicación ↗
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myCampaigns.length === 0 && pendingApplications.length === 0 && Object.keys(campaignsByClient).length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay campañas disponibles por el momento. ¡Pronto habrá nuevas oportunidades!</p>
        </div>
      )}
    </div>
  );
}
