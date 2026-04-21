import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/enums";
import { homeForRole } from "@/lib/role-routes";

export { homeForRole };

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
