import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  IN_REVIEW: "En revisión",
  PUBLISHING: "Publicando",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-secondary text-muted-foreground",
  ACTIVE: "bg-[#D6E889]/30 text-lime-700",
  IN_REVIEW: "bg-[#F4D79D]/30 text-amber-700",
  PUBLISHING: "bg-[#B0E4EA]/30 text-teal-700",
  COMPLETED: "bg-primary/10 text-primary",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const ccStatusLabels: Record<string, string> = {
  INVITED: "Invitado",
  ACCEPTED: "Aceptado",
  DECLINED: "Declinado",
  ONBOARDING: "Onboarding",
  ACTIVE: "Activo",
  COMPLETED: "Completado",
  REMOVED: "Removido",
};

async function addCreator(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  const creatorId = formData.get("creatorId") as string;
  const fee = (formData.get("fee") as string)?.trim();

  if (!creatorId) redirect(`/campanas/${campaignId}?error=noCreator`);

  const exists = await prisma.campaignCreator.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  });
  if (exists) redirect(`/campanas/${campaignId}?error=duplicate`);

  await prisma.campaignCreator.create({
    data: {
      campaignId,
      creatorId,
      fee: fee ? parseFloat(fee) : null,
    },
  });

  redirect(`/campanas/${campaignId}`);
}

async function removeCreator(formData: FormData) {
  "use server";
  const ccId = formData.get("ccId") as string;
  const campaignId = formData.get("campaignId") as string;
  await prisma.campaignCreator.delete({ where: { id: ccId } });
  redirect(`/campanas/${campaignId}`);
}

async function updateStatus(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  const status = formData.get("status") as string;
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: status as "DRAFT" | "ACTIVE" | "IN_REVIEW" | "PUBLISHING" | "COMPLETED" | "CANCELLED" },
  });
  redirect(`/campanas/${campaignId}`);
}

export default async function CampanaDetallePage({
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
      client: { select: { id: true, name: true } },
      campaignCreators: {
        include: {
          creator: {
            select: { id: true, fullName: true, city: true, niches: true },
          },
          _count: { select: { contentPieces: true } },
        },
        orderBy: { invitedAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();

  const assignedIds = campaign.campaignCreators.map((cc) => cc.creatorId);
  const availableCreators = await prisma.creator.findMany({
    where: { id: { notIn: assignedIds } },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, city: true },
  });

  const statuses = ["DRAFT", "ACTIVE", "IN_REVIEW", "PUBLISHING", "COMPLETED", "CANCELLED"];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/campanas"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Campañas
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl text-foreground">{campaign.name}</h1>
            <Badge className={statusColors[campaign.status]}>
              {statusLabels[campaign.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link href={`/clientes/${campaign.client.id}`} className="hover:text-primary transition-colors">
              {campaign.client.name}
            </Link>
            <span className="mx-2">·</span>
            {campaign.code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/campanas/${id}/chat`}>
            <Button variant="outline" size="sm">Chat</Button>
          </Link>
          <Link href={`/campanas/${id}/contenido`}>
            <Button variant="outline" size="sm">Contenido</Button>
          </Link>
          <Link href={`/campanas/${id}/videos`}>
            <Button variant="outline" size="sm">Videos</Button>
          </Link>
          <Link href={`/campanas/${id}/pagos`}>
            <Button variant="outline" size="sm">Pagos</Button>
          </Link>
          <Link href={`/campanas/${id}/metricas`}>
            <Button variant="outline" size="sm">Métricas</Button>
          </Link>
          <Link href={`/campanas/${id}/evaluacion`}>
            <Button variant="outline" size="sm">Evaluación</Button>
          </Link>
          <form action={updateStatus} className="flex items-center gap-2">
            <input type="hidden" name="campaignId" value={id} />
            <select
              name="status"
              defaultValue={campaign.status}
              className="h-8 rounded-lg border border-input/60 bg-secondary px-2 text-xs outline-none focus:border-accent"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="xs">Cambiar</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {campaign.budget && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Presupuesto</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              ${Number(campaign.budget).toLocaleString("es-CO")}
            </p>
          </div>
        )}
        {campaign.startDate && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Inicio</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {new Date(campaign.startDate).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        )}
        {campaign.endDate && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Fin</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {new Date(campaign.endDate).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        )}
      </div>

      {campaign.objective && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="text-sm text-muted-foreground mb-2">Objetivo</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{campaign.objective}</p>
        </div>
      )}

      {campaign.briefOriginal && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="text-sm text-muted-foreground mb-2">Brief del cliente</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{campaign.briefOriginal}</p>
        </div>
      )}

      {/* Creadores */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-muted-foreground">
            Creadores asignados ({campaign.campaignCreators.length})
          </h3>
        </div>

        {campaign.campaignCreators.length > 0 && (
          <div className="space-y-2 mb-4">
            {campaign.campaignCreators.map((cc) => (
              <div
                key={cc.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/creadores/${cc.creator.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {cc.creator.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {cc.creator.city ?? ""}
                      {cc.fee ? ` · $${Number(cc.fee).toLocaleString("es-CO")}` : ""}
                      {` · ${cc._count.contentPieces} pieza${cc._count.contentPieces !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ccStatusLabels[cc.status]}</Badge>
                  <form action={removeCreator}>
                    <input type="hidden" name="ccId" value={cc.id} />
                    <input type="hidden" name="campaignId" value={id} />
                    <Button type="submit" variant="ghost" size="xs" className="text-destructive">
                      ×
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {sp.error === "duplicate" && (
          <p className="text-xs text-destructive mb-3">Este creador ya está asignado.</p>
        )}

        {availableCreators.length > 0 && (
          <form action={addCreator} className="flex items-end gap-2">
            <input type="hidden" name="campaignId" value={id} />
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Agregar creador</Label>
              <select
                name="creatorId"
                required
                className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">Seleccionar...</option>
                {availableCreators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.city ? `(${c.city})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fee (COP)</Label>
              <Input name="fee" type="number" placeholder="500000" />
            </div>
            <Button type="submit" size="default">Agregar</Button>
          </form>
        )}

        {availableCreators.length === 0 && campaign.campaignCreators.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <Link href="/creadores/nuevo" className="text-primary hover:underline">
              Cargá creadores
            </Link>{" "}
            para poder asignarlos a esta campaña.
          </p>
        )}
      </div>
    </div>
  );
}
