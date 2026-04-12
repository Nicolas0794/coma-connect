import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function createClient(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string)?.trim();
  if (!name) redirect("/clientes/nuevo?error=name");

  const client = await prisma.client.create({
    data: {
      name,
      legalName: (formData.get("legalName") as string)?.trim() || null,
      industry: (formData.get("industry") as string)?.trim() || null,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      website: (formData.get("website") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    },
  });

  redirect(`/clientes/${client.id}`);
}

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Clientes
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Nuevo cliente</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form action={createClient} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Nombre *
              </Label>
              <Input name="name" placeholder="Ej: Comfandi" required />
              {params.error === "name" && (
                <p className="text-xs text-destructive">El nombre es obligatorio.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Razón social
              </Label>
              <Input name="legalName" placeholder="Nombre legal (opcional)" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Industria
              </Label>
              <Input name="industry" placeholder="Ej: Alimentos, Salud, Retail" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Sitio web
              </Label>
              <Input name="website" placeholder="https://..." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Email de contacto
              </Label>
              <Input name="email" type="email" placeholder="contacto@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Teléfono
              </Label>
              <Input name="phone" placeholder="+57 300 000 0000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Notas internas
            </Label>
            <textarea
              name="notes"
              placeholder="Cualquier detalle relevante sobre el cliente..."
              className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Crear cliente</Button>
            <Link href="/clientes">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
