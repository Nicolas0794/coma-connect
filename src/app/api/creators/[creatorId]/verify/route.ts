import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyCreatorProfiles } from "@/lib/social-verify";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "TEAM", "CLIENT"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { creatorId } = await params;
  const results = await verifyCreatorProfiles(creatorId);

  return NextResponse.json({ results });
}
