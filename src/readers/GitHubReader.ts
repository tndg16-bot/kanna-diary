/**
 * GitHubリーダー
 */

import { SourceReader } from './SourceReader';
import { SourceData, SourceType } from '../types';
import { Config } from '../types';
import { Logger } from '../utils/logger';

export class GitHubReader implements SourceReader {
  private config: Config;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
  }

  async read(date: Date): Promise<SourceData[]> {
    const data: SourceData[] = [];

    // TODO: GitHub APIを実装
    // 現在はモックデータを返す
    this.logger.info('📥 GitHubからのデータ収集（モック）');

    // モックデータ
    data.push({
      type: SourceType.GitHub,
      timestamp: new Date(date.getTime() - 8 * 60 * 60 * 1000), // 15:00
      content: 'Issue #30: スキル構造設計を完了した',
      metadata: {
        repo: this.config.sources.github.repo,
        issue: '30',
        type: 'issue'
      }
    });

    this.logger.debug(`GitHubから${data.length}件を収集しました`);
    return data;
  }

  getSourceType(): SourceType {
    return SourceType.GitHub;
  }
}
