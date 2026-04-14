import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getNextCampaignCode } from "@/lib/campaign-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function createCampaign(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string)?.trim();
  const clientId = formData.get("clientId") as string;

  if (!name || !clientId) {
    redirect("/campanas/nueva?error=required");
  }

  const code = await getNextCampaignCode();

  const campaign = await prisma.campaign.create({
    data: {
      name,
      code,
      clientId,
      objective: (formData.get("objective") as string)?.trim() || null,
      budget: (formData.get("budget") as string)?.trim()
        ? parseFloat(formData.get("budget") as string)
        : null,
      startDate: (formData.get("startDate") as string)
        ? new Date(formData.get("startDate") as string)
        : null,
      endDate: (formData.get("endDate") as string)
        ? new Date(formData.get("endDate") as string)
        : null,
      briefOriginal: (formData.get("briefOriginal") as string)?.trim() || null,
    },
  });

  redirect(`/campanas/${campaign.id}`);
}

export default async function NuevaCampanaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const errorMessages: Record<string, string> = {
    required: "Nombre, cliente y código son obligatorios.",
    code: "Ya existe una campaña con ese código.",
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href="/campanas"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Campañas
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Nueva campaña</h1>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Necesitás al menos un cliente para crear una campaña.
          </p>
          <Link href="/clientes/nuevo">
            <Button>Crear cliente primero</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <form action={createCampaign} className="space-y-5">
            {params.error && errorMessages[params.error] && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {errorMessages[params.error]}
              </div>
            )}

            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Información básica</h3>
              <div className="space-y-1.5 mb-4">
                <Label className="text-xs text-muted-foreground">Nombre *</Label>
                <Input name="name" placeholder="Ej: Campaña Verano 2026" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cliente *</Label>
                  <select
                    name="clientId"
                    required
                    className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Presupuesto (COP)</Label>
                  <Input name="budget" type="number" placeholder="Ej: 5000000" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Fechas</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Inicio</Label>
                  <Input name="startDate" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fin</Label>
                  <Input name="endDate" type="date" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Objetivo de la campaña</Label>
              <textarea
                name="objective"
                placeholder="¿Qué se quiere lograr con esta campaña?"
                className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Brief original del cliente</Label>
              <textarea
                name="briefOriginal"
                placeholder="Pegá el brief tal como lo envió el cliente..."
                className="h-28 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Crear campaña</Button>
              <Link href="/campanas">
                <Button type="button" variant="ghost">Cancelar</Button>
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
