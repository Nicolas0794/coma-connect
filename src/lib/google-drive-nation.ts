import { Readable } from "node:stream";
import { getDrive, getRootFolderId, getOrCreateSubfolder } from "@/lib/google-drive-base";

async function getNationFolderId(): Promise<string> {
  return getOrCreateSubfolder(getRootFolderId(), "Nation");
}

async function getEventFolderId(eventSlug: string, eventName: string): Promise<string> {
  const nationFolderId = await getNationFolderId();
  return getOrCreateSubfolder(nationFolderId, `${eventSlug} — ${eventName}`);
}

export async function uploadEventCoverToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  eventSlug: string,
  eventName: string,
): Promise<{ fileId: string; viewUrl: string }> {
  const drive = getDrive();
  const folderId = await getEventFolderId(eventSlug, eventName);

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: `cover — ${fileName}`,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || "image/jpeg",
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

export async function uploadEventAssetToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  eventSlug: string,
  eventName: string,
): Promise<{ fileId: string; viewUrl: string }> {
  const drive = getDrive();
  const folderId = await getEventFolderId(eventSlug, eventName);

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
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
