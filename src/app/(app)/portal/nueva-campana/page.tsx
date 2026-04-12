import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateBrief } from "@/lib/generate-brief";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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

  const code = `CBL-${Date.now().toString(36).toUpperCase().slice(-4)}`;

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

  const briefOptimized = await generateBrief(briefInput);

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
    },
  });

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
        <form action={createCampaign} className="space-y-6">
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
