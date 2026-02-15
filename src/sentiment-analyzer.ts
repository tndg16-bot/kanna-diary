/**
 * AI-based Sentiment Analyzer
 * GLM4.7 APIを使用した感情分析
 */

import OpenAI from 'openai';
import { Config, SourceData, EmotionAnalysis, Emotion } from './types';
import { Logger } from './utils/logger';

export class SentimentAnalyzer {
  private config: Config;
  private logger: Logger;
  private openai: OpenAI;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_BASE_URL
    });
  }

  /**
   * 収集データから感情を分析する
   */
  async analyzeEmotions(data: SourceData[]): Promise<EmotionAnalysis> {
    if (data.length === 0) {
      this.logger.warn('分析対象データがありません');
      return this.createNeutralAnalysis();
    }

    this.logger.info(`🧠 AIによる感情分析を開始します... (${data.length}件)`);

    try {
      // 重要度の高いデータを抽出（最大20件）
      const relevantData = data
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, 20);

      // データをテキスト化
      const content = relevantData.map(item =>
        `[${item.timestamp.toLocaleTimeString('ja-JP')}] ${item.type}: ${item.content}`
      ).join('\n');

      // AIで感情を分析
      const analysis = await this.analyzeWithAI(content);

      this.logger.info(`✅ 感情分析が完了しました: ${analysis.primary} (信頼度: ${Math.round(analysis.confidence * 100)}%)`);

      return analysis;
    } catch (error) {
      this.logger.error(`AI感情分析中にエラーが発生しました: ${error}`);
      this.logger.warn('ルールベースのフォールバックを使用します');
      // フォールバック：ルールベース分析
      return this.analyzeWithFallback(data);
    }
  }

  /**
   * GLM4.7 APIを使用した感情分析
   */
  private async analyzeWithAI(content: string): Promise<EmotionAnalysis> {
    const prompt = `以下の1日の活動データを分析して、感情の傾向を判断してください。

活動データ:
${content}

以下のJSON形式で回答してください：
{
  "primary": "主要な感情（happy, sad, surprised, angry, learning, anxious, relieved, gratefulのいずれか）",
  "secondary": "副次的な感情（オプション）",
  "confidence": 0.0から1.0の信頼度スコア",
  "timeline": [
    {"time": "時刻", "emotion": "感情"},
    ...
  ],
  "explanation": "分析の理由と根拠（簡単な説明）"
}

感情カテゴリの定義:
- happy: 喜び、楽しみ、ポジティブな感情
- sad: 悲しみ、辛さ、ネガティブな感情
- surprised: 驚き、予想外の出来事
- angry: 怒り、不満、イライラ
- learning: 学習、発見、成長、気づき
- anxious: 不安、心配、緊張
- relieved: 安心、ホッとした、緊張の緩和
- grateful: 感謝、ありがとう、ありがたい`;

    const response = await this.openai.chat.completions.create({
      model: process.env.AI_MODEL || 'zai/glm-4.7',
      messages: [
        {
          role: 'system',
          content: 'あなたは感情分析の専門家です。与えられたテキストから感情を正確に分析し、JSON形式で返してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const content2 = response.choices[0]?.message?.content || '';

    try {
      // JSONをパース
      const aiResponse = JSON.parse(content2);

      // タイムラインを生成（元データに基づく）
      const timeline = this.generateTimelineFromAI(aiResponse);

      return {
        primary: this.validateEmotion(aiResponse.primary),
        secondary: aiResponse.secondary ? this.validateEmotion(aiResponse.secondary) : undefined,
        confidence: Math.min(Math.max(aiResponse.confidence || 0.5, 0), 1),
        timeline
      } as EmotionAnalysis;
    } catch (parseError) {
      this.logger.warn(`AIレスポンスのJSONパースに失敗: ${parseError}`);
      throw parseError;
    }
  }

  /**
   * フォールバック：ルールベースの感情分析
   */
  private analyzeWithFallback(data: SourceData[]): EmotionAnalysis {
    this.logger.info('ルールベースの感情分析を使用します');

    const emotionCounts: Record<string, number> = {};
    const timeline: { time: string; emotion: Emotion }[] = [];

    data.forEach(item => {
      const hour = item.timestamp.getHours().toString().padStart(2, '0');
      const time = `${hour}:00`;

      Object.entries(this.config.analysis.emotionKeywords).forEach(([emotion, keywords]) => {
        const count = keywords.filter(keyword => item.content.includes(keyword)).length;
        if (count > 0) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + count;
          timeline.push({ time, emotion: emotion as Emotion });
        }
      });
    });

    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      primary: this.validateEmotion(sortedEmotions[0]?.[0] || 'neutral'),
      secondary: sortedEmotions[1]?.[0] ? this.validateEmotion(sortedEmotions[1][0]) : undefined,
      confidence: sortedEmotions[0] ? Math.min(sortedEmotions[0][1] / data.length, 1) : 0.5,
      timeline
    };
  }

  /**
   * 感情タイプの検証
   */
  private validateEmotion(emotion: string): Emotion {
    const validEmotions: Emotion[] = [
      'happy', 'sad', 'surprised', 'angry',
      'learning', 'anxious', 'relieved', 'grateful'
    ];

    if (validEmotions.includes(emotion as Emotion)) {
      return emotion as Emotion;
    }

    // マッピング：不正な感情タイプを近いタイプにマップ
    const mapping: Record<string, Emotion> = {
      'neutral': 'learning',
      'joy': 'happy',
      'fun': 'happy',
      'fear': 'anxious',
      'calm': 'relieved',
      'thanks': 'grateful'
    };

    return mapping[emotion.toLowerCase()] || 'learning';
  }

  /**
   * AIレスポンスからタイムラインを生成
   */
  private generateTimelineFromAI(aiResponse: any): { time: string; emotion: Emotion }[] {
    if (aiResponse.timeline && Array.isArray(aiResponse.timeline)) {
      return aiResponse.timeline.map((item: any) => ({
        time: item.time || '00:00',
        emotion: this.validateEmotion(item.emotion)
      })) as { time: string; emotion: Emotion }[];
    }

    // タイムラインがない場合はプライマリ感情のみ
    return [] as { time: string; emotion: Emotion }[];
  }

  /**
   * 中立の分析結果を作成
   */
  private createNeutralAnalysis(): EmotionAnalysis {
    return {
      primary: 'learning',
      confidence: 0.3,
      timeline: []
    };
  }

  /**
   * 感情スコアを計算（-1.0 〜 1.0）
   */
  calculateEmotionScore(analysis: EmotionAnalysis): number {
    const emotionScores: Record<Emotion, number> = {
      happy: 0.8,
      grateful: 0.7,
      relieved: 0.5,
      learning: 0.3,
      surprised: 0.1,
      anxious: -0.3,
      angry: -0.6,
      sad: -0.8
    };

    const primaryScore = emotionScores[analysis.primary] || 0;
    const secondaryScore = analysis.secondary
      ? emotionScores[analysis.secondary] || 0
      : 0;

    // 信頼度を考慮
    const weightedScore = (primaryScore * 0.7 + secondaryScore * 0.3) * analysis.confidence;

    // スコアを-1.0〜1.0にクランプ
    return Math.min(Math.max(weightedScore, -1.0), 1.0);
  }

  /**
   * 感情カテゴリを分類
   */
  categorizeEmotion(analysis: EmotionAnalysis): string {
    const categories: Record<Emotion, string> = {
      happy: '喜び',
      sad: '悲しみ',
      surprised: '興奮',
      angry: 'イライラ',
      learning: '学び',
      anxious: '不安',
      relieved: '安らぎ',
      grateful: '感謝'
    };

    return categories[analysis.primary] || '中立';
  }
}
