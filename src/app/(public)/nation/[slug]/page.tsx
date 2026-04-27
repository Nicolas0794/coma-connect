import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { registerForEvent, cancelRegistration } from "@/app/(app)/mi-espacio/eventos/actions";

const typeLabels: Record<string, string> = {
  MEETUP: "Meetup",
  WORKSHOP: "Workshop",
  PANEL: "Panel",
  PARTY: "Fiesta",
  CONFERENCE: "Conferencia",
  WEBINAR: "Webinar",
};

const speakerRoleLabels: Record<string, string> = {
  SPEAKER: "Speaker",
  PANELIST: "Panelista",
  HOST: "Host",
  SPECIAL_GUEST: "Invitado especial",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { name: true, description: true, coverUrl: true, status: true },
  });
  if (!event || event.status !== "PUBLISHED") {
    return { title: "Evento no encontrado" };
  }
  return {
    title: `${event.name} — CoMa Nation`,
    description: event.description ?? undefined,
    openGraph: event.coverUrl ? { images: [event.coverUrl] } : undefined,
  };
}

export default async function EventPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      speakers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              creatorProfile: { select: { slug: true, artistName: true } },
            },
          },
        },
      },
      tags: true,
      _count: { select: { registrations: true } },
    },
  });
  if (!event || event.status === "DRAFT") notFound();

  const existingReg = session?.user?.id
    ? await prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
      })
    : null;

  const isFull = event.capacity !== null && event._count.registrations >= event.capacity;
  const isPast = event.startAt < new Date();

  const register = registerForEvent.bind(null, event.id);
  const cancel = existingReg ? cancelRegistration.bind(null, existingReg.id) : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/nation"
        className="text-xs text-muted-foreground hover:text-foreground inline-block mb-6"
      >
        ← Todos los eventos
      </Link>

      <div className="grid md:grid-cols-[1fr_300px] gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{typeLabels[event.type]}</Badge>
            {event.status === "CANCELLED" && (
              <Badge className="bg-destructive/10 text-destructive">Cancelado</Badge>
            )}
            {event.status === "COMPLETED" && (
              <Badge className="bg-muted text-muted-foreground">Completado</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">{event.name}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            📅{" "}
            {event.startAt.toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {event.venue && ` · 📍 ${event.venue}`}
            {event.city && `, ${event.city}`}
          </p>
          {event.description && (
            <p className="text-foreground whitespace-pre-wrap">{event.description}</p>
          )}

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {event.tags.map((t) => (
                <Badge key={t.id} variant="outline" className="text-[10px]">
                  #{t.tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 h-fit">
          {event.coverUrl && (
            <div
              className="aspect-video bg-muted bg-cover bg-center rounded-lg mb-4"
              style={{ backgroundImage: `url(${event.coverUrl})` }}
            />
          )}
          <dl className="space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Registradas</dt>
              <dd className="text-foreground">
                {event._count.registrations}
                {event.capacity ? ` / ${event.capacity}` : ""}
              </dd>
            </div>
            {isFull && (
              <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                Quedás en lista de espera
              </div>
            )}
          </dl>

          {isPast || event.status === "CANCELLED" ? (
            <Button className="w-full" disabled>
              {event.status === "CANCELLED" ? "Evento cancelado" : "Evento pasado"}
            </Button>
          ) : existingReg && existingReg.status !== "CANCELLED" ? (
            <form action={cancel!}>
              <Button type="submit" variant="outline" className="w-full">
                Cancelar mi registro
              </Button>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                Estado:{" "}
                {existingReg.status === "WAITLIST"
                  ? "Lista de espera"
                  : existingReg.status === "ATTENDED"
                  ? "Asististe"
                  : "Registrada"}
              </p>
            </form>
          ) : session?.user ? (
            <form action={register}>
              <Button type="submit" className="w-full">
                {isFull ? "Unirme a la lista de espera" : "Registrarme"}
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button className="w-full">Iniciá sesión para registrarte</Button>
            </Link>
          )}
        </aside>
      </div>

      {event.speakers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Speakers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {event.speakers.map((sp) => {
              const displayName =
                sp.user.creatorProfile?.artistName ?? sp.user.name ?? "Speaker";
              const href = sp.user.creatorProfile?.slug
                ? `/c/${sp.user.creatorProfile.slug}`
                : null;
              const Card = href ? Link : "div";
              const cardProps = href ? { href } : {};
              return (
                <Card
                  key={sp.id}
                  {...(cardProps as { href: string })}
                  className={`rounded-xl border border-border bg-card p-4 ${
                    href ? "hover:shadow-md transition-all cursor-pointer" : ""
                  }`}
                >
                  <Badge variant="secondary" className="text-[10px] mb-2">
                    {speakerRoleLabels[sp.role]}
                  </Badge>
                  <p className="font-medium text-foreground">{displayName}</p>
                  {href && (
                    <p className="text-xs text-primary mt-1">Ver perfil →</p>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
