import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

async function deleteClient(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.client.delete({ where: { id } });
  redirect("/clientes");
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, code: true, status: true },
      },
      _count: { select: { campaigns: true, members: true } },
    },
  });

  if (!client) notFound();

  const fields = [
    { label: "Razón social", value: client.legalName },
    { label: "Industria", value: client.industry },
    { label: "Email", value: client.email },
    { label: "Teléfono", value: client.phone },
    { label: "Sitio web", value: client.website },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Clientes
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">{client.name}</h1>
          {client.industry && (
            <Badge variant="secondary" className="mt-2">
              {client.industry}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/clientes/${id}/editar`}>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </Link>
          <form action={deleteClient}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
            >
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Información</h3>
          <dl className="space-y-2.5">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="text-sm text-foreground mt-0.5">
                  {f.value ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Resumen</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-2xl font-bold text-primary">
                {client._count.campaigns}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Campañas
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-2xl font-bold text-foreground">
                {client._count.members}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Miembros
              </div>
            </div>
          </div>
        </div>
      </div>

      {client.notes && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <h3 className="text-sm text-muted-foreground mb-2">Notas internas</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {client.notes}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-muted-foreground">Campañas</h3>
        </div>
        {client.campaigns.length > 0 ? (
          <div className="space-y-2">
            {client.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {campaign.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {campaign.code}
                  </span>
                </div>
                <Badge variant="outline">{campaign.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este cliente todavía no tiene campañas.
          </p>
        )}
      </div>
    </div>
  );
}
