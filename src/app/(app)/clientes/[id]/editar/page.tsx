import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function updateClient(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!name) redirect(`/clientes/${id}/editar?error=name`);

  await prisma.client.update({
    where: { id },
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

  redirect(`/clientes/${id}`);
}

export default async function EditarClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href={`/clientes/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {client.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Editar cliente</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form action={updateClient} className="space-y-4">
          <input type="hidden" name="id" value={id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Nombre *
              </Label>
              <Input
                name="name"
                defaultValue={client.name}
                required
              />
              {sp.error === "name" && (
                <p className="text-xs text-destructive">El nombre es obligatorio.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Razón social
              </Label>
              <Input
                name="legalName"
                defaultValue={client.legalName ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Industria
              </Label>
              <Input
                name="industry"
                defaultValue={client.industry ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Sitio web
              </Label>
              <Input
                name="website"
                defaultValue={client.website ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Email de contacto
              </Label>
              <Input
                name="email"
                type="email"
                defaultValue={client.email ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Teléfono
              </Label>
              <Input
                name="phone"
                defaultValue={client.phone ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Notas internas
            </Label>
            <textarea
              name="notes"
              defaultValue={client.notes ?? ""}
              className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Guardar cambios</Button>
            <Link href={`/clientes/${id}`}>
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
