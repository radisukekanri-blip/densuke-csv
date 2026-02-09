import { test } from '@playwright/test';
import path from 'path';

test('CSV自動取得（UTF-8）', async ({ page }) => {
  // 1. CSV設定ページに移動（ページ完全読み込みを待つ）
  await page.goto(
    'https://densuke.biz/csvsetting?cd=vEX7LAyBenpetdFk',
    { waitUntil: 'networkidle' } // ページ遷移やリソース読み込み完了を待つ
  );

  // 2. UTF-8ラジオボタンを選択
  await page.locator('text=UTF-8').click();
  // もし input[value="utf8"] があればこちらもOK
  // await page.locator('input[value="utf8"]').check();

  // 3. CSV形式で登録データを出力するボタンをクリック（ページ遷移）
  await page.click('button:has-text("CSV形式で登録データを出力する")');

  // 4. ページ遷移後、ダウンロードリンクが表示されるのを待つ
  const downloadLink = page.locator('a:has-text("CSVデータを取得する")'); // リンクテキストを実際に合わせる
  await downloadLink.waitFor({ state: 'visible', timeout: 60000 });

  // 5. ダウンロードイベントを待ちながらリンクをクリック
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    downloadLink.click(),
  ]);

  // 6. CSVを保存
  const downloadPath = path.resolve(__dirname, 'attendance.csv');
  await download.saveAs(downloadPath);
  console.log('CSVを保存しました:', downloadPath);
});

