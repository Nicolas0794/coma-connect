import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  markInquiryViewed,
  sendInquiryMessage,
  sendQuote,
  declineInquiry,
  acceptAndConvertToCampaign,
} from "../actions";

type Params = Promise<{ id: string }>;
type SP = Promise<{ error?: string }>;

export default async function InquiryDetail({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true, fullName: true },
  });
  if (!creator) redirect("/mi-espacio");

  const inq = await prisma.inquiry.findFirst({
    where: { id, creatorId: creator.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
      quotes: { orderBy: { createdAt: "desc" } },
      client: { select: { name: true } },
      campaign: { select: { id: true, code: true, name: true } },
    },
  });
  if (!inq) notFound();

  // Auto-marcar como VIEWED al abrir
  if (inq.status === "PENDING") {
    await markInquiryViewed(id);
  }

  const latestQuote = inq.quotes[0];
  const canQuote = inq.status === "PENDING" || inq.status === "VIEWED";
  const canAccept = inq.status !== "CONVERTED_TO_CAMPAIGN" && inq.status !== "REJECTED";
  const converted = inq.status === "CONVERTED_TO_CAMPAIGN";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <Link href="/mi-espacio/inquiries" className="text-sm text-muted-foreground hover:text-foreground">
          ← Solicitudes
        </Link>
      </div>

      {/* Brief */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">{inq.contactName}</h1>
            <p className="text-sm text-muted-foreground">
              {inq.contactEmail}
              {inq.contactPhone && ` · ${inq.contactPhone}`}
              {inq.client && ` · via ${inq.client.name}`}
            </p>
          </div>
          <Badge variant="outline">{inq.status.replace("_", " ")}</Badge>
        </div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Brief</h3>
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{inq.brief}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {inq.budgetCOP && (
            <span>
              <strong className="text-foreground">
                ${Number(inq.budgetCOP).toLocaleString("es-CO")} COP
              </strong>{" "}
              presupuesto
            </span>
          )}
          {inq.deadline && (
            <span>
              Deadline:{" "}
              <strong className="text-foreground">
                {new Date(inq.deadline).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Estado final */}
      {converted && inq.campaign && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-800">
            ✓ Esta solicitud se convirtió en la campaña{" "}
            <strong>{inq.campaign.code} — {inq.campaign.name}</strong>.
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            La gestión operativa sigue en tu sección de campañas.
          </p>
        </div>
      )}

      {error === "validation" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Cotización: precio y alcance son obligatorios.
        </div>
      )}

      {/* Cotización enviada */}
      {latestQuote && (
        <div className="rounded-xl border border-[#FF4B2C]/30 bg-[#FF4B2C]/5 p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Tu cotización
          </h3>
          <p className="text-lg font-semibold text-foreground">
            ${Number(latestQuote.priceCOP).toLocaleString("es-CO")} COP
          </p>
          <p className="text-sm text-foreground mt-2 whitespace-pre-line">{latestQuote.scope}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {latestQuote.deliveryDays && <span>{latestQuote.deliveryDays} días de entrega</span>}
            <span>
              Enviada:{" "}
              {new Date(latestQuote.createdAt).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          {latestQuote.terms && (
            <p className="mt-3 text-xs text-muted-foreground border-t border-[#FF4B2C]/20 pt-3">
              {latestQuote.terms}
            </p>
          )}
        </div>
      )}

      {/* Form cotización */}
      {canQuote && !latestQuote && !converted && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-1">Enviar cotización</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Proponé precio y alcance. La marca recibirá tu respuesta por email.
          </p>
          <form action={sendQuote} className="space-y-3">
            <input type="hidden" name="inquiryId" value={inq.id} />
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Precio COP</Label>
                <Input name="priceCOP" type="number" min={0} required placeholder="500000" />
              </div>
              <div>
                <Label className="text-xs">Entrega (días)</Label>
                <Input name="deliveryDays" type="number" min={1} placeholder="5" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Alcance / entregables</Label>
              <textarea
                name="scope"
                rows={4}
                required
                placeholder="Ej: 1 Reel de 30s, 2 stories, uso orgánico 30 días, 1 ronda de revisiones."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Términos (opcional)</Label>
              <textarea
                name="terms"
                rows={2}
                placeholder="Exclusividad, uso de imagen, etc."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90">
              Enviar cotización
            </Button>
          </form>
        </div>
      )}

      {/* Mensajes */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Mensajes</h2>
        {inq.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay mensajes en este hilo.</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {inq.messages.map((m) => {
              const isSelf = m.senderId === session.user!.id;
              return (
                <li
                  key={m.id}
                  className={`rounded-lg p-3 ${isSelf ? "bg-muted ml-8" : "bg-card border border-border mr-8"}`}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {isSelf ? "Vos" : m.sender.name ?? "Marca"} ·{" "}
                    {new Date(m.createdAt).toLocaleString("es-CO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <p className="text-sm whitespace-pre-line">{m.body}</p>
                </li>
              );
            })}
          </ul>
        )}
        {!converted && (
          <form action={sendInquiryMessage} className="flex items-end gap-2">
            <input type="hidden" name="inquiryId" value={inq.id} />
            <div className="flex-1">
              <Input name="body" placeholder="Escribir mensaje…" required />
            </div>
            <Button type="submit" size="sm">Enviar</Button>
          </form>
        )}
      </div>

      {/* Acciones finales */}
      {!converted && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-1">Acciones</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Al aceptar, esta solicitud se convierte en una campaña real en tu panel operativo.
          </p>
          <div className="flex gap-2 flex-wrap">
            {canAccept && (
              <form action={acceptAndConvertToCampaign}>
                <input type="hidden" name="inquiryId" value={inq.id} />
                <Button type="submit" className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90">
                  Aceptar y convertir en campaña
                </Button>
              </form>
            )}
            {inq.status !== "REJECTED" && (
              <form action={declineInquiry}>
                <input type="hidden" name="inquiryId" value={inq.id} />
                <Button type="submit" variant="outline">
                  Rechazar
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
