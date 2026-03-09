import { google } from 'googleapis';
import { Readable } from 'stream';

// --- CONFIGURACIÓN OAUTH2 ---
const CLIENT_ID = '141454005675-lgcubd0309l5oea9ada4ktakudlbl740.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = '1//04-gZargquns3CgYIARAAGAQSNwF-L9IrsYG5rdENbpv46NoNSPIPWuqiCPZyaoMUGhDJ5GdljqFTIAd3gr-ejgNUkJXV6FdmuOY';

const CARPETA_ID = '19C2aTcF8OnnERY2Q4domte2N7GTl-MRT'; 

// Configuramos el cliente que "imita" al usuario
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Redirect URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export const subirArchivoDrive = async (fileBuffer: Buffer, fileName: string, mimeType: string) => {
  try {
    console.log(`[Drive] Subiendo archivo: ${fileName}...`);

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: CARPETA_ID ? [CARPETA_ID] : [], // Si hay carpeta, lo mete ahí
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    console.log(`[Drive] Éxito. ID: ${response.data.id}`);

    // Permisos públicos (Opcional: para que cualquiera con el link pueda ver la planeación)
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId: response.data.id,
      enlaceVer: response.data.webViewLink,
      enlaceDescarga: response.data.webContentLink
    };

  } catch (error: any) {
    console.error('Error OAUTH Drive:', error);
    throw new Error(`Fallo Drive: ${error.message}`);
  }
};