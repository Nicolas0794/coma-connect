import { Readable } from "node:stream";
import { getDrive, getRootFolderId, getOrCreateSubfolder } from "@/lib/google-drive-base";

async function getAcademyFolderId(): Promise<string> {
  return getOrCreateSubfolder(getRootFolderId(), "Academy");
}

async function getCourseFolderId(courseSlug: string, courseTitle: string): Promise<string> {
  const academyFolderId = await getAcademyFolderId();
  return getOrCreateSubfolder(academyFolderId, `${courseSlug} — ${courseTitle}`);
}

async function getCertificatesFolderId(): Promise<string> {
  return getOrCreateSubfolder(getRootFolderId(), "Certificados");
}

async function getUserCertificatesFolderId(userName: string): Promise<string> {
  const certsFolderId = await getCertificatesFolderId();
  return getOrCreateSubfolder(certsFolderId, userName);
}

export async function uploadLessonVideoToDrive(
  fileBuffer: Buffer,
  fileName: string,
  courseSlug: string,
  courseTitle: string,
  lessonTitle: string,
): Promise<{ fileId: string; viewUrl: string; downloadUrl: string }> {
  const drive = getDrive();
  const folderId = await getCourseFolderId(courseSlug, courseTitle);

  const uploadName = `${lessonTitle} — ${fileName}`;

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
    downloadUrl:
      file.data.webContentLink ?? `https://drive.google.com/uc?id=${file.data.id}&export=download`,
  };
}

export async function uploadCourseCoverToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  courseSlug: string,
  courseTitle: string,
): Promise<{ fileId: string; viewUrl: string }> {
  const drive = getDrive();
  const folderId = await getCourseFolderId(courseSlug, courseTitle);

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

export async function uploadCertificateToDrive(
  fileBuffer: Buffer,
  fileName: string,
  userName: string,
  courseTitle: string,
): Promise<{ fileId: string; viewUrl: string; downloadUrl: string }> {
  const drive = getDrive();
  const folderId = await getUserCertificatesFolderId(userName);

  const uploadName = `Certificado — ${courseTitle} — ${fileName}`;

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
    fields: "id, webViewLink, webContentLink",
  });

  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: file.data.id!,
    viewUrl: file.data.webViewLink ?? `https://drive.google.com/file/d/${file.data.id}/view`,
    downloadUrl:
      file.data.webContentLink ?? `https://drive.google.com/uc?id=${file.data.id}&export=download`,
  };
}
