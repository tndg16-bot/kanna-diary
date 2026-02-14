/**
 * ソースリーダーファクトリー
 */

import { DiscordReader } from './DiscordReader';
import { GitHubReader } from './GitHubReader';
import { CalendarReader } from './CalendarReader';
import { ObsidianReader } from './ObsidianReader';
import { SourceReader } from './SourceReader';
import { SourceType } from '../types';
import { Config } from '../types';

export class SourceReaderFactory {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  createReader(type: SourceType): SourceReader {
    switch (type) {
      case SourceType.Discord:
        return new DiscordReader(this.config);
      case SourceType.GitHub:
        return new GitHubReader(this.config);
      case SourceType.Calendar:
        return new CalendarReader(this.config);
      case SourceType.Obsidian:
        return new ObsidianReader(this.config);
      default:
        throw new Error(`不明なソースタイプ: ${type}`);
    }
  }
}
