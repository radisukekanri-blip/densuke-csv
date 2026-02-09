import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import { parse as csvParse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

// .envから読み込み
const DENSUKE_URL = process.env.DENSUKE_URL!;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

test('CSV自動取得＆スプレッドシート更新', async ({ page }) => {
  // 伝助ページにアクセス
  await page.goto(DENSUKE_URL, { waitUntil: 'networkidle' });

  // UTF-8ラジオボタンを選択
  await page.locator('input[value="utf8"]').check();

  // CSV取得ボタンをクリックしてページ遷移
  const csvButton = page.locator('input[value="CSV形式で登録データを出力する"]');
  await csvButton.waitFor({ state: 'visible', timeout: 60000 });
  await Promise.all([
    page.waitForLoadState('networkidle'), // ページ遷移完了を待つ
    csvButton.click(),
  ]);

  // ダウンロードリンクを取得
  const downloadLink = page.locator('a:has-text("CSVデータを取得する")');

  // CSV保存パス
  const downloadPath = path.resolve(__dirname, 'attendance.csv');

  // ダウンロード
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    downloadLink.click(),
  ]);
  await download.saveAs(downloadPath);
  console.log('CSVを保存しました:', downloadPath);

  // CSV読み込み
  const csvContent = fs.readFileSync(downloadPath, 'utf-8');
  const records = csvParse(csvContent, { columns: false, skip_empty_lines: true });

  // Google Sheetsに書き込む
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const values = records.map(Object.values); // 配列に変換
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: '出欠!A1',
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  console.log('スプレッドシートを更新しました！');
});
