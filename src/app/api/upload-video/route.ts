import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadVideoToDrive } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("video") as File | null;
  const contentPieceId = formData.get("contentPieceId") as string;

  if (!file || !contentPieceId) {
    return NextResponse.json({ error: "Falta el video o el ID de la pieza" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".mp4")) {
    return NextResponse.json({ error: "Solo se aceptan archivos MP4" }, { status: 400 });
  }

  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "El archivo es demasiado grande (máx 500MB)" }, { status: 400 });
  }

  const piece = await prisma.contentPiece.findUnique({
    where: { id: contentPieceId },
    include: {
      campaignCreator: {
        include: {
          creator: { select: { fullName: true } },
          campaign: { select: { code: true, name: true } },
        },
      },
    },
  });

  if (!piece) {
    return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadVideoToDrive(
      buffer,
      file.name,
      piece.campaignCreator.campaign.code,
      piece.campaignCreator.campaign.name,
      piece.campaignCreator.creator.fullName,
    );

    await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: {
        script: result.viewUrl,
        status: "CLIENT_REVIEW",
      },
    });

    return NextResponse.json({ success: true, viewUrl: result.viewUrl });
  } catch (error) {
    console.error("Error subiendo video a Drive:", error);
    return NextResponse.json({ error: "Error subiendo el video" }, { status: 500 });
  }
}
