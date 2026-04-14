import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notifyCreatorSelected, notifyCreatorVideoApproved, notifyCreatorChangesRequested } from "@/lib/notifications";

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

async function approveCreator(formData: FormData) {
  "use server";
  const ccId = formData.get("ccId") as string;
  const campaignId = formData.get("campaignId") as string;
  const cc = await prisma.campaignCreator.update({
    where: { id: ccId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
    include: {
      creator: { select: { email: true, fullName: true, phone: true } },
      campaign: { select: { name: true, client: { select: { name: true } } } },
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

async function approveContent(formData: FormData) {
  "use server";
  const pieceId = formData.get("pieceId") as string;
  const campaignId = formData.get("campaignId") as string;
  const piece = await prisma.contentPiece.update({
    where: { id: pieceId },
    data: { status: "APPROVED" },
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
    },
  });

  if (!campaign) notFound();

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
          </div>
        </div>
        {campaign.objective && (
          <p className="text-sm text-muted-foreground mt-1">{campaign.objective}</p>
        )}
      </div>

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
                      <h3 className="font-medium text-foreground">
                        {cc.creator.fullName}
                      </h3>
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
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {cc.creator.socialProfiles.map((sp) => (
                          <span key={sp.id}>
                            {sp.platform === "INSTAGRAM" ? "IG" : "TK"}{" "}
                            <span className="font-medium text-foreground">@{sp.handle}</span>
                            {sp.followers && ` · ${sp.followers.toLocaleString("es-CO")}`}
                          </span>
                        ))}
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
          <div className="space-y-2">
            {approved.map((cc) => (
              <div
                key={cc.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {cc.creator.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{cc.contentPieces.length} pieza{cc.contentPieces.length !== 1 ? "s" : ""}</span>
                  <Badge variant="outline">
                    {cc.contentPieces.filter((p) => p.status === "PUBLISHED").length} publicada{cc.contentPieces.filter((p) => p.status === "PUBLISHED").length !== 1 ? "s" : ""}
                  </Badge>
                </div>
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
