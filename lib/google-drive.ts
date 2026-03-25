import { google } from "googleapis";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export function getDriveClient() {
  const auth = getAuth();
  return google.drive({ version: "v3", auth });
}

export async function getFileMetadata(fileId: string) {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size",
    supportsAllDrives: true,
  });
  return res.data;
}

export async function getFileStream(fileId: string, range?: string) {
  const drive = getDriveClient();

  const headers: Record<string, string> = {};
  if (range) {
    headers["Range"] = range;
  }

  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    {
      responseType: "stream",
      headers,
    }
  );

  return {
    stream: res.data as unknown as ReadableStream,
    headers: res.headers,
    status: res.status,
  };
}
