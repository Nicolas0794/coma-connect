import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statusLabels: Record<string, string> = {
  IDEA: "Idea",
  SCRIPT: "Guión",
  INTERNAL_REVIEW: "Revisión interna",
  CLIENT_REVIEW: "Revisión cliente",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

const statusColors: Record<string, string> = {
  IDEA: "bg-secondary text-muted-foreground",
  SCRIPT: "bg-[#B0E4EA]/30 text-teal-700",
  INTERNAL_REVIEW: "bg-[#F4D79D]/30 text-amber-700",
  CLIENT_REVIEW: "bg-[#F4C0D1]/30 text-pink-700",
  APPROVED: "bg-[#D6E889]/30 text-lime-700",
  SCHEDULED: "bg-[#B0E4EA]/30 text-teal-700",
  PUBLISHED: "bg-primary/10 text-primary",
  ARCHIVED: "bg-secondary text-muted-foreground",
};

const statusFlow = ["IDEA", "SCRIPT", "INTERNAL_REVIEW", "CLIENT_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

async function createPiece(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  const campaignCreatorId = formData.get("campaignCreatorId") as string;
  const title = (formData.get("title") as string)?.trim();
  const type = formData.get("type") as string;
  const platform = formData.get("platform") as string;

  if (!title || !campaignCreatorId || !type || !platform) {
    redirect(`/campanas/${campaignId}/contenido?error=required`);
  }

  await prisma.contentPiece.create({
    data: {
      campaignCreatorId,
      title,
      type: type as "REEL" | "POST" | "STORY" | "CAROUSEL" | "VIDEO",
      platform: platform as "INSTAGRAM" | "TIKTOK",
      description: (formData.get("description") as string)?.trim() || null,
    },
  });

  redirect(`/campanas/${campaignId}/contenido`);
}

async function updatePieceStatus(formData: FormData) {
  "use server";
  const pieceId = formData.get("pieceId") as string;
  const campaignId = formData.get("campaignId") as string;
  const status = formData.get("status") as string;
  const publishedUrl = (formData.get("publishedUrl") as string)?.trim() || null;

  const data: Record<string, unknown> = {
    status: status as "IDEA" | "SCRIPT" | "INTERNAL_REVIEW" | "CLIENT_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED",
  };

  if (status === "PUBLISHED") {
    data.actualPublishDate = new Date();
    if (publishedUrl) data.publishedUrl = publishedUrl;
  }

  await prisma.contentPiece.update({
    where: { id: pieceId },
    data,
  });

  redirect(`/campanas/${campaignId}/contenido`);
}

export default async function ContenidoCampanaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      campaignCreators: {
        include: {
          creator: { select: { id: true, fullName: true } },
          contentPieces: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!campaign) notFound();

  const allPieces = campaign.campaignCreators.flatMap((cc) =>
    cc.contentPieces.map((p) => ({
      ...p,
      creatorName: cc.creator.fullName,
      creatorId: cc.creator.id,
    }))
  );

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link
          href={`/campanas/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {campaign.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Contenido</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allPieces.length} pieza{allPieces.length !== 1 ? "s" : ""} de contenido
        </p>
      </div>

      {/* Status summary */}
      {allPieces.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {statusFlow.map((s) => {
            const count = allPieces.filter((p) => p.status === s).length;
            if (count === 0) return null;
            return (
              <Badge key={s} className={statusColors[s]}>
                {statusLabels[s]} ({count})
              </Badge>
            );
          })}
        </div>
      )}

      {/* Pieces by creator */}
      {campaign.campaignCreators.map((cc) => (
        <div key={cc.id} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <h3 className="text-sm font-medium text-foreground">
              {cc.creator.fullName}
            </h3>
            <span className="text-xs text-muted-foreground">
              {cc.contentPieces.length} pieza{cc.contentPieces.length !== 1 ? "s" : ""}
            </span>
          </div>

          {cc.contentPieces.length > 0 && (
            <div className="space-y-2 mb-4">
              {cc.contentPieces.map((piece) => (
                <div
                  key={piece.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {piece.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {piece.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {piece.platform === "INSTAGRAM" ? "IG" : "TK"}
                        </Badge>
                      </div>
                      {piece.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {piece.description}
                        </p>
                      )}
                      {piece.publishedUrl && (
                        <a
                          href={piece.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          Ver publicación ↗
                        </a>
                      )}
                    </div>
                    <form action={updatePieceStatus} className="flex items-center gap-2 shrink-0">
                      <input type="hidden" name="pieceId" value={piece.id} />
                      <input type="hidden" name="campaignId" value={id} />
                      {piece.status !== "PUBLISHED" && (
                        <Input
                          name="publishedUrl"
                          placeholder="URL publicación"
                          className="w-36 h-7 text-xs"
                        />
                      )}
                      <select
                        name="status"
                        defaultValue={piece.status}
                        className="h-7 rounded-lg border border-input/60 bg-secondary px-2 text-xs outline-none focus:border-accent"
                      >
                        {statusFlow.map((s) => (
                          <option key={s} value={s}>{statusLabels[s]}</option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline" size="xs">
                        ✓
                      </Button>
                    </form>
                  </div>
                  <div className="mt-2">
                    <Badge className={statusColors[piece.status]}>
                      {statusLabels[piece.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add new piece */}
      {campaign.campaignCreators.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Nueva pieza de contenido</h3>

          {sp.error === "required" && (
            <p className="text-xs text-destructive mb-3">Completá todos los campos obligatorios.</p>
          )}

          <form action={createPiece} className="space-y-3">
            <input type="hidden" name="campaignId" value={id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Título *</Label>
                <Input name="title" placeholder="Ej: Reel lanzamiento producto" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Creador *</Label>
                <select
                  name="campaignCreatorId"
                  required
                  className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                >
                  <option value="">Seleccionar...</option>
                  {campaign.campaignCreators.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.creator.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo *</Label>
                <select
                  name="type"
                  required
                  className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="REEL">Reel</option>
                  <option value="POST">Post</option>
                  <option value="STORY">Story</option>
                  <option value="CAROUSEL">Carousel</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Plataforma *</Label>
                <select
                  name="platform"
                  required
                  className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Descripción</Label>
                <Input name="description" placeholder="Breve descripción..." />
              </div>
            </div>

            <Button type="submit">Crear pieza</Button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            <Link href={`/campanas/${id}`} className="text-primary hover:underline">
              Asigná creadores a la campaña
            </Link>{" "}
            antes de crear contenido.
          </p>
        </div>
      )}
    </div>
  );
}
