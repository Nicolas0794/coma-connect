import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/enums";

export function homeForRole(role: UserRole | string): string {
  if (role === "CREATOR") return "/mi-espacio";
  if (role === "CLIENT") return "/portal";
  if (role === "ADMIN" || role === "TEAM") return "/dashboard";
  return "/login";
}

export async function requireRole(allowed: UserRole[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role as UserRole;
  if (!allowed.includes(role)) redirect(homeForRole(role));
  return { session, role };
}

export const requireInternalRole = () => requireRole(["ADMIN", "TEAM"]);
export const requireCreator = () => requireRole(["CREATOR"]);
export const requireClient = () => requireRole(["CLIENT"]);
