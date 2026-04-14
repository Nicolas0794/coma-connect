import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

function getAuth() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (!credentialsPath) throw new Error("GOOGLE_CREDENTIALS_PATH no configurada");

  const fullPath = path.resolve(credentialsPath);
  const credentials = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export async function getOrCreateCampaignFolder(
  campaignCode: string,
  campaignName: string,
): Promise<string> {
  const drive = getDrive();
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID no configurada");

  const folderName = `${campaignCode} — ${campaignName}`;

  const existing = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed=false`,
    fields: "files(id, name)",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  // Hacer la carpeta visible para cualquiera con el link
  await drive.permissions.create({
    fileId: folder.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return folder.data.id!;
}

export async function uploadVideoToDrive(
  fileBuffer: Buffer,
  fileName: string,
  campaignCode: string,
  campaignName: string,
  creatorName: string,
): Promise<{ fileId: string; viewUrl: string; downloadUrl: string }> {
  const drive = getDrive();

  const folderId = await getOrCreateCampaignFolder(campaignCode, campaignName);

  const sanitizedCreator = creatorName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").trim();
  const timestamp = new Date().toISOString().slice(0, 10);
  const uploadName = `${sanitizedCreator} — ${timestamp} — ${fileName}`;

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: uploadName,
      parents: [folderId],
    },
    media: {
      mimeType: "video/mp4",
      body: stream,
    },
    fields: "id, webViewLink, webContentLink",
  });

  // Hacer el archivo visible para cualquiera con el link
  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId: file.data.id!,
    viewUrl: file.data.webViewLink ?? `https://drive.google.com/file/d/${file.data.id}/view`,
    downloadUrl: file.data.webContentLink ?? `https://drive.google.com/uc?id=${file.data.id}&export=download`,
  };
}

export async function listCampaignVideos(
  campaignCode: string,
  campaignName: string,
): Promise<Array<{ id: string; name: string; viewUrl: string; createdTime: string }>> {
  const drive = getDrive();

  let folderId: string;
  try {
    folderId = await getOrCreateCampaignFolder(campaignCode, campaignName);
  } catch {
    return [];
  }

  const result = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed=false`,
    fields: "files(id, name, webViewLink, createdTime)",
    orderBy: "createdTime desc",
  });

  return (result.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    viewUrl: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
    createdTime: f.createdTime!,
  }));
}
