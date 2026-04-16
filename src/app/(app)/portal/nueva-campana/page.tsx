import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateBrief, type BriefAttachment } from "@/lib/generate-brief";
import { getNextCampaignCode } from "@/lib/campaign-code";
import { notifyCreatorsNewCampaignMatch } from "@/lib/notify";
import { suggestCreatorsForCampaign } from "@/lib/suggest-creators";
import { uploadCampaignAttachmentToDrive } from "@/lib/google-drive-campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NicheMultiSelect } from "@/components/niche-multi-select";
import { CampaignAttachmentsInput } from "@/components/campaign-attachments-input";
import Link from "next/link";
import type { SocialPlatform } from "@/generated/prisma/enums";

const MAX_ATTACHMENT_MB = 25;
const MAX_ATTACHMENTS = 8;

async function createCampaign(formData: FormData) {
  "use server";

  const session = await auth();
  if (session?.user?.role !== "CLIENT") return;

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true },
  });
  if (!membership) return;

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const productType = (formData.get("productType") as string)?.trim();

  if (!name || !description) {
    redirect("/portal/nueva-campana?error=required");
  }

  const code = await getNextCampaignCode();

  // Recoger adjuntos del form (hasta MAX_ATTACHMENTS, cada uno ≤ MAX_ATTACHMENT_MB).
  const rawFiles = formData.getAll("attachments").filter((v): v is File => v instanceof File && v.size > 0);
  const attachmentFiles = rawFiles
    .filter((f) => f.size <= MAX_ATTACHMENT_MB * 1024 * 1024)
    .slice(0, MAX_ATTACHMENTS);

  // Leer buffers y armar contexto para el brief (PDFs e imágenes van al modelo).
  const briefAttachments: BriefAttachment[] = await Promise.all(
    attachmentFiles.map(async (f) => ({
      fileName: f.name,
      mimeType: f.type || "application/octet-stream",
      data: Buffer.from(await f.arrayBuffer()),
    })),
  );

  const briefInput = {
    name,
    description,
    productType: productType || "",
    targetAudience: (formData.get("targetAudience") as string)?.trim() || "",
    objectives: (formData.get("objectives") as string)?.trim() || "",
    keyMessages: (formData.get("keyMessages") as string)?.trim() || "",
    callToAction: (formData.get("callToAction") as string)?.trim() || "",
    startDate: (formData.get("startDate") as string) || "",
    endDate: (formData.get("endDate") as string) || "",
    deliveryDate: (formData.get("deliveryDate") as string) || "",
    paymentAmount: (formData.get("paymentAmount") as string)?.trim() || "200.000",
    platform: (formData.get("platform") as string) || "Instagram y TikTok",
    additionalNotes: (formData.get("additionalNotes") as string)?.trim() || "",
  };

  const briefOptimized = await generateBrief(briefInput, briefAttachments);

  const requiredNiches = ((formData.get("requiredNiches") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const requiredCity = (formData.get("requiredCity") as string)?.trim() || null;
  const minFollowersRaw = (formData.get("minFollowers") as string)?.trim();
  const minFollowers = minFollowersRaw
    ? parseInt(minFollowersRaw.replace(/\D/g, ""), 10) || null
    : null;
  const platformValue = (formData.get("platform") as string) || "Instagram y TikTok";
  const requiredPlatform: SocialPlatform | null =
    platformValue === "Instagram"
      ? "INSTAGRAM"
      : platformValue === "TikTok"
      ? "TIKTOK"
      : null;
  const requiredAudienceDesc = briefInput.targetAudience || null;

  const campaign = await prisma.campaign.create({
    data: {
      name,
      code,
      clientId: membership.clientId,
      objective: briefInput.objectives || null,
      briefOriginal: description,
      briefOptimized,
      budget: briefInput.paymentAmount
        ? parseFloat(briefInput.paymentAmount.replace(/\./g, "").replace(",", ".")) || null
        : null,
      startDate: briefInput.startDate ? new Date(briefInput.startDate) : null,
      endDate: briefInput.endDate ? new Date(briefInput.endDate) : null,
      requiredNiches,
      requiredCity,
      minFollowers,
      requiredPlatform,
      requiredAudienceDesc,
    },
  });

  // Subir adjuntos a Drive y registrar en DB (best-effort).
  for (let i = 0; i < attachmentFiles.length; i++) {
    const f = attachmentFiles[i];
    const buffer = briefAttachments[i]?.data ?? Buffer.from(await f.arrayBuffer());
    try {
      const { viewUrl } = await uploadCampaignAttachmentToDrive(
        buffer,
        f.name,
        f.type || "application/octet-stream",
        campaign.name,
        campaign.code,
      );
      await prisma.campaignAttachment.create({
        data: {
          campaignId: campaign.id,
          fileUrl: viewUrl,
          fileName: f.name,
          mimeType: f.type || null,
          sizeBytes: f.size,
        },
      });
    } catch (err) {
      console.error(`[createCampaign] upload attachment "${f.name}" failed:`, err);
    }
  }

  // Sugerir creadores (comunidad + pool general), persistir y notificar a los matched.
  // Best-effort: si algo falla, igual redirigimos — el cliente puede re-correr luego.
  try {
    const suggestions = await suggestCreatorsForCampaign(campaign.id);
    if (suggestions.length > 0) {
      await prisma.campaignSuggestion.createMany({
        data: suggestions.map((s) => ({
          campaignId: campaign.id,
          creatorId: s.creatorId,
          fromCommunity: s.fromCommunity,
          score: s.score,
          reason: s.reason,
        })),
        skipDuplicates: true,
      });
      await notifyCreatorsNewCampaignMatch(campaign.id, suggestions);
    }
  } catch (err) {
    console.error("[createCampaign] suggestion/notify failed:", err);
  }

  redirect(`/portal/${campaign.id}`);
}

export default async function NuevaCampanaClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "CLIENT") redirect("/");

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href="/portal"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Orange Space
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Nueva campaña</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Completá la información y el equipo de CoMa se encarga del resto.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form action={createCampaign} encType="multipart/form-data" className="space-y-6">
          {params.error === "required" && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              El nombre y la descripción son obligatorios.
            </div>
          )}

          {/* Básico */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Sobre la campaña
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Nombre de la campaña *
                </Label>
                <Input
                  name="name"
                  placeholder="Ej: Lanzamiento Línea Verano 2026"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Descripción de la campaña *
                </Label>
                <textarea
                  name="description"
                  required
                  placeholder="Contanos de qué se trata la campaña, qué querés lograr, contexto del producto o servicio..."
                  className="h-28 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Tipo de producto o servicio
                  </Label>
                  <Input
                    name="productType"
                    placeholder="Ej: Créditos hipotecarios, Restaurante, Ropa"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Plataforma
                  </Label>
                  <select
                    name="platform"
                    className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
                  >
                    <option value="Instagram y TikTok">Instagram y TikTok</option>
                    <option value="Instagram">Solo Instagram</option>
                    <option value="TikTok">Solo TikTok</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Perfil de creador buscado */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              Perfil de creador que buscás
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Esto nos ayuda a sugerirte creadoras de tu comunidad y del catálogo
              que encajan con tu campaña.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Nichos
                </Label>
                <NicheMultiSelect name="requiredNiches" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Ciudad preferida
                  </Label>
                  <Input
                    name="requiredCity"
                    placeholder="Ej: Bogotá, Medellín, Cali"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Followers mínimos (opcional)
                  </Label>
                  <Input
                    name="minFollowers"
                    type="number"
                    min="0"
                    placeholder="Ej: 5000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audiencia y mensajes */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Público y mensajes
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  ¿A quién va dirigida la campaña?
                </Label>
                <textarea
                  name="targetAudience"
                  placeholder="Describí el público: edad, ubicación, intereses, estilo de vida..."
                  className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Objetivos de la campaña
                </Label>
                <textarea
                  name="objectives"
                  placeholder="¿Qué querés lograr? Ej: Dar a conocer el producto, generar tráfico al local, aumentar ventas..."
                  className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Mensajes clave que quieras comunicar
                </Label>
                <textarea
                  name="keyMessages"
                  placeholder="¿Qué tiene que quedar claro en el video? Beneficios, diferenciadores, promociones..."
                  className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Call to Action (link o acción)
                </Label>
                <Input
                  name="callToAction"
                  placeholder="Ej: www.comfandi.com.co o 'Visitá tu sede más cercana'"
                />
              </div>
            </div>
          </div>

          {/* Fechas y presupuesto */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Fechas y presupuesto
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Inicio de producción
                </Label>
                <Input name="startDate" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Fecha máxima de entrega
                </Label>
                <Input name="deliveryDate" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Fecha máxima de publicación
                </Label>
                <Input name="endDate" type="date" />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Pago por creadora (COP)
              </Label>
              <Input
                name="paymentAmount"
                placeholder="Ej: 200000"
                defaultValue="200000"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Notas adicionales
            </Label>
            <textarea
              name="additionalNotes"
              placeholder="Cualquier detalle extra que quieras incluir..."
              className="h-16 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>

          {/* Adjuntos */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              Material de referencia
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Subí brand guidelines, decks, mood boards, fichas de producto, referencias —
              cualquier archivo que ayude a entender mejor la campaña. La IA los usa para
              armar el brief.
            </p>
            <CampaignAttachmentsInput />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="w-full sm:w-auto">
              Crear campaña y generar brief
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Al crear la campaña, CoMa genera automáticamente el brief para las creadoras.
            El equipo lo revisará antes de enviarlo.
          </p>
        </form>
      </div>
    </div>
  );
}
