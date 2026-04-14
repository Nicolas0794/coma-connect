import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";

export function getDriveAuth() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (!credentialsPath) throw new Error("GOOGLE_CREDENTIALS_PATH no configurada");

  const fullPath = path.resolve(credentialsPath);
  const credentials = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
}

export function getDrive() {
  return google.drive({ version: "v3", auth: getDriveAuth() });
}

export function getRootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error("GOOGLE_DRIVE_FOLDER_ID no configurada");
  return id;
}

export async function getOrCreateSubfolder(parentId: string, name: string): Promise<string> {
  const drive = getDrive();

  const existing = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
    fields: "files(id)",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  await drive.permissions.create({
    fileId: folder.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return folder.data.id!;
}
