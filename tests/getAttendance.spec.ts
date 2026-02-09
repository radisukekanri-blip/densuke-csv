import { test } from '@playwright/test';
import path from 'path';

test('CSV自動取得（UTF-8）', async ({ page }) => {
  await page.goto('https://densuke.biz/csvsetting?cd=vEX7LAyBenpetdFk');

  // UTF-8ラジオボタンを選択
  await page.locator('text=UTF-8').click(); // 文字列で選択
  // または input指定: await page.locator('input[value="utf8"]').check();

  // ダウンロード先
  const downloadPath = path.resolve(__dirname, 'attendance.csv');

  // CSV取得ボタンをクリックしてダウンロード
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=CSV形式で登録データを出力する'),
  ]);

  await download.saveAs(downloadPath);
  console.log('CSVを保存しました:', downloadPath);
});
