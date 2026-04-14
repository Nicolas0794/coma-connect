import { Readable } from "node:stream";
import { getDrive, getRootFolderId, getOrCreateSubfolder } from "@/lib/google-drive-base";

async function getVideosFolderId(): Promise<string> {
  return getOrCreateSubfolder(getRootFolderId(), "Videos por campaña");
}

export async function getOrCreateCampaignFolder(
  campaignCode: string,
  campaignName: string,
): Promise<string> {
  const videosFolderId = await getVideosFolderId();
  return getOrCreateSubfolder(videosFolderId, `${campaignCode} — ${campaignName}`);
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

  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: { role: "reader", type: "anyone" },
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
