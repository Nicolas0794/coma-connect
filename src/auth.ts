import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@/generated/prisma/enums";
import { generateUniqueSlug } from "@/lib/creator-profile";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        const existing = await prisma.user.findUnique({
          where: { email },
        });

        if (!existing) {
          // CRÍTICA-2: por defecto rol CREATOR. Rol elevado solo vía whitelist.
          const invite = await prisma.invitedEmail.findUnique({
            where: { email },
          });
          const role: UserRole = invite?.role ?? "CREATOR";

          const created = await prisma.user.create({
            data: {
              email,
              name: user.name,
              image: user.image,
              role,
              emailVerified: new Date(),
            },
          });

          if (invite && !invite.usedAt) {
            await prisma.invitedEmail.update({
              where: { id: invite.id },
              data: { usedAt: new Date() },
            });
          }

          // Si es CREATOR, crear su perfil para que /mi-espacio funcione.
          if (role === "CREATOR") {
            const slug = await generateUniqueSlug(user.name ?? email);
            await prisma.creator.create({
              data: {
                userId: created.id,
                fullName: user.name ?? email,
                email,
                slug,
                profileStatus: "DRAFT",
                profileVisibility: "PRIVATE",
              },
            });
          }
        } else if (!existing.image && user.image) {
          await prisma.user.update({
            where: { email },
            data: { image: user.image, emailVerified: new Date() },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
