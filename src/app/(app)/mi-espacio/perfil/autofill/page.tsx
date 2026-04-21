import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AutofillForm } from "./autofill-form";

export default async function AutofillPage() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    include: {
      socialProfiles: {
        where: { platform: "INSTAGRAM" },
        select: { handle: true },
        take: 1,
      },
    },
  });
  if (!creator) redirect("/mi-espacio");

  const initialHandle = creator.socialProfiles[0]?.handle ?? null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <Link
          href="/mi-espacio/perfil"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver a mi perfil
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] flex items-center justify-center text-white text-xl shrink-0">
            ✨
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Autocompletá tu perfil con IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Pegá tu handle de Instagram y Claude lee tu perfil público para
              proponer headline, nichos, tarifas y más. Vos revisás y ajustás
              antes de guardar.
            </p>
          </div>
        </div>
      </div>

      <AutofillForm initialHandle={initialHandle} />
    </div>
  );
}
