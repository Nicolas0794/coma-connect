import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

async function sendMessage(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;

  const campaignId = formData.get("campaignId") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!body) return;

  await prisma.campaignMessage.create({
    data: {
      campaignId,
      userId: session.user.id,
      body,
    },
  });

  redirect(`/campanas/${campaignId}/chat`);
}

export default async function CampaignChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;
  const role = session.user.role;

  // Verificar acceso: admin/team ven todo, cliente solo su campaña, creadora solo donde participa
  let campaign;

  if (role === "ADMIN" || role === "TEAM") {
    campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, name: true, clientId: true },
    });
  } else if (role === "CLIENT") {
    const membership = await prisma.clientMember.findFirst({
      where: { userId },
      select: { clientId: true },
    });
    if (!membership) redirect("/portal");
    campaign = await prisma.campaign.findUnique({
      where: { id, clientId: membership.clientId },
      select: { id: true, name: true, clientId: true },
    });
  } else if (role === "CREATOR") {
    const creator = await prisma.creator.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!creator) redirect("/mi-espacio");
    const cc = await prisma.campaignCreator.findFirst({
      where: { campaignId: id, creatorId: creator.id, status: { in: ["ACCEPTED", "ACTIVE", "ONBOARDING"] } },
    });
    if (!cc) redirect("/mi-espacio");
    campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, name: true, clientId: true },
    });
  }

  if (!campaign) notFound();

  const messages = await prisma.campaignMessage.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    take: 200,
  });

  const backUrl = role === "CLIENT" ? `/portal/${id}` : role === "CREATOR" ? "/mi-espacio" : `/campanas/${id}`;

  const roleLabels: Record<string, string> = {
    ADMIN: "CoMa",
    TEAM: "CoMa",
    CLIENT: "Cliente",
    CREATOR: "Creadora",
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-primary/10 text-primary",
    TEAM: "bg-primary/10 text-primary",
    CLIENT: "bg-[#F4D79D]/30 text-amber-700",
    CREATOR: "bg-[#B0E4EA]/30 text-teal-700",
  };

  return (
    <div className="mx-auto max-w-3xl p-6 flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <div className="mb-4">
        <Link
          href={backUrl}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <h1 className="text-lg font-medium text-foreground">
            Chat — {campaign.name}
          </h1>
          <span className="text-xs text-muted-foreground">
            {messages.length} mensaje{messages.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-3 mb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Todavía no hay mensajes. ¡Empezá la conversación!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {!isOwn && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold">
                        {msg.user.name ?? msg.user.email}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[msg.user.role]}`}
                      >
                        {roleLabels[msg.user.role]}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isOwn ? "text-white/60" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleString("es-CO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form action={sendMessage} className="flex gap-2">
        <input type="hidden" name="campaignId" value={id} />
        <input
          name="body"
          required
          placeholder="Escribí un mensaje..."
          autoComplete="off"
          className="flex-1 h-10 rounded-xl border border-input/60 bg-secondary px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <Button type="submit">Enviar</Button>
      </form>

      {/* Auto-refresh */}
      <meta httpEquiv="refresh" content="5" />
    </div>
  );
}
