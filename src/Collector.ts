/**
 * データコレクター
 */

import { SourceReaderFactory } from './readers/SourceReaderFactory';
import { SentimentAnalyzer } from './sentiment-analyzer';
import { Config, SourceData, CollectedData, SourceType } from './types';
import { Logger } from './utils/logger';

export class Collector {
  private config: Config;
  private logger: Logger;
  private readerFactory: SourceReaderFactory;
  private sentimentAnalyzer: SentimentAnalyzer;
  
  // 秘書作業に関連するキーワード
  private readonly secretaryKeywords = [
    '管理', '調整', 'スケジュール', '連絡', '進捗管理',
    '会議', '報告', '資料作成', 'タスク', 'プロジェクト',
    'リマインド', '予定', '予定調整', '会議の準備',
    '議事録', 'まとめ', '整理', '対応', '確認',
    'コーディネート', '調整業務', 'アポイント', '日程'
  ];

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
    this.readerFactory = new SourceReaderFactory(config);
    this.sentimentAnalyzer = new SentimentAnalyzer(config);
  }

  /**
   * 全ソースからデータを収集する
   */
  async collect(date: Date): Promise<CollectedData> {
    const allSources: SourceData[] = [];

    // 各ソースからデータを収集
    if (this.config.sources.discord.enabled) {
      const discordData = await this.collectFromSource(SourceType.Discord, date);
      allSources.push(...discordData);
    }

    if (this.config.sources.github.enabled) {
      const githubData = await this.collectFromSource(SourceType.GitHub, date);
      allSources.push(...githubData);
    }

    if (this.config.sources.calendar.enabled) {
      const calendarData = await this.collectFromSource(SourceType.Calendar, date);
      allSources.push(...calendarData);
    }

    if (this.config.sources.obsidian.enabled) {
      const obsidianData = await this.collectFromSource(SourceType.Obsidian, date);
      allSources.push(...obsidianData);
    }

    // データをフィルタリング
    const filteredData = this.filterData(allSources);

    // 重要度をスコアリング
    this.scoreData(filteredData);

    // 重要なイベントを抽出
    const importantEvents = this.extractImportantEvents(filteredData);

    // AIによる感情分析
    const emotions = await this.sentimentAnalyzer.analyzeEmotions(filteredData);

    // コンテキスト生成
    const context = this.generateContext(filteredData, emotions);

    // 秘書としての役割を分析
    const secretaryRole = this.analyzeSecretaryRole(filteredData);

    return {
      date,
      sources: filteredData,
      importantEvents,
      emotions,
      context,
      secretaryRole
    };
  }

  /**
   * 特定のソースからデータを収集する
   */
  private async collectFromSource(type: SourceType, date: Date): Promise<SourceData[]> {
    try {
      const reader = this.readerFactory.createReader(type);
      const data = await reader.read(date);
      this.logger.debug(`${type}から${data.length}件を収集しました`);
      return data;
    } catch (error) {
      this.logger.warn(`${type}からの収集中にエラーが発生しました: ${error}`);
      return [];
    }
  }

  /**
   * データをフィルタリングする
   */
  private filterData(data: SourceData[]): SourceData[] {
    // 重複排除
    const uniqueData = this.removeDuplicates(data);

    // 不要なデータを削除
    return uniqueData.filter(item => {
      if (!item.content || item.content.trim() === '') {
        return false;
      }
      return true;
    });
  }

  /**
   * 重複を削除する
   */
  private removeDuplicates(data: SourceData[]): SourceData[] {
    const seen = new Set<string>();
    return data.filter(item => {
      const key = `${item.type}-${item.timestamp.toISOString()}-${item.content.substring(0, 50)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * データに重要度をスコアリングする
   */
  private scoreData(data: SourceData[]): void {
    data.forEach(item => {
      let score = 0;

      // 長さによるスコア
      score += Math.min(item.content.length / 100, 1) * 20;

      // キーワードによるスコア
      const keywords = this.config.analysis.emotionKeywords;
      Object.values(keywords).flat().forEach(keyword => {
        if (item.content.includes(keyword)) {
          score += 10;
        }
      });

      // 時間によるスコア（新しいほど重要）
      const hoursAgo = (Date.now() - item.timestamp.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 6) {
        score += 30;
      } else if (hoursAgo < 12) {
        score += 20;
      } else if (hoursAgo < 24) {
        score += 10;
      }

      item.importance = Math.min(score, 100);
    });
  }

  /**
   * 重要なイベントを抽出する
   */
  private extractImportantEvents(data: SourceData[]): SourceData[] {
    const threshold = this.config.analysis.importanceThreshold * 100;
    return data
      .filter(item => (item.importance || 0) >= threshold)
      .sort((a, b) => (b.importance || 0) - (a.importance || 0));
  }

  /**
   * 感情を分析する（非推奨：SentimentAnalyzerを使用してください）
   * @deprecated SentimentAnalyzer.analyzeEmotionsを使用してください
   */
  private analyzeEmotions(data: SourceData[]): any {
    const emotionCounts: Record<string, number> = {};
    const timeline: { time: string; emotion: string }[] = [];

    // 各データから感情をカウント
    data.forEach(item => {
      const hour = item.timestamp.getHours().toString().padStart(2, '0');
      const time = `${hour}:00`;

      Object.entries(this.config.analysis.emotionKeywords).forEach(([emotion, keywords]) => {
        const count = keywords.filter(keyword => item.content.includes(keyword)).length;
        if (count > 0) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + count;
          timeline.push({ time, emotion });
        }
      });
    });

    // プライマリ感情を決定
    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      primary: sortedEmotions[0]?.[0] || 'neutral',
      secondary: sortedEmotions[1]?.[0],
      confidence: sortedEmotions[0] ? Math.min(sortedEmotions[0][1] / data.length, 1) : 0,
      timeline
    };
  }

  /**
   * コンテキストを生成する
   */
  private generateContext(data: SourceData[], emotions: any): string {
    const activities = data.map(item => ({
      type: item.type,
      time: item.timestamp.toLocaleTimeString('ja-JP'),
      content: item.content.substring(0, 100)
    }));

    return JSON.stringify({
      activities: activities.slice(0, 20), // 最大20件
      emotions: emotions.primary
    });
  }

  /**
   * 秘書としての活動を抽出する
   */
  extractSecretaryActivities(data: SourceData[]): SourceData[] {
    return data.filter(item => {
      const content = item.content.toLowerCase();
      return this.secretaryKeywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * 秘書としての役割を分析する
   */
  analyzeSecretaryRole(data: SourceData[]): {
    activities: SourceData[];
    categories: Record<string, SourceData[]>;
    summary: string;
  } {
    const secretaryData = this.extractSecretaryActivities(data);
    
    // 活動をカテゴライズ
    const categories: Record<string, SourceData[]> = {
      '会議・調整': [],
      '進捗管理': [],
      '資料作成・報告': [],
      '連絡・対応': [],
      'その他': []
    };

    secretaryData.forEach(item => {
      const content = item.content.toLowerCase();
      
      if (content.includes('会議') || content.includes('調整') || content.includes('コーディネート')) {
        categories['会議・調整'].push(item);
      } else if (content.includes('進捗') || content.includes('タスク') || content.includes('プロジェクト')) {
        categories['進捗管理'].push(item);
      } else if (content.includes('資料') || content.includes('報告') || content.includes('議事録') || content.includes('まとめ')) {
        categories['資料作成・報告'].push(item);
      } else if (content.includes('連絡') || content.includes('確認') || content.includes('対応')) {
        categories['連絡・対応'].push(item);
      } else {
        categories['その他'].push(item);
      }
    });

    // サマリーを生成
    const summary = `秘書としての活動: ${secretaryData.length}件\n` +
      Object.entries(categories)
        .filter(([_, items]) => items.length > 0)
        .map(([name, items]) => `${name}: ${items.length}件`)
        .join(', ');

    return {
      activities: secretaryData,
      categories,
      summary
    };
  }
}
