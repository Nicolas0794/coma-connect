import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCreatorReport } from "@/lib/creator-report";
import { CreatorReportView } from "@/components/creator-report-view";

async function deleteCreator(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.creatorSocialProfile.deleteMany({ where: { creatorId: id } });
  await prisma.creator.delete({ where: { id } });
  redirect("/creadores");
}

export default async function CreadorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      socialProfiles: true,
      campaignCreators: {
        include: {
          campaign: {
            select: { id: true, name: true, code: true, status: true, client: { select: { name: true } } },
          },
        },
        orderBy: { invitedAt: "desc" },
      },
    },
  });

  if (!creator) notFound();

  const report = await getCreatorReport(id);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/creadores"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Creadores
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
            {creator.fullName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl text-foreground">{creator.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {creator.city ?? "Sin ciudad"}
              {creator.country ? `, ${creator.country}` : ""}
            </p>
            {creator.niches.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {creator.niches.map((n) => (
                  <Badge key={n} variant="secondary">{n}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/creadores/${id}/editar`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          <form action={deleteCreator}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive" size="sm">
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Contacto</h3>
          <dl className="space-y-2.5">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-sm">{creator.email ?? <span className="text-muted-foreground">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Teléfono</dt>
              <dd className="text-sm">{creator.phone ?? <span className="text-muted-foreground">—</span>}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Redes sociales</h3>
          {creator.socialProfiles.length > 0 ? (
            <div className="space-y-3">
              {creator.socialProfiles.map((sp) => (
                <div key={sp.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {sp.platform === "INSTAGRAM" ? "Instagram" : "TikTok"}
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      @{sp.handle}
                    </p>
                  </div>
                  {sp.followers && (
                    <span className="text-sm font-bold text-foreground">
                      {sp.followers.toLocaleString("es-CO")}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        seguidores
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin redes cargadas.</p>
          )}
        </div>
      </div>

      {creator.bio && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <h3 className="text-sm text-muted-foreground mb-2">Bio</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{creator.bio}</p>
        </div>
      )}

      {creator.notes && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <h3 className="text-sm text-muted-foreground mb-2">Notas internas</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{creator.notes}</p>
        </div>
      )}

      {report && (
        <div className="mb-8">
          <CreatorReportView report={report} />
        </div>
      )}
    </div>
  );
}
