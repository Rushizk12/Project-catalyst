import 'dotenv/config';
import { google } from 'googleapis';

const requiredScopes = ['https://www.googleapis.com/auth/spreadsheets'];

function getJwtClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.');
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: requiredScopes
  });
}

export async function appendSubmissionRow(rowValues: (string | number | null)[]) {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    extractSpreadsheetIdFromUrl(process.env.GOOGLE_SHEETS_SPREADSHEET_URL || '');
  const sheetName = process.env.GOOGLE_SHEETS_WORKSHEET_TITLE || 'Sheet1';
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set.');
  }

  const auth = getJwtClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues]
    }
  });
}

export function extractSpreadsheetIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/spreadsheets\/(?:d|u\/\d\/d)\/([^/]+)/);
  return match ? match[1] : null;
}


