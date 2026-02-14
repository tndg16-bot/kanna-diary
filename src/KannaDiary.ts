/**
 * かんなの自律日記システム - メインクラス
 */

import { SourceReaderFactory } from './readers/SourceReaderFactory';
import { Collector } from './Collector';
import { Generator } from './Generator';
import { Writer, DiaryType } from './Writer';
import { Config } from './types';
import { Logger } from './utils/logger';

export class KannaDiary {
  private config: Config;
  private logger: Logger;
  private collector: Collector;
  private generator: Generator;
  private writer: Writer;

  constructor(config: Config, diaryType: DiaryType = 'kanna') {
    this.config = config;
    this.logger = new Logger();
    this.collector = new Collector(config);
    this.generator = new Generator(config);
    this.writer = new Writer(config, diaryType);
  }

  /**
   * 日記を生成する
   * @param dateStr オプションの日付文字列（YYYY-MM-DD）、デフォルトは昨日
   */
  async generate(dateStr?: string): Promise<void> {
    this.logger.info('📔 かんなの日記生成を開始します...');

    try {
      // 日付を取得（デフォルトは昨日）
      let date: Date;
      if (dateStr) {
        date = new Date(dateStr);
      } else {
        // デフォルトは昨日
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday;
      }
      const dateStrFormatted = date.toISOString().split('T')[0];
      this.logger.info(`📅 対象日: ${dateStrFormatted}`);

      // データ収集
      this.logger.info('📥 データ収集中...');
      const collectedData = await this.collector.collect(date);

      if (collectedData.sources.length === 0) {
        this.logger.warn('収集できるデータがありませんでした');
        return;
      }

      this.logger.info(`✅ ${collectedData.sources.length}件のデータを収集しました`);

      // 日記生成
      this.logger.info('✍️ 日記生成中...');
      const entry = await this.generator.generate(collectedData);

      // 日記保存
      this.logger.info('💾 日記保存中...');
      await this.writer.write(entry);

      this.logger.info(`✨ 日記「${entry.title}」を生成・保存しました！`);
      this.logger.info(`📁 保存先: ${this.writer.getFilePath(date)}`);

    } catch (error) {
      this.logger.error(`日記生成中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 特定の日付の日記を表示する
   */
  async show(dateStr: string): Promise<void> {
    this.logger.info(`📖 ${dateStr}の日記を表示します...`);

    try {
      const entry = await this.writer.read(new Date(dateStr));

      if (!entry) {
        this.logger.warn(`${dateStr}の日記は存在しません`);
        return;
      }

      console.log('\n' + '='.repeat(60));
      console.log(entry.content);
      console.log('='.repeat(60) + '\n');

    } catch (error) {
      this.logger.error(`日記読み込み中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 日記を検索する
   */
  async search(keyword: string): Promise<void> {
    this.logger.info(`🔍 「${keyword}」で検索しています...`);

    try {
      const results = await this.writer.search(keyword);

      if (results.length === 0) {
        this.logger.info('該当する日記が見つかりませんでした');
        return;
      }

      console.log(`\n📚 ${results.length}件の結果が見つかりました:\n`);
      results.forEach((entry, index) => {
        const dateStr = entry.date.toISOString().split('T')[0];
        console.log(`${index + 1}. ${dateStr} - ${entry.title}`);
        console.log(`   ${entry.mood}\n`);
      });

    } catch (error) {
      this.logger.error(`検索中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 統計情報を表示する
   */
  async stats(type: string): Promise<void> {
    this.logger.info(`📊 統計情報 (${type})...`);

    try {
      // TODO: 統計情報の実装
      this.logger.info('統計情報機能は開発中です...');

    } catch (error) {
      this.logger.error(`統計情報の取得中にエラーが発生しました: ${error}`);
      throw error;
    }
  }
}
