import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PdfUploadForm } from "@/components/pdf-upload-form";

async function saveDocumentId(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.role !== "CREATOR") return;

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) return;

  const documentId = (formData.get("documentId") as string)?.trim();
  if (!documentId) return;

  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      documentId,
      docsCompleted: !!creator.rutUrl && !!creator.certBancariaUrl,
    },
  });

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

  const docsComplete = !!creator.documentId && !!creator.rutUrl && !!creator.certBancariaUrl;

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

      {/* Documentos personales */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">Documentos personales</h2>
          {docsComplete ? (
            <Badge className="bg-[#D6E889]/30 text-lime-700">Completos</Badge>
          ) : (
            <Badge className="bg-[#F4D79D]/30 text-amber-700">Pendientes</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Estos documentos se suben una sola vez y quedan guardados en tu perfil.
        </p>

        <div className="space-y-3">
          {/* Cédula */}
          {creator.documentId ? (
            <div className="flex items-center justify-between rounded-lg bg-[#D6E889]/10 border border-[#D6E889]/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-lime-600 text-sm">✓</span>
                <span className="text-xs text-foreground">Cédula: {creator.documentId}</span>
              </div>
            </div>
          ) : (
            <form action={saveDocumentId} className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-foreground mb-2">Número de cédula</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input name="documentId" placeholder="Ej: 1234567890" required className="h-8 text-xs" />
                </div>
                <Button type="submit" size="sm">Guardar</Button>
              </div>
            </form>
          )}

          {/* RUT */}
          <PdfUploadForm
            docType="RUT"
            label="RUT"
            currentUrl={creator.rutUrl}
          />

          {/* Certificación bancaria */}
          <PdfUploadForm
            docType="CERTIFICACION_BANCARIA"
            label="Certificación bancaria"
            currentUrl={creator.certBancariaUrl}
          />
        </div>
      </div>

      {/* Cuentas de cobro por campaña */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground mb-2">Cuentas de cobro</h2>
        <p className="text-xs text-muted-foreground mb-1">
          Subí la cuenta de cobro en PDF por cada campaña donde ya publicaste.
        </p>
        <a
          href="/modelo-cuenta-cobro.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-block mb-4"
        >
          Descargar modelo de cuenta de cobro ↗
        </a>

        {campaignsWithPayment.length > 0 ? (
          <div className="space-y-3">
            {campaignsWithPayment.map((cc) => {
              const cuentaCobro = cc.payment?.documents[0];
              return (
                <div key={cc.id}>
                  <div className="flex items-center justify-between mb-1.5">
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
                  <PdfUploadForm
                    docType="CUENTA_DE_COBRO"
                    label={`Cuenta de cobro — ${cc.campaign.name}`}
                    paymentId={cc.payment!.id}
                    currentUrl={cuentaCobro?.fileUrl}
                  />
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
