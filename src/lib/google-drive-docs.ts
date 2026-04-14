import { Readable } from "node:stream";
import { getDrive, getRootFolderId, getOrCreateSubfolder } from "@/lib/google-drive-base";

async function getDocsFolderId(): Promise<string> {
  return getOrCreateSubfolder(getRootFolderId(), "Documentos creadoras");
}

async function getCreatorFolderId(creatorName: string): Promise<string> {
  const docsFolderId = await getDocsFolderId();
  return getOrCreateSubfolder(docsFolderId, creatorName);
}

export async function uploadDocumentToDrive(
  fileBuffer: Buffer,
  fileName: string,
  creatorName: string,
  docType: string,
): Promise<{ fileId: string; viewUrl: string }> {
  const drive = getDrive();
  const folderId = await getCreatorFolderId(creatorName);

  const uploadName = `${docType} — ${creatorName} — ${fileName}`;

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: uploadName,
      parents: [folderId],
    },
    media: {
      mimeType: "application/pdf",
      body: stream,
    },
    fields: "id, webViewLink",
  });

  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: file.data.id!,
    viewUrl: file.data.webViewLink ?? `https://drive.google.com/file/d/${file.data.id}/view`,
  };
}
