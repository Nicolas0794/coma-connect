import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function markAllRead(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  redirect("/notificaciones");
}

async function markRead(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  redirect("/notificaciones");
}

export default async function NotificacionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, channel: "IN_APP" },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : "Estás al día"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <input type="hidden" name="userId" value={session.user.id} />
            <Button type="submit" variant="ghost" size="sm">
              Marcar todo como leído
            </Button>
          </form>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 transition-all ${
                n.read
                  ? "border-border bg-card"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <Badge className="bg-primary/10 text-primary text-[10px]">
                        Nueva
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(n.sentAt).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {n.link && (
                    <Link href={n.link}>
                      <Button variant="outline" size="xs">Ver</Button>
                    </Link>
                  )}
                  {!n.read && (
                    <form action={markRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <Button type="submit" variant="ghost" size="xs">
                        ✓
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No tenés notificaciones todavía.</p>
        </div>
      )}
    </div>
  );
}
