import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function PortalCreadoresPage() {
  const session = await auth();
  if (session?.user?.role !== "CLIENT") redirect("/");

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true, client: { select: { name: true } } },
  });
  if (!membership) redirect("/portal");

  const community = await prisma.clientCreator.findMany({
    where: { clientId: membership.clientId },
    orderBy: { lastCollaborationAt: "desc" },
    include: {
      creator: {
        include: {
          socialProfiles: {
            select: {
              platform: true,
              handle: true,
              followers: true,
              verifiedFollowers: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <Link
          href="/portal"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {membership.client.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Mi comunidad de creadoras</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Creadoras con las que ya has trabajado. Cuando lances una campaña nueva,
          les sugeriremos si encajan con el perfil buscado.
        </p>
      </div>

      {community.length > 0 ? (
        <div className="space-y-3">
          {community.map((cc) => {
            const c = cc.creator;
            const ig = c.socialProfiles.find((sp) => sp.platform === "INSTAGRAM");
            const tk = c.socialProfiles.find((sp) => sp.platform === "TIKTOK");
            const igFollowers = ig?.verifiedFollowers ?? ig?.followers;
            const tkFollowers = tk?.verifiedFollowers ?? tk?.followers;
            return (
              <div
                key={cc.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {c.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{c.fullName}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {cc.campaignsCount} campaña{cc.campaignsCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.city}
                    {c.country ? ` · ${c.country}` : ""}
                    {" · "}
                    última colaboración{" "}
                    {new Date(cc.lastCollaborationAt).toLocaleDateString("es-CO", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {c.niches.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.niches.map((n) => (
                        <Badge key={n} variant="secondary" className="text-[10px]">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    {ig && (
                      <span>
                        IG @{ig.handle}
                        {igFollowers ? ` · ${igFollowers.toLocaleString("es-CO")}` : ""}
                      </span>
                    )}
                    {tk && (
                      <span>
                        TK @{tk.handle}
                        {tkFollowers ? ` · ${tkFollowers.toLocaleString("es-CO")}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Todavía no tenés creadoras en tu comunidad.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cuando apruebes creadoras en tus campañas, aparecerán acá.
          </p>
        </div>
      )}
    </div>
  );
}
