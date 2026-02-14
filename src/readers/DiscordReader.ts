/**
 * Discordリーダー
 */

import { SourceReader } from './SourceReader';
import { SourceData, SourceType } from '../types';
import { Config } from '../types';
import { Logger } from '../utils/logger';

export class DiscordReader implements SourceReader {
  private config: Config;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
  }

  async read(date: Date): Promise<SourceData[]> {
    const data: SourceData[] = [];

    // TODO: Discord APIを実装
    // 現在はモックデータを返す
    this.logger.info('📥 Discordからのデータ収集（モック）');

    // モックデータ
    data.push({
      type: SourceType.Discord,
      timestamp: new Date(date.getTime() - 9 * 60 * 60 * 1000), // 9:00
      content: '今日も頑張ろう！',
      metadata: {
        channel: '秘書さんの部屋',
        author: 'かんな'
      }
    });

    data.push({
      type: SourceType.Discord,
      timestamp: new Date(date.getTime() - 5 * 60 * 60 * 1000), // 18:00
      content: '日記システムの開発、楽しかった！',
      metadata: {
        channel: 'dev-kanna-diary',
        author: 'かんな'
      }
    });

    this.logger.debug(`Discordから${data.length}件を収集しました`);
    return data;
  }

  getSourceType(): SourceType {
    return SourceType.Discord;
  }
}
