import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadDocumentToDrive } from "@/lib/google-drive-docs";
import { checkLimit, uploadDocLimiter } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { allowed, reset } = await checkLimit(
    uploadDocLimiter(),
    `user:${session.user.id}`,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Intentá en un rato." },
      { status: 429, headers: { "Retry-After": String(reset) } },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = formData.get("docType") as string;
  const paymentId = formData.get("paymentId") as string | null;

  if (!file || !docType) {
    return NextResponse.json({ error: "Falta el archivo o el tipo" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo es demasiado grande (máx 10MB)" }, { status: 400 });
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return NextResponse.json({ error: "Perfil de creador no encontrado" }, { status: 404 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadDocumentToDrive(
      buffer,
      file.name,
      creator.fullName,
      docType,
    );

    if (docType === "RUT") {
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          rutUrl: result.viewUrl,
          docsCompleted: !!creator.certBancariaUrl && !!creator.documentId,
        },
      });
    } else if (docType === "CERTIFICACION_BANCARIA") {
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          certBancariaUrl: result.viewUrl,
          docsCompleted: !!creator.rutUrl && !!creator.documentId,
        },
      });
    } else if (docType === "CUENTA_DE_COBRO" && paymentId) {
      await prisma.paymentDocument.upsert({
        where: { paymentId_type: { paymentId, type: "CUENTA_DE_COBRO" } },
        update: { fileUrl: result.viewUrl },
        create: { paymentId, type: "CUENTA_DE_COBRO", fileUrl: result.viewUrl, fileName: file.name },
      });

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (payment && payment.status === "PENDING") {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "DOCS_SUBMITTED" },
        });
      }
    }

    return NextResponse.json({ success: true, viewUrl: result.viewUrl });
  } catch (error) {
    console.error("Error subiendo documento a Drive:", error);
    return NextResponse.json({ error: "Error subiendo el documento" }, { status: 500 });
  }
}
