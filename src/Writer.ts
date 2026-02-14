/**
 * 日記ライター
 */

import * as fs from 'fs';
import * as path from 'path';
import { DiaryEntry } from './types';
import { Config } from './types';
import { Logger } from './utils/logger';

export type DiaryType = 'user' | 'kanna';

export class Writer {
  private config: Config;
  private logger: Logger;
  private diaryType: DiaryType;

  constructor(config: Config, diaryType: DiaryType = 'kanna') {
    this.config = config;
    this.logger = new Logger();
    this.diaryType = diaryType;
  }

  /**
   * 日記を保存する
   */
  async write(entry: DiaryEntry): Promise<void> {
    // ファイル保存
    if (this.config.output.saveToFile) {
      await this.saveToFile(entry);
    }

    // Discord投稿
    if (this.config.output.postToDiscord && this.config.output.discordChannelId) {
      await this.postToDiscord(entry);
    }
  }

  /**
   * ファイルに保存する
   */
  private async saveToFile(entry: DiaryEntry): Promise<void> {
    try {
      const filePath = this.getFilePath(entry.date);

      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // ファイルに書き込み
      fs.writeFileSync(filePath, entry.content, { encoding: this.config.diary.encoding as BufferEncoding });

      this.logger.info(`📁 日記を保存しました: ${filePath}`);
    } catch (error) {
      this.logger.error(`ファイル保存中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * Discordに投稿する
   */
  private async postToDiscord(entry: DiaryEntry): Promise<void> {
    try {
      // TODO: Discord APIを実装
      this.logger.info('📤 Discordへの投稿（TODO: 実装待ち）');
    } catch (error) {
      this.logger.warn(`Discord投稿中にエラーが発生しました: ${error}`);
      // Discord投稿に失敗してもファイル保存は成功したと見なす
    }
  }

  /**
   * 日記を読み込む
   */
  async read(date: Date): Promise<DiaryEntry | null> {
    try {
      const filePath = this.getFilePath(date);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, { encoding: this.config.diary.encoding as BufferEncoding });

      return {
        date,
        title: `かんなの日記 - ${this.formatDate(date)}`,
        mood: '😐',
        activities: [],
        learnings: [],
        emotions: {} as any,
        content,
        metadata: {}
      };
    } catch (error) {
      this.logger.error(`日記読み込み中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 日記を検索する
   */
  async search(keyword: string): Promise<DiaryEntry[]> {
    const results: DiaryEntry[] = [];

    try {
      const storagePath = this.getStoragePath();

      if (!fs.existsSync(storagePath)) {
        return results;
      }

      // 全ファイルを走査
      const files = fs.readdirSync(storagePath)
        .filter(file => file.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(storagePath, file);
        const content = fs.readFileSync(filePath, { encoding: this.config.diary.encoding as BufferEncoding });

        // キーワード検索
        if (content.includes(keyword)) {
          const dateStr = file.replace('.md', '');
          const date = new Date(dateStr);

          results.push({
            date,
            title: `かんなの日記 - ${this.formatDate(date)}`,
            mood: '😐',
            activities: [],
            learnings: [],
            emotions: {} as any,
            content: content.substring(0, 200) + '...',
            metadata: {}
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`検索中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * ファイルパスを取得する
   */
  getFilePath(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const fileName = `${year}-${month}-${day}.md`;

    const storagePath = this.diaryType === 'user'
      ? this.config.diary.userStoragePath
      : this.config.diary.kannaStoragePath;

    return path.join(storagePath, fileName);
  }

  /**
   * ストレージパスを取得する
   */
  getStoragePath(): string {
    return this.diaryType === 'user'
      ? this.config.diary.userStoragePath
      : this.config.diary.kannaStoragePath;
  }

  /**
   * 日付をフォーマットする
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日（${weekday}）`;
  }
}

// 型定義の修正
interface Entry {
  title: string;
  mood: string;
}
