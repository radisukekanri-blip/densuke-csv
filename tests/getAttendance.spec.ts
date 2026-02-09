import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import csvParse from 'csv-parse/lib/sync'; // npm install csv-parse

// ====== Google スプレッドシート設定 ======
const SPREADSHEET_ID = 'スプレッドシートIDをここに';
const RANGE = 'Sheet1!A1'; // 書き込みたいシートと開始セル
const SERVICE_ACCOUNT_KEY_PATH = path.resolve(__dirname, 'service-account.json'); // サービスアカウントキーのパス

async function updateSheetFromCSV(csvPath: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // CSVを読み込む
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse(csvData, { skip_empty_lines: true });

  // スプレッドシートを更新
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: records },
  });

  console.log('スプレッドシートを更新しました！');
}

// ====== Playwright テスト ======
test('CSV自動取得（UTF-8） → スプレッドシート更新', async ({ page }) => {
  // 1. CSV設定ページに移動
  await page.goto('https://densuke.biz/csvsetting?cd=vEX7LAyBenpetdFk', { waitUntil: 'networkidle' });

  // 2. UTF-8ラジオボタンを選択
  await page.locator('text=UTF-8').click();

  // 3. CSV形式で登録データを出力するボタンをクリック
  const csvButton = page.locator('input[value="CSV形式で登録データを出力する"]');
  await csvButton.waitFor({ state: 'visible', timeout: 60000 });
  await Promise.all([
    page.waitForLoadState('networkidle'),
    csvButton.click(),
  ]);

  // 4. ダウンロードリンクをクリックして CSV を取得
  const downloadLink = page.locator('a:has-text("CSVデータを取得する")');
  await downloadLink.waitFor({ state: 'visible', timeout: 60000 });

  const downloadPath = path.resolve(__dirname, 'attendance.csv');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    downloadLink.click(),
  ]);
  await download.saveAs(downloadPath);
  console.log('CSVを保存しました:', downloadPath);

  // 5. CSVをスプレッドシートにアップロード
  await updateSheetFromCSV(downloadPath);
});
