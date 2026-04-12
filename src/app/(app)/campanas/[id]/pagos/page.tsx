import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const payStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  DOCS_SUBMITTED: "Docs entregados",
  APPROVED: "Aprobado",
  PAID: "Pagado",
  REJECTED: "Rechazado",
};

const payStatusColors: Record<string, string> = {
  PENDING: "bg-secondary text-muted-foreground",
  DOCS_SUBMITTED: "bg-[#F4D79D]/30 text-amber-700",
  APPROVED: "bg-[#D6E889]/30 text-lime-700",
  PAID: "bg-primary/10 text-primary",
  REJECTED: "bg-destructive/10 text-destructive",
};

const docTypeLabels: Record<string, string> = {
  CUENTA_DE_COBRO: "Cuenta de cobro",
  RUT: "RUT",
  CERTIFICACION_BANCARIA: "Certificación bancaria",
};

async function createPayment(formData: FormData) {
  "use server";
  const campaignId = formData.get("campaignId") as string;
  const campaignCreatorId = formData.get("campaignCreatorId") as string;
  const amount = parseFloat(formData.get("amount") as string);

  if (!campaignCreatorId || !amount) {
    redirect(`/campanas/${campaignId}/pagos?error=required`);
  }

  await prisma.payment.create({
    data: {
      campaignCreatorId,
      amount,
    },
  });

  redirect(`/campanas/${campaignId}/pagos`);
}

async function updatePaymentStatus(formData: FormData) {
  "use server";
  const paymentId = formData.get("paymentId") as string;
  const campaignId = formData.get("campaignId") as string;
  const status = formData.get("status") as string;

  const data: Record<string, unknown> = {
    status: status as "PENDING" | "DOCS_SUBMITTED" | "APPROVED" | "PAID" | "REJECTED",
  };

  if (status === "PAID") data.paidAt = new Date();

  await prisma.payment.update({
    where: { id: paymentId },
    data,
  });

  redirect(`/campanas/${campaignId}/pagos`);
}

async function addDocument(formData: FormData) {
  "use server";
  const paymentId = formData.get("paymentId") as string;
  const campaignId = formData.get("campaignId") as string;
  const type = formData.get("type") as string;
  const fileUrl = (formData.get("fileUrl") as string)?.trim();

  if (!type || !fileUrl) {
    redirect(`/campanas/${campaignId}/pagos?error=docRequired`);
  }

  await prisma.paymentDocument.create({
    data: {
      paymentId,
      type: type as "CUENTA_DE_COBRO" | "RUT" | "CERTIFICACION_BANCARIA",
      fileUrl,
      fileName: fileUrl.split("/").pop() ?? null,
    },
  });

  redirect(`/campanas/${campaignId}/pagos`);
}

export default async function PagosCampanaPage({
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
      campaignCreators: {
        include: {
          creator: { select: { id: true, fullName: true } },
          payment: {
            include: { documents: true },
          },
        },
      },
    },
  });

  if (!campaign) notFound();

  const creatorsWithoutPayment = campaign.campaignCreators.filter(
    (cc) => !cc.payment
  );

  const totalPaid = campaign.campaignCreators
    .filter((cc) => cc.payment?.status === "PAID")
    .reduce((sum, cc) => sum + Number(cc.payment!.amount), 0);

  const totalPending = campaign.campaignCreators
    .filter((cc) => cc.payment && cc.payment.status !== "PAID")
    .reduce((sum, cc) => sum + Number(cc.payment!.amount), 0);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href={`/campanas/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {campaign.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Pagos</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pagado</p>
          <p className="text-xl font-bold text-primary mt-0.5">
            ${totalPaid.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendiente</p>
          <p className="text-xl font-bold text-foreground mt-0.5">
            ${totalPending.toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      {/* Payments per creator */}
      {campaign.campaignCreators.map((cc) => {
        const payment = cc.payment;
        if (!payment) return null;

        const missingDocs = (["CUENTA_DE_COBRO", "RUT", "CERTIFICACION_BANCARIA"] as const).filter(
          (type) => !payment.documents.some((d) => d.type === type)
        );

        return (
          <div key={cc.id} className="rounded-xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {cc.creator.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <Link
                    href={`/creadores/${cc.creator.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {cc.creator.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    ${Number(payment.amount).toLocaleString("es-CO")} COP
                  </p>
                </div>
              </div>
              <form action={updatePaymentStatus} className="flex items-center gap-2">
                <input type="hidden" name="paymentId" value={payment.id} />
                <input type="hidden" name="campaignId" value={id} />
                <select
                  name="status"
                  defaultValue={payment.status}
                  className="h-7 rounded-lg border border-input/60 bg-secondary px-2 text-xs outline-none focus:border-accent"
                >
                  {Object.entries(payStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <Button type="submit" variant="outline" size="xs">✓</Button>
              </form>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge className={payStatusColors[payment.status]}>
                {payStatusLabels[payment.status]}
              </Badge>
              {payment.paidAt && (
                <span className="text-xs text-muted-foreground">
                  Pagado el {new Date(payment.paidAt).toLocaleDateString("es-CO")}
                </span>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-2 mb-3">
              <p className="text-xs text-muted-foreground font-medium">Documentos:</p>
              {payment.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {docTypeLabels[doc.type]}
                    </Badge>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {doc.fileName ?? "Ver documento"} ↗
                    </a>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString("es-CO")}
                  </span>
                </div>
              ))}
            </div>

            {/* Add missing documents */}
            {missingDocs.length > 0 && (
              <form action={addDocument} className="flex items-end gap-2">
                <input type="hidden" name="paymentId" value={payment.id} />
                <input type="hidden" name="campaignId" value={id} />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Documento</Label>
                  <select
                    name="type"
                    required
                    className="h-8 rounded-lg border border-input/60 bg-secondary px-2 text-xs outline-none focus:border-accent"
                  >
                    {missingDocs.map((t) => (
                      <option key={t} value={t}>{docTypeLabels[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">URL del archivo</Label>
                  <Input name="fileUrl" placeholder="Link de Google Drive, Dropbox..." className="h-8 text-xs" required />
                </div>
                <Button type="submit" variant="outline" size="sm">Agregar</Button>
              </form>
            )}
          </div>
        );
      })}

      {/* Create payment for creators without one */}
      {creatorsWithoutPayment.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Crear pago</h3>
          {sp.error === "required" && (
            <p className="text-xs text-destructive mb-3">Seleccioná creador e ingresá monto.</p>
          )}
          <form action={createPayment} className="flex items-end gap-2">
            <input type="hidden" name="campaignId" value={id} />
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Creador</Label>
              <select
                name="campaignCreatorId"
                required
                className="h-[38px] w-full rounded-lg border border-input/60 bg-secondary px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">Seleccionar...</option>
                {creatorsWithoutPayment.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.creator.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Monto (COP)</Label>
              <Input name="amount" type="number" placeholder="500000" required />
            </div>
            <Button type="submit">Crear pago</Button>
          </form>
        </div>
      )}

      {campaign.campaignCreators.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            <Link href={`/campanas/${id}`} className="text-primary hover:underline">
              Asigná creadores
            </Link>{" "}
            para poder gestionar pagos.
          </p>
        </div>
      )}
    </div>
  );
}
