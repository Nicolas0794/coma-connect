import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelRegistration } from "./actions";

const statusLabels: Record<string, string> = {
  REGISTERED: "Registrada",
  WAITLIST: "Lista de espera",
  CANCELLED: "Cancelada",
  ATTENDED: "Asistió",
  NO_SHOW: "No asistió",
};

const statusStyles: Record<string, string> = {
  REGISTERED: "bg-primary/10 text-primary",
  WAITLIST: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-muted text-muted-foreground",
  ATTENDED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-destructive/10 text-destructive",
};

export default async function MisEventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id! },
    orderBy: { registeredAt: "desc" },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          venue: true,
          startAt: true,
          status: true,
          coverUrl: true,
          type: true,
        },
      },
    },
  });

  const speakerships = await prisma.eventSpeaker.findMany({
    where: { userId: session.user.id! },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          name: true,
          startAt: true,
          city: true,
          venue: true,
          status: true,
        },
      },
    },
  });

  const now = new Date();
  const upcoming = registrations.filter(
    (r) => r.status !== "CANCELLED" && r.event.startAt >= now,
  );
  const past = registrations.filter(
    (r) => r.status === "ATTENDED" || r.event.startAt < now,
  );

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl text-foreground">Mis eventos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          CoMa Nation — encuentros, workshops y paneles donde participás.
        </p>
      </div>

      {speakerships.length > 0 && (
        <section>
          <h2 className="font-medium text-foreground mb-3">⭐ Como speaker</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {speakerships.map((sp) => (
              <Link
                key={sp.id}
                href={`/nation/${sp.event.slug}`}
                className="rounded-xl border border-primary/30 bg-gradient-to-br from-[#FF4B2C]/5 to-background p-4 hover:shadow-md transition-all"
              >
                <p className="text-[11px] text-primary font-medium uppercase mb-1">
                  {sp.role === "HOST"
                    ? "Host"
                    : sp.role === "PANELIST"
                    ? "Panelista"
                    : sp.role === "SPECIAL_GUEST"
                    ? "Invitado especial"
                    : "Speaker"}
                </p>
                <h3 className="text-sm font-medium text-foreground">{sp.event.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {sp.event.startAt.toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {sp.event.city ? ` · ${sp.event.city}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-foreground">📅 Próximos</h2>
          <Link href="/nation" className="text-xs text-primary hover:underline">
            Ver calendario completo →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No tenés eventos próximos.
            </p>
            <Link href="/nation">
              <Button>Explorar eventos</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => {
              const cancel = cancelRegistration.bind(null, r.id);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/nation/${r.event.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {r.event.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.event.startAt.toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {r.event.city ? ` · ${r.event.city}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${statusStyles[r.status]}`}>
                      {statusLabels[r.status]}
                    </Badge>
                    <form action={cancel}>
                      <Button type="submit" size="xs" variant="ghost">
                        Cancelar
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-medium text-foreground mb-3">📚 Pasados</h2>
          <div className="space-y-2">
            {past.map((r) => (
              <Link
                key={r.id}
                href={`/nation/${r.event.slug}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{r.event.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.event.startAt.toLocaleDateString("es-CO")}
                  </p>
                </div>
                <Badge className={`text-[10px] ${statusStyles[r.status]}`}>
                  {statusLabels[r.status]}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
