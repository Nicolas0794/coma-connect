import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientReport } from "@/lib/client-report";
import { ClientReportView } from "@/components/client-report-view";

export default async function PortalReportePage() {
  const session = await auth();
  if (session?.user?.role !== "CLIENT") redirect("/");

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true, client: { select: { name: true } } },
  });
  if (!membership) redirect("/portal");

  const report = await getClientReport(membership.clientId);
  if (!report) redirect("/portal");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <Link
          href="/portal"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {membership.client.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Reporte general</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toda la actividad de tus campañas en un solo lugar.
        </p>
      </div>

      <ClientReportView report={report} campaignHrefBase="/portal" />
    </div>
  );
}
