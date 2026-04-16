import { Readable } from "node:stream";
import { getDrive, getRootFolderId, getOrCreateSubfolder } from "@/lib/google-drive-base";

async function getCampaignsFolderId(): Promise<string> {
  return getOrCreateSubfolder(getRootFolderId(), "Campañas");
}

async function getCampaignFolderId(campaignName: string, campaignCode: string): Promise<string> {
  const campaignsFolderId = await getCampaignsFolderId();
  return getOrCreateSubfolder(campaignsFolderId, `${campaignCode} — ${campaignName}`);
}

async function getCampaignAttachmentsFolderId(
  campaignName: string,
  campaignCode: string,
): Promise<string> {
  const campaignFolderId = await getCampaignFolderId(campaignName, campaignCode);
  return getOrCreateSubfolder(campaignFolderId, "Adjuntos del cliente");
}

export async function uploadCampaignAttachmentToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  campaignName: string,
  campaignCode: string,
): Promise<{ fileId: string; viewUrl: string }> {
  const drive = getDrive();
  const folderId = await getCampaignAttachmentsFolderId(campaignName, campaignCode);

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
