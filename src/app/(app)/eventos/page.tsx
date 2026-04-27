import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<string, string> = {
  MEETUP: "Meetup",
  WORKSHOP: "Workshop",
  PANEL: "Panel",
  PARTY: "Fiesta",
  CONFERENCE: "Conferencia",
  WEBINAR: "Webinar",
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-secondary text-muted-foreground",
  PUBLISHED: "bg-primary/10 text-primary",
  CANCELLED: "bg-destructive/10 text-destructive",
  COMPLETED: "bg-muted text-muted-foreground",
};
const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

export default async function EventosAdminPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }

  const events = await prisma.event.findMany({
    orderBy: { startAt: "desc" },
    include: {
      _count: { select: { registrations: true, speakers: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Nation · Eventos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {events.length === 0
              ? "Todavía no hay eventos creados."
              : `${events.length} evento${events.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/eventos/nuevo">
          <Button>Nuevo evento</Button>
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventos/${event.id}`}
              className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {event.name}
                </h3>
                <Badge className={`text-[10px] ${statusStyles[event.status]}`}>
                  {statusLabels[event.status]}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {typeLabels[event.type]}
                {event.city ? ` · ${event.city}` : ""}
              </div>

              <div className="text-xs text-foreground mb-3">
                {event.startAt.toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {event.venue ? ` · ${event.venue}` : ""}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                <span>{event._count.speakers} speakers</span>
                <span>·</span>
                <span>{event._count.registrations} registrados</span>
                {event.capacity && (
                  <>
                    <span>·</span>
                    <span>cap. {event.capacity}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Creá tu primer evento para arrancar con Nation.
          </p>
          <Link href="/eventos/nuevo">
            <Button>Crear primer evento</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
