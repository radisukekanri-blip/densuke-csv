import { test } from '@playwright/test';
import path from 'path';

test('CSV自動取得（UTF-8）', async ({ page }) => {
  // 1. CSV設定ページに移動（ページ完全読み込みを待つ）
  await page.goto(
    'https://densuke.biz/csvsetting?cd=vEX7LAyBenpetdFk',
    { waitUntil: 'networkidle' }
  );

  // 2. UTF-8ラジオボタンを選択
  await page.locator('text=UTF-8').click();
  // もし input[value="utf8"] があればこちらもOK
  // await page.locator('input[value="utf8"]').check();

  // 3. CSV形式で登録データを出力するボタンをクリック（ページ遷移）
  const csvButton = page.locator('input[value="CSV形式で登録データを出力する"]');
  await csvButton.waitFor({ state: 'visible', timeout: 60000 });
  await Promise.all([
    page.waitForLoadState('networkidle'), // ページ遷移完了を待つ
    csvButton.click(),
  ]);

  // 4. ページ遷移後、ダウンロードリンクをクリックして CSV を取得
  const downloadLink = page.locator('a:has-text("CSVデータを取得する")'); // リンクの文字列に合わせて変更
  await downloadLink.waitFor({ state: 'visible', timeout: 60000 });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    downloadLink.click(),
  ]);

  // 5. CSVを保存
  const downloadPath = path.resolve(__dirname, 'attendance.csv');
  await download.saveAs(downloadPath);
  console.log('CSVを保存しました:', downloadPath);
});


