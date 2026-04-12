import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import Link from "next/link";

async function requestReset(formData: FormData) {
  "use server";
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await createPasswordResetToken(email);
    await sendPasswordResetEmail(email, token);
  }

  redirect("/forgot-password?sent=true");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "true";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="animate-slide-up w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="CoMa Connect"
            width={160}
            height={36}
            className="mx-auto mb-6"
          />

          {sent ? (
            <div className="text-center space-y-3">
              <div className="size-12 rounded-full bg-[#D6E889]/30 flex items-center justify-center text-xl mx-auto">
                ✉️
              </div>
              <h2 className="text-lg font-medium text-foreground">
                Revisá tu correo
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si tu email está registrado, te enviamos un link para restablecer
                tu contraseña. Revisá tu bandeja de entrada (y spam).
              </p>
              <Link href="/login">
                <Button variant="ghost" className="mt-2">
                  Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium text-foreground">
                Restablecer contraseña
              </h2>
              <p className="text-[13px] text-muted-foreground mb-5">
                Ingresá tu email y te enviamos un link para crear una nueva
                contraseña.
              </p>

              <form action={requestReset} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Correo electrónico
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="tú@ejemplo.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Enviar link
                </Button>
              </form>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
