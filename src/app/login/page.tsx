import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorAvatarsBg } from "@/components/creator-avatars-bg";
import { checkLimit, ipKey, loginLimiter } from "@/lib/ratelimit";

async function login(formData: FormData) {
  "use server";
  const { allowed } = await checkLimit(loginLimiter(), await ipKey());
  if (!allowed) redirect("/login?error=ratelimit");

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

function Avatar({
  initials,
  bg,
  color,
}: {
  initials: string;
  bg: string;
  color: string;
}) {
  return (
    <div
      className="size-7 rounded-full flex items-center justify-center text-[11px] font-semibold -mr-2 border-2 border-[#E63E1E]"
      style={{ background: bg, color }}
    >
      {initials}
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "invalid";
  const rateLimited = params.error === "ratelimit";
  const wasReset = params.reset === "success";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 relative">
      <CreatorAvatarsBg />
      <div className="animate-slide-up relative z-10 flex w-full max-w-[720px] min-h-[520px] rounded-2xl border border-border overflow-hidden shadow-lg">
        {/* Panel izquierdo */}
        <div className="hidden sm:flex w-[240px] shrink-0 bg-[#FF4B2C] text-white p-6 flex-col justify-between">
          <div>
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-principal-white.png"
                alt="CoMa — Digital Creators Factory"
                width={160}
                height={60}
              />
            </div>

            <p className="text-[13px] text-white/70 leading-relaxed mb-6">
              El espacio donde los creadores colombianos construyen, conectan y
              crecen juntos.
            </p>

            <div className="bg-white/[0.12] rounded-lg px-3.5 py-3 mb-2">
              <div className="text-[22px] font-bold">+2.400</div>
              <div className="text-[11px] text-white/60 mt-0.5">
                creadores activos
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <div className="flex-1 bg-white/[0.12] rounded-lg px-3.5 py-3">
                <div className="text-base font-bold">180+</div>
                <div className="text-[11px] text-white/60 mt-0.5">marcas</div>
              </div>
              <div className="flex-1 bg-white/[0.12] rounded-lg px-3.5 py-3">
                <div className="text-base font-bold">12</div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  ciudades
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex mb-2">
              <Avatar initials="AL" bg="#F4C0D1" color="#4B1528" />
              <Avatar initials="MR" bg="#B0E4EA" color="#0A3D42" />
              <Avatar initials="JS" bg="#F4D79D" color="#412402" />
              <Avatar initials="+" bg="#D6E889" color="#2A3B0F" />
            </div>
            <p className="text-[11px] text-white/40 mt-2">
              Únete a quienes ya crean
            </p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 bg-card p-6 sm:p-8 flex flex-col justify-center">
          {/* Logo mobile */}
          <div className="sm:hidden flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="CoMa Connect"
              width={160}
              height={36}
              priority
            />
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden mb-6">
            <div className="flex-1 py-2 text-center text-[13px] font-semibold bg-[#FF4B2C] text-white">
              Iniciar sesión
            </div>
            <Link
              href="/register"
              className="flex-1 py-2 text-center text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Registrarse
            </Link>
          </div>

          <h2 className="text-lg text-foreground">
            Bienvenido de nuevo
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Accede a tu espacio creativo
          </p>

          <form action={login} className="space-y-3">
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Contraseña
              </Label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {hasError && (
              <div className="animate-fade-in rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                Email o contraseña incorrectos.
              </div>
            )}

            {rateLimited && (
              <div className="animate-fade-in rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                Demasiados intentos. Esperá unos minutos antes de volver a
                intentar.
              </div>
            )}

            {wasReset && (
              <div className="animate-fade-in rounded-lg bg-[#D6E889]/30 border border-[#D6E889]/50 px-3 py-2 text-sm text-foreground">
                Contraseña actualizada. Ya podés iniciar sesión.
              </div>
            )}

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <div className="flex items-center gap-2.5 my-4">
            <hr className="flex-1 border-border" />
            <span className="text-[11px] text-input">o continúa con</span>
            <hr className="flex-1 border-border" />
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="google" className="w-full">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
