import type { UserRole } from "@/generated/prisma/enums";

/** Destino por defecto según rol. Usado por proxy.ts, (app)/layout y require-role. */
export function homeForRole(role: UserRole | string): string {
  if (role === "CREATOR") return "/mi-espacio";
  if (role === "CLIENT") return "/portal";
  if (role === "ADMIN" || role === "TEAM") return "/dashboard";
  return "/login";
}
