/**
 * Obsidianリーダー
 */

import { SourceReader } from './SourceReader';
import { SourceData, SourceType } from '../types';
import { Config } from '../types';
import { Logger } from '../utils/logger';

export class ObsidianReader implements SourceReader {
  private config: Config;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
  }

  async read(_date: Date): Promise<SourceData[]> {
    const data: SourceData[] = [];

    // TODO: Obsidian APIを実装
    // 現在は空の配列を返す
    if (!this.config.sources.obsidian.enabled) {
      return data;
    }

    this.logger.info('📥 Obsidianからのデータ収集（モック）');

    this.logger.debug(`Obsidianから${data.length}件を収集しました`);
    return data;
  }

  getSourceType(): SourceType {
    return SourceType.Obsidian;
  }
}
