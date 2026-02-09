import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import { parse as csvParse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

// 環境変数から取得
const DENSUKE_URL = process.env.DENSUKE_URL!;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

// サービスアカウントキーのパス
const SERVICE_ACCOUNT_KEY_PATH = path.resolve(__dirname, '../service-account.json');

// CSVをスプレッドシートにアップデートする関数
async function updateSheetFromCSV(csvPath: string, spreadsheetId: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // CSV を配列に変換
  const records = csvParse(csvContent, { columns: false, skip_empty_lines: true });

  // シートに書き込む
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '出欠', // 書き込むシート名
    valueInputOption: 'RAW',
    requestBody: { values: records },
  });

  console.log('スプレッドシートを更新しました');
}

test('CSV自動取得＆スプレッドシート更新', async ({ page }) => {
  // 伝助ページにアクセス
  await page.goto(DENSUKE_URL, { waitUntil: 'networkidle' });

  // UTF-8ラジオボタンを選択
  await page.locator('input[value="utf8"]').check();

  // CSV取得ボタンをクリック
  const downloadPath = path.resolve(__dirname, 'attendance.csv');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('input[value="CSV形式で登録データを出力する"]'),
  ]);
  await download.saveAs(downloadPath);
  console.log('CSVを保存しました:', downloadPath);

  // スプレッドシートにアップデート
  await updateSheetFromCSV(downloadPath, SPREADSHEET_ID);
});

