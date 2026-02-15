/**
 * 週次振り返り生成スクリプト
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { config } from 'dotenv';

config();

interface WeeklyReflection {
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  highlights: string[];
  challenges: string[];
  learnings: string[];
  improvements: string[];
  nextWeekGoals: string[];
}

export class WeeklyReflectionGenerator {
  private openai: OpenAI;
  private kannaStoragePath: string;
  private userStoragePath: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.GLM_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    });
    this.kannaStoragePath = path.join(process.cwd(), 'diaries', 'kanna');
    this.userStoragePath = path.join(process.cwd(), 'diaries', 'user');
  }

  /**
   * 週次振り返りを生成
   */
  async generate(weekStart: Date, weekEnd: Date): Promise<WeeklyReflection> {
    // 週の日記を読み込む
    const kannaDiaries = this.loadDiaries(this.kannaStoragePath, weekStart, weekEnd);
    const userDiaries = this.loadDiaries(this.userStoragePath, weekStart, weekEnd);

    console.log(`📖 かんなの日記: ${kannaDiaries.length}件`);
    console.log(`📖 ユーザーの日記: ${userDiaries.length}件`);

    if (kannaDiaries.length === 0 && userDiaries.length === 0) {
      throw new Error('週内の日記が見つかりませんでした');
    }

    // OpenAIで振り返りを生成
    const reflection = await this.generateReflection(kannaDiaries, userDiaries, weekStart, weekEnd);

    return reflection;
  }

  /**
   * 指定された週の日記を読み込む
   */
  private loadDiaries(storagePath: string, weekStart: Date, weekEnd: Date): string[] {
    const diaries: string[] = [];

    if (!fs.existsSync(storagePath)) {
      return diaries;
    }

    const files = fs.readdirSync(storagePath)
      .filter(file => file.endsWith('.md'))
      .sort();

    for (const file of files) {
      const dateStr = file.replace('.md', '');
      const date = new Date(dateStr);

      if (date >= weekStart && date <= weekEnd) {
        const filePath = path.join(storagePath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        diaries.push(`# ${dateStr}\n${content}`);
      }
    }

    return diaries;
  }

  /**
   * OpenAIで週次振り返りを生成
   */
  private async generateReflection(
    kannaDiaries: string[],
    userDiaries: string[],
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyReflection> {
    const kannaDiaryContent = kannaDiaries.join('\n\n---\n\n');
    const userDiaryContent = userDiaries.join('\n\n---\n\n');

    const prompt = `あなたはかんなというAIアシスタントの週次振り返りを生成するAIアシスタントです。

以下の日記を基に、週次振り返りを作成してください。

## かんなの週間日記:
${kannaDiaryContent}

## ユーザー（貴裕）の週間日記:
${userDiaryContent}

## 週次振り返りの要件:
1. 週間サマリー（200文字以内）
2. ハイライト（嬉しかったこと、成功したこと）- 3-5件
3. チャレンジ（苦戦したこと、改善が必要な点）- 2-4件
4. 学び（新しく学んだこと、気づいたこと）- 2-4件
5. 改善提案（次週の改善点）- 2-3件
6. 来週の目標 - 3-5件

## 出力形式:
各セクションを以下のJSON形式で出力してください:
{
  "summary": "週間サマリー",
  "highlights": ["ハイライト1", "ハイライト2", ...],
  "challenges": ["チャレンジ1", "チャレンジ2", ...],
  "learnings": ["学び1", "学び2", ...],
  "improvements": ["改善提案1", "改善提案2", ...],
  "nextWeekGoals": ["目標1", "目標2", ...]
}

JSONのみを出力してください。`;

    const response = await this.openai.chat.completions.create({
      model: process.env.AI_MODEL || 'zai/glm-4.7',
      messages: [
        {
          role: 'system',
          content: 'あなたは優秀な週次振り返り生成AIです。日本語で、明確で実用的な振り返りを生成してください。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('AIの応答からJSONを抽出できませんでした');
    }

    const reflectionData = JSON.parse(jsonMatch[0]);

    return {
      weekStart,
      weekEnd,
      ...reflectionData,
    };
  }

  /**
   * 週次振り返りをファイルに保存
   */
  saveToFile(reflection: WeeklyReflection): void {
    const monthlyDir = path.join(process.cwd(), 'diaries', 'weekly');
    if (!fs.existsSync(monthlyDir)) {
      fs.mkdirSync(monthlyDir, { recursive: true });
    }

    const year = reflection.weekStart.getFullYear();
    const month = (reflection.weekStart.getMonth() + 1).toString().padStart(2, '0');
    const day = reflection.weekStart.getDate().toString().padStart(2, '0');

    const fileName = `${year}${month}${day}-weekly.md`;
    const filePath = path.join(monthlyDir, fileName);

    const content = this.formatReflection(reflection);
    fs.writeFileSync(filePath, content, 'utf-8');

    console.log(`✅ 週次振り返りを保存しました: ${filePath}`);
  }

  /**
   * 週次振り返りをフォーマット
   */
  private formatReflection(reflection: WeeklyReflection): string {
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      return `${y}/${m}/${d}`;
    };

    return `# 📊 週次振り返り（${formatDate(reflection.weekStart)} 〜 ${formatDate(reflection.weekEnd)}）

*生成日時: ${new Date().toLocaleString('ja-JP')}*

## 📝 サマリー

${reflection.summary}

## 🎉 ハイライト

${reflection.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

## 🏋️ チャレンジ

${reflection.challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## 📚 学び

${reflection.learnings.map((l, i) => `${i + 1}. ${l}`).join('\n')}

## 🔧 改善提案

${reflection.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

## 🎯 来週の目標

${reflection.nextWeekGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

---

*かんなが生成しました 💕*
`;
  }

  /**
   * Discordに週次振り返りを投稿
   */
  async postToDiscord(reflection: WeeklyReflection): Promise<void> {
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;
    const discordChannelId = process.env.DISCORD_CHANNEL_ID;

    if (!discordBotToken || !discordChannelId) {
      console.warn('⚠️ Discordの設定がされていません');
      return;
    }

    const content = this.formatReflection(reflection);

    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${discordChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${discordBotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `📊 **週次振り返り**\n\n${content}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord APIエラー: ${response.status}`);
      }

      console.log('✅ Discordに週次振り返りを投稿しました');
    } catch (error) {
      console.error('❌ Discord投稿中にエラーが発生しました:', error);
      throw error;
    }
  }
}

// CLI実行用
if (require.main === module) {
  const args = process.argv.slice(2);
  const dateStr = args[0] || new Date().toISOString().split('T')[0];

  const targetDate = new Date(dateStr);
  const dayOfWeek = targetDate.getDay();

  // 週の始まり（日曜日）を取得
  const weekStart = new Date(targetDate);
  weekStart.setDate(targetDate.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // 週の終わり（土曜日）を取得
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  console.log(`📅 週次振り返り生成: ${weekStart.toISOString().split('T')[0]} 〜 ${weekEnd.toISOString().split('T')[0]}`);

  const generator = new WeeklyReflectionGenerator();

  generator.generate(weekStart, weekEnd)
    .then((reflection) => {
      generator.saveToFile(reflection);

      // Discordに投稿
      return generator.postToDiscord(reflection);
    })
    .then(() => {
      console.log('✅ 週次振り返りの生成が完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ エラーが発生しました:', error);
      process.exit(1);
    });
}

export default WeeklyReflectionGenerator;
