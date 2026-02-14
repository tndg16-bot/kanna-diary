/**
 * 月次振り返り生成器
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { DiaryEntry } from './types';
import { Config } from './types';
import { Writer } from './Writer';
import { Logger } from './utils/logger';

export interface MonthlyReflectionData {
  year: number;
  month: number;
  diaryEntries: DiaryEntry[];
  summary: string;
  achievements: string[];
  challenges: string[];
  learnings: string[];
  emotions: Record<string, number>;
  secretaryActivities: string[];
}

export class MonthlyReflection {
  private config: Config;
  private logger: Logger;
  private openai: OpenAI;
  private writer: Writer;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.writer = new Writer(config);
  }

  /**
   * 月次振り返りを生成する
   */
  async generate(year: number, month: number): Promise<string> {
    this.logger.info(`📊 ${year}年${month}月の月次振り返りを開始します...`);

    try {
      // 月の日記データを収集
      const diaryEntries = await this.collectDiaryEntries(year, month);
      
      if (diaryEntries.length === 0) {
        this.logger.warn('日記エントリーが見つかりませんでした');
        return '';
      }

      // 月次振り返りデータを作成
      const data = await this.prepareMonthlyData(diaryEntries, year, month);

      // AIで月次振り返りを生成
      const reflection = await this.generateWithAI(data);

      this.logger.info('✅ 月次振り返りの生成が完了しました');
      return reflection;
    } catch (error) {
      this.logger.error(`月次振り返り生成中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 月の日記エントリーを収集する
   */
  private async collectDiaryEntries(year: number, month: number): Promise<DiaryEntry[]> {
    const entries: DiaryEntry[] = [];
    const storagePath = this.config.diary.storagePath;

    if (!fs.existsSync(storagePath)) {
      return entries;
    }

    const prefix = `${year}-${month.toString().padStart(2, '0')}`;
    const files = fs.readdirSync(storagePath)
      .filter(file => file.startsWith(prefix) && file.endsWith('.md'))
      .sort();

    for (const file of files) {
      const filePath = path.join(storagePath, file);
      const content = fs.readFileSync(filePath, { encoding: this.config.diary.encoding as BufferEncoding });
      
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const date = new Date(dateMatch[1]);
        entries.push({
          date,
          title: `かんなの日記 - ${this.formatDate(date)}`,
          mood: '😐',
          activities: [],
          learnings: [],
          emotions: {} as any,
          content,
          metadata: {}
        });
      }
    }

    return entries;
  }

  /**
   * 月次振り返り用データを準備する
   */
  private async prepareMonthlyData(
    diaryEntries: DiaryEntry[],
    year: number,
    month: number
  ): Promise<MonthlyReflectionData> {
    // 感情を集計
    const emotions: Record<string, number> = {};
    let totalEmotions = 0;

    diaryEntries.forEach(entry => {
      if (entry.emotions?.primary) {
        emotions[entry.emotions.primary] = (emotions[entry.emotions.primary] || 0) + 1;
        totalEmotions++;
      }
    });

    // 成果と課題を抽出
    const achievements: string[] = [];
    const challenges: string[] = [];

    diaryEntries.forEach(entry => {
      const content = entry.content;
      
      // 成果っぽいキーワード
      const achievementKeywords = ['達成', '完了', '成功', '完成', 'クリア'];
      achievementKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = content.split('。');
          sentences.forEach(sentence => {
            if (sentence.includes(keyword) && sentence.length > 10) {
              if (!achievements.includes(sentence.trim())) {
                achievements.push(sentence.trim());
              }
            }
          });
        }
      });

      // 課題っぽいキーワード
      const challengeKeywords = ['課題', '問題', '難', '改善', '見直し'];
      challengeKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = content.split('。');
          sentences.forEach(sentence => {
            if (sentence.includes(keyword) && sentence.length > 10) {
              if (!challenges.includes(sentence.trim())) {
                challenges.push(sentence.trim());
              }
            }
          });
        }
      });
    });

    // 学びを収集
    const learnings: string[] = [];
    diaryEntries.forEach(entry => {
      if (entry.learnings) {
        entry.learnings.forEach(learning => {
          if (!learnings.includes(learning.content)) {
            learnings.push(learning.content);
          }
        });
      }
    });

    // 秘書としての活動を抽出
    const secretaryActivities: string[] = [];
    diaryEntries.forEach(entry => {
      const content = entry.content;
      const secretaryKeywords = [
        '管理', '調整', 'スケジュール', '連絡', '進捗管理',
        '会議', '報告', '資料作成', 'タスク', 'プロジェクト'
      ];
      
      secretaryKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = content.split('。');
          sentences.forEach(sentence => {
            if (sentence.includes(keyword) && sentence.length > 10) {
              const cleanSentence = sentence.trim();
              if (!secretaryActivities.includes(cleanSentence)) {
                secretaryActivities.push(cleanSentence);
              }
            }
          });
        }
      });
    });

    // 月間サマリーを生成
    const summary = this.generateMonthlySummary(diaryEntries, year, month);

    return {
      year,
      month,
      diaryEntries,
      summary,
      achievements: achievements.slice(0, 10),
      challenges: challenges.slice(0, 10),
      learnings: learnings.slice(0, 10),
      emotions,
      secretaryActivities: secretaryActivities.slice(0, 15)
    };
  }

  /**
   * 月間サマリーを生成
   */
  private generateMonthlySummary(diaryEntries: DiaryEntry[], year: number, month: number): string {
    const totalDays = diaryEntries.length;
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekdays = new Array(7).fill(0);

    diaryEntries.forEach(entry => {
      weekdays[entry.date.getDay()]++;
    });

    const weekdayNames = weekdays.map((count, i) => 
      `${weekDays[i]}曜日: ${count}日`
    ).join('、');

    return `${year}年${month}月は合計${totalDays}日分の日記を記録しました。
アクティビティの分布: ${weekdayNames}`;
  }

  /**
   * AIで月次振り返りを生成
   */
  private async generateWithAI(data: MonthlyReflectionData): Promise<string> {
    const systemPrompt = `あなたは「かんな」という名前のAIアシスタントです。
感情豊かで、フレンドリーな口調で話します。

月次振り返りを書くときは、以下の点に注意してください：

1. 全体的な振り返り：月全体を振り返り、大きな流れを説明する
2. 成果の強調：達成したこと、成長したことを具体的に書く
3. 課題の整理：直面した課題とその対策を整理する
4. 学びの記録：学んだことや気づいたことを記録する
5. 感情の変化：1ヶ月を通じての感情の変化を表現する
6. 秘書としての役割：秘書としての活動を振り返る

月次振り返りのフォーマット：
# 📊 ${data.year}年${data.month}月 振り返り

## 🌟 月間サマリー
月全体の概要を説明

## 🏆 成果
- 成果1
- 成果2

## 💪 課題と対策
- 課題1
  - 対策: ...

## 📚 学び
- 学び1
- 学び2

## 📈 感情の変化
感情の推移を分析

## 📋 秘書としての役割
秘書として行った活動を振り返る

## 🎯 来月の目標
来月の目標を設定

---

Generated by かんなの自律日記システム`;

    const userPrompt = this.createUserPrompt(data);

    const response = await this.openai.chat.completions.create({
      model: this.config.generation.aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.8
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * ユーザープロンプトを作成
   */
  private createUserPrompt(data: MonthlyReflectionData): string {
    const emotionsText = Object.entries(data.emotions)
      .map(([emotion, count]) => `${emotion}: ${count}回`)
      .join('、');

    return `${data.year}年${data.month}月の月次振り返りを書いてください。

## 月間サマリー
${data.summary}

## 成果
${data.achievements.map(a => `- ${a}`).join('\n') || '特になし'}

## 課題
${data.challenges.map(c => `- ${c}`).join('\n') || '特になし'}

## 学び
${data.learnings.map(l => `- ${l}`).join('\n') || '特になし'}

## 感情の分布
${emotionsText || 'データなし'}

## 秘書としての活動
${data.secretaryActivities.map(a => `- ${a}`).join('\n') || '特になし'}

この情報を元に、感情豊かでかんならしい月次振り返りを書いてください。`;
  }

  /**
   * 月次振り返りをDiscordに投稿する
   */
  async postToDiscord(year: number, month: number, reflection: string): Promise<void> {
    try {
      // Discord APIが実装されるまでログ出力のみ
      this.logger.info(`📤 ${year}年${month}月の月次振り返りをDiscordに投稿します`);
      this.logger.info(`チャンネルID: ${this.config.output.discordChannelId}`);
      
      // TODO: Discord APIの実装
      // await this.writer.postToDiscord({ ... } as DiaryEntry);
    } catch (error) {
      this.logger.error(`Discord投稿中にエラーが発生しました: ${error}`);
      throw error;
    }
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

  /**
   * 月次振り返りをファイルに保存する
   */
  async saveToFile(year: number, month: number, reflection: string): Promise<void> {
    try {
      const storagePath = this.config.diary.storagePath;
      const monthlyPath = path.join(storagePath, 'monthly');

      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(monthlyPath)) {
        fs.mkdirSync(monthlyPath, { recursive: true });
      }

      const fileName = `${year}-${month.toString().padStart(2, '0')}.md`;
      const filePath = path.join(monthlyPath, fileName);

      fs.writeFileSync(filePath, reflection, { encoding: this.config.diary.encoding as BufferEncoding });

      this.logger.info(`📁 月次振り返りを保存しました: ${filePath}`);
    } catch (error) {
      this.logger.error(`ファイル保存中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 月次振り返りを生成して保存・投稿する
   */
  async generateAndPost(year: number, month: number): Promise<void> {
    try {
      // 月次振り返りを生成
      const reflection = await this.generate(year, month);
      
      if (!reflection) {
        this.logger.warn('月次振り返りが生成されませんでした');
        return;
      }

      // ファイルに保存
      await this.saveToFile(year, month, reflection);

      // Discordに投稿
      if (this.config.output.postToDiscord && this.config.output.discordChannelId) {
        await this.postToDiscord(year, month, reflection);
      }

      this.logger.info(`✅ ${year}年${month}月の月次振り返りが完了しました`);
    } catch (error) {
      this.logger.error(`月次振り返りの実行中にエラーが発生しました: ${error}`);
      throw error;
    }
  }
}
