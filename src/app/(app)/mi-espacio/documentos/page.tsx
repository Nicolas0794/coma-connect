import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

async function uploadDocs(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.role !== "CREATOR") return;

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) return;

  const documentId = (formData.get("documentId") as string)?.trim() || creator.documentId;
  const rutUrl = (formData.get("rutUrl") as string)?.trim() || creator.rutUrl;
  const certBancariaUrl = (formData.get("certBancariaUrl") as string)?.trim() || creator.certBancariaUrl;

  const docsCompleted = !!documentId && !!rutUrl && !!certBancariaUrl;

  await prisma.creator.update({
    where: { id: creator.id },
    data: { documentId, rutUrl, certBancariaUrl, docsCompleted },
  });

  redirect("/mi-espacio/documentos");
}

async function uploadCuentaCobro(formData: FormData) {
  "use server";
  const paymentId = formData.get("paymentId") as string;
  const fileUrl = (formData.get("fileUrl") as string)?.trim();

  if (!paymentId || !fileUrl) return;

  await prisma.paymentDocument.upsert({
    where: { paymentId_type: { paymentId, type: "CUENTA_DE_COBRO" } },
    update: { fileUrl },
    create: { paymentId, type: "CUENTA_DE_COBRO", fileUrl },
  });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (payment && payment.status === "PENDING") {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "DOCS_SUBMITTED" },
    });
  }

  redirect("/mi-espacio/documentos");
}

export default async function DocumentosCreadoraPage() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      campaignCreators: {
        where: { status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } },
        include: {
          campaign: { select: { name: true, code: true } },
          payment: {
            include: {
              documents: { where: { type: "CUENTA_DE_COBRO" } },
            },
          },
          contentPieces: {
            where: { status: "PUBLISHED" },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!creator) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-muted-foreground">Tu cuenta no está vinculada a un perfil de creador.</p>
      </div>
    );
  }

  const campaignsWithPayment = creator.campaignCreators.filter(
    (cc) => cc.payment && cc.contentPieces.length > 0
  );

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <a href="/mi-espacio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← CoMa Creator Space
        </a>
        <h1 className="text-2xl text-foreground mt-2">Mis documentos</h1>
      </div>

      {/* Documentos personales — una sola vez */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">Documentos personales</h2>
          {creator.docsCompleted ? (
            <Badge className="bg-[#D6E889]/30 text-lime-700">Completos</Badge>
          ) : (
            <Badge className="bg-[#F4D79D]/30 text-amber-700">Pendientes</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Estos documentos se suben una sola vez y quedan guardados en tu perfil.
        </p>

        <form action={uploadDocs} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Número de documento (cédula)</Label>
            <Input
              name="documentId"
              defaultValue={creator.documentId ?? ""}
              placeholder="Ej: 1234567890"
            />
            {creator.documentId && (
              <p className="text-[10px] text-lime-600">✓ Guardado</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">RUT (link del archivo)</Label>
            <Input
              name="rutUrl"
              defaultValue={creator.rutUrl ?? ""}
              placeholder="Link de Google Drive con tu RUT"
            />
            {creator.rutUrl ? (
              <p className="text-[10px] text-lime-600">✓ <a href={creator.rutUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver documento</a></p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Subilo a Drive y pegá el link acá</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Certificación bancaria (link del archivo)</Label>
            <Input
              name="certBancariaUrl"
              defaultValue={creator.certBancariaUrl ?? ""}
              placeholder="Link de Google Drive con tu certificación bancaria"
            />
            {creator.certBancariaUrl ? (
              <p className="text-[10px] text-lime-600">✓ <a href={creator.certBancariaUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver documento</a></p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Subilo a Drive y pegá el link acá</p>
            )}
          </div>

          <Button type="submit">Guardar documentos</Button>
        </form>
      </div>

      {/* Cuentas de cobro — por campaña */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground mb-2">Cuentas de cobro</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Subí la cuenta de cobro por cada campaña donde ya publicaste el contenido.
          <a href="/modelo-cuenta-cobro.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
            Descargar modelo ↗
          </a>
        </p>

        {campaignsWithPayment.length > 0 ? (
          <div className="space-y-4">
            {campaignsWithPayment.map((cc) => {
              const cuentaCobro = cc.payment?.documents[0];
              return (
                <div key={cc.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">{cc.campaign.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{cc.campaign.code}</span>
                    </div>
                    {cuentaCobro ? (
                      <Badge className="bg-[#D6E889]/30 text-lime-700">Entregada</Badge>
                    ) : (
                      <Badge className="bg-[#F4D79D]/30 text-amber-700">Pendiente</Badge>
                    )}
                  </div>

                  {cuentaCobro ? (
                    <a
                      href={cuentaCobro.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Ver cuenta de cobro ↗
                    </a>
                  ) : (
                    <form action={uploadCuentaCobro} className="flex items-end gap-2 mt-2">
                      <input type="hidden" name="paymentId" value={cc.payment!.id} />
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Link de la cuenta de cobro</Label>
                        <Input
                          name="fileUrl"
                          placeholder="Link de Google Drive..."
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                      <Button type="submit" size="sm">Subir</Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Las cuentas de cobro aparecen cuando publicás contenido y el equipo crea el pago.
          </p>
        )}
      </div>
    </div>
  );
}
