import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { validatePasswordResetToken, consumePasswordResetToken } from "@/lib/tokens";
import bcrypt from "bcryptjs";
import Link from "next/link";

async function resetPassword(formData: FormData) {
  "use server";
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!token || !password || password.length < 8) {
    redirect(`/reset-password?token=${token}&error=short`);
  }

  if (password !== confirm) {
    redirect(`/reset-password?token=${token}&error=mismatch`);
  }

  const email = await consumePasswordResetToken(token);
  if (!email) {
    redirect("/reset-password?error=expired");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  redirect("/login?reset=success");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { token, error } = params;

  if (error === "expired" || (!token && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="animate-slide-up w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center text-xl mx-auto">
              ⏰
            </div>
            <h2 className="text-lg font-medium text-foreground">
              Link expirado
            </h2>
            <p className="text-sm text-muted-foreground">
              Este link ya no es válido. Pedí uno nuevo desde el login.
            </p>
            <Link href="/forgot-password">
              <Button variant="ghost" className="mt-2">
                Pedir nuevo link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isValid = token ? await validatePasswordResetToken(token) : null;
  if (token && !isValid) {
    redirect("/reset-password?error=expired");
  }

  const errorMessages: Record<string, string> = {
    short: "La contraseña debe tener al menos 8 caracteres.",
    mismatch: "Las contraseñas no coinciden.",
  };

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

          <h2 className="text-lg font-medium text-foreground">
            Nueva contraseña
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Elegí una contraseña nueva para tu cuenta.
          </p>

          <form action={resetPassword} className="space-y-3">
            <input type="hidden" name="token" value={token ?? ""} />

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Nueva contraseña
              </Label>
              <Input
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Confirmar contraseña
              </Label>
              <Input
                name="confirm"
                type="password"
                placeholder="Repetí la contraseña"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && errorMessages[error] && (
              <div className="animate-fade-in rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {errorMessages[error]}
              </div>
            )}

            <Button type="submit" className="w-full">
              Cambiar contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
