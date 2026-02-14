/**
 * 月次振り返り生成スクリプト
 * GitHub Actionsから呼び出される
 */

import * as path from 'path';
import { MonthlyReflection } from '../src/MonthlyReflection';
import { loadConfig } from '../src/utils/config';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: ts-node generate-monthly-reflection.ts <year> <month>');
    process.exit(1);
  }

  const year = parseInt(args[0], 10);
  const month = parseInt(args[1], 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    console.error('Invalid year or month');
    process.exit(1);
  }

  try {
    console.log(`📊 ${year}年${month}月の月次振り返りを生成します...`);

    // 設定ファイルを読み込む
    const configPath = path.join(__dirname, '..', 'config.json');
    const config = loadConfig(configPath);

    // 月次振り返りを生成
    const reflection = new MonthlyReflection(config);
    await reflection.generateAndPost(year, month);

    console.log(`✅ ${year}年${month}月の月次振り返りが完了しました`);
  } catch (error) {
    console.error(`❌ 月次振り返りの生成に失敗しました:`, error);
    process.exit(1);
  }
}

main();
