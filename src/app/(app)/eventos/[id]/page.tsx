import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateEvent, addSpeaker, removeSpeaker, markAttended } from "../actions";

function toLocalInput(d: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const registrationLabels: Record<string, string> = {
  REGISTERED: "Registrado",
  WAITLIST: "Lista de espera",
  CANCELLED: "Cancelado",
  ATTENDED: "Asistió",
  NO_SHOW: "No asistió",
};

const speakerRoleLabels: Record<string, string> = {
  SPEAKER: "Speaker",
  PANELIST: "Panelista",
  HOST: "Host",
  SPECIAL_GUEST: "Invitado especial",
};

export default async function EventoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      speakers: { include: { user: { select: { id: true, name: true, email: true } } } },
      registrations: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { registeredAt: "desc" },
      },
      tags: true,
    },
  });
  if (!event) notFound();

  const users = await prisma.user.findMany({
    where: { role: { in: ["CREATOR", "ADMIN", "TEAM"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const updateAction = updateEvent.bind(null, event.id);
  const addSpeakerAction = addSpeaker.bind(null, event.id);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <Link href="/eventos" className="text-xs text-muted-foreground hover:text-foreground">
          ← Eventos
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl text-foreground">{event.name}</h1>
          <Badge className="text-[10px]">
            {event.status === "DRAFT"
              ? "Borrador"
              : event.status === "PUBLISHED"
              ? "Publicado"
              : event.status === "CANCELLED"
              ? "Cancelado"
              : "Completado"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>/{event.slug}</span>
          <span>·</span>
          <Link
            href={`/nation/${event.slug}`}
            target="_blank"
            className="text-primary hover:underline"
          >
            Ver página pública
          </Link>
        </div>
      </div>

      {/* Datos */}
      <form action={updateAction} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground">Datos del evento</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={event.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={event.description ?? ""}
            className="w-full rounded-md border border-border bg-background p-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              defaultValue={event.type}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="MEETUP">Meetup</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="PANEL">Panel</option>
              <option value="PARTY">Fiesta</option>
              <option value="CONFERENCE">Conferencia</option>
              <option value="WEBINAR">Webinar</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              defaultValue={event.status}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="COMPLETED">Completado</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad</Label>
            <Input id="capacity" name="capacity" type="number" defaultValue={event.capacity ?? ""} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" defaultValue={event.city ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">Lugar</Label>
            <Input id="venue" name="venue" defaultValue={event.venue ?? ""} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startAt">Inicio</Label>
            <Input
              id="startAt"
              name="startAt"
              type="datetime-local"
              defaultValue={toLocalInput(event.startAt)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">Fin</Label>
            <Input
              id="endAt"
              name="endAt"
              type="datetime-local"
              defaultValue={toLocalInput(event.endAt)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </form>

      {/* Speakers */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground mb-3">Speakers</h2>

        {event.speakers.length > 0 && (
          <ul className="space-y-2 mb-4">
            {event.speakers.map((sp) => {
              const remove = removeSpeaker.bind(null, event.id, sp.id);
              return (
                <li
                  key={sp.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground">{sp.user.name ?? sp.user.email}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {speakerRoleLabels[sp.role]}
                    </Badge>
                  </div>
                  <form action={remove}>
                    <Button type="submit" size="xs" variant="ghost">
                      Quitar
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form action={addSpeakerAction} className="grid grid-cols-[1fr_140px_auto] gap-2">
          <select
            name="userId"
            required
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Elegir usuario…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
          <select
            name="role"
            defaultValue="SPEAKER"
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="SPEAKER">Speaker</option>
            <option value="PANELIST">Panelista</option>
            <option value="HOST">Host</option>
            <option value="SPECIAL_GUEST">Invitado especial</option>
          </select>
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      </div>

      {/* Registrados */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground mb-3">
          Registrados ({event.registrations.length})
        </h2>
        {event.registrations.length === 0 ? (
          <p className="text-xs text-muted-foreground">Todavía nadie se registró.</p>
        ) : (
          <ul className="space-y-2">
            {event.registrations.map((reg) => {
              const mark = markAttended.bind(null, event.id, reg.id);
              return (
                <li
                  key={reg.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-foreground">{reg.user.name ?? reg.user.email}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {reg.registeredAt.toLocaleDateString("es-CO")} · {registrationLabels[reg.status]}
                    </p>
                  </div>
                  {reg.status !== "ATTENDED" && (
                    <form action={mark}>
                      <Button type="submit" size="xs" variant="secondary">
                        Marcar asistió
                      </Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
