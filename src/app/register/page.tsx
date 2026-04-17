import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorAvatarsBg } from "@/components/creator-avatars-bg";
import { generateUniqueSlug } from "@/lib/creator-profile";

async function register(formData: FormData) {
  "use server";
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  const password = (formData.get("password") as string) ?? "";

  if (!name || !email || password.length < 8) {
    redirect("/register?error=validation");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CREATOR",
    },
  });

  const slug = await generateUniqueSlug(name);
  await prisma.creator.create({
    data: {
      userId: user.id,
      fullName: name,
      email,
      slug,
      profileStatus: "DRAFT",
      profileVisibility: "PRIVATE",
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/mi-espacio/perfil",
  });
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

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  const errorMessages: Record<string, string> = {
    validation: "Completá todos los campos. La contraseña debe tener 8+ caracteres.",
    exists: "Ya existe una cuenta con ese email.",
  };

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
            <Link
              href="/login"
              className="flex-1 py-2 text-center text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            <div className="flex-1 py-2 text-center text-[13px] font-semibold bg-[#FF4B2C] text-white">
              Registrarse
            </div>
          </div>

          <h2 className="text-lg text-foreground">
            Únete a la comunidad
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Crea tu perfil de creador
          </p>

          <form action={register} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Nombre completo
              </Label>
              <Input
                name="name"
                type="text"
                placeholder="Tu nombre"
                required
                autoComplete="name"
              />
            </div>
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
                placeholder="Mínimo 8 caracteres"
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
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Al registrarte aceptás los{" "}
            <span className="text-primary cursor-pointer hover:underline">
              términos y condiciones
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
