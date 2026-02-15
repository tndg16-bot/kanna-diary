/**
 * カレンダーリーダー
 */

import { SourceReader } from './SourceReader';
import { SourceData, SourceType } from '../types';
import { Config } from '../types';
import { Logger } from '../utils/logger';

export class CalendarReader implements SourceReader {
  private config: Config;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
  }

  async read(_date: Date): Promise<SourceData[]> {
    const data: SourceData[] = [];

    // TODO: カレンダーAPIを実装
    // 現在は空の配列を返す
    if (!this.config.sources.calendar.enabled) {
      return data;
    }

    this.logger.info('📥 カレンダーからのデータ収集（モック）');

    this.logger.debug(`カレンダーから${data.length}件を収集しました`);
    return data;
  }

  getSourceType(): SourceType {
    return SourceType.Calendar;
  }
}
