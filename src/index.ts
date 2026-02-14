#!/usr/bin/env node

/**
 * かんなの自律日記システム - メインエントリーポイント
 *
 * 毎晩23時に自動実行され、その日の出来事、感情、学びを記録する
 */

import * as fs from 'fs';
import * as path from 'path';
import { KannaDiary } from './KannaDiary';
import { loadConfig } from './utils/config';
import { Logger } from './utils/logger';

const logger = new Logger();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';

  // 設定を読み込み
  const configPath = path.join(__dirname, '..', 'config.json');
  const config = loadConfig(configPath);

  // 日記システムを初期化
  const diary = new KannaDiary(config);

  try {
    switch (command) {
      case 'generate':
        const dateParam = args[1]; // 日付パラメータ（オプション）
        await diary.generate(dateParam);
        break;
      case 'show':
        const date = args[1] || new Date().toISOString().split('T')[0];
        await diary.show(date);
        break;
      case 'search':
        const keyword = args[1];
        if (!keyword) {
          logger.error('検索キーワードを指定してください');
          process.exit(1);
        }
        await diary.search(keyword);
        break;
      case 'stats':
        const statType = args[1] || 'all';
        await diary.stats(statType);
        break;
      default:
        logger.error(`不明なコマンド: ${command}`);
        logger.info('使用可能なコマンド: generate, show, search, stats');
        process.exit(1);
    }
  } catch (error) {
    logger.error(`エラーが発生しました: ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
