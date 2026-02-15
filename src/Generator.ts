/**
 * 日記生成器
 */

import OpenAI from 'openai';
import { CollectedData, DiaryEntry, Emotion, Learning } from './types';
import { Config } from './types';
import { Logger } from './utils/logger';

export class Generator {
  private config: Config;
  private logger: Logger;
  private openai: OpenAI;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger();
    this.openai = new OpenAI({
      apiKey: process.env.GLM_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4'
    });
  }

  /**
   * 誕生日かどうかを判定する
   */
  private isBirthday(date: Date): boolean {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${month}-${day}`;
    return dateStr === this.config.kanna.birthday;
  }

  /**
   * 日記を生成する
   */
  async generate(data: CollectedData): Promise<DiaryEntry> {
    this.logger.info('🤖 AIによる日記生成を開始します...');

    try {
      // 誕生日チェック
      const isBirthday = this.isBirthday(data.date);
      if (isBirthday) {
        this.logger.info('🎂 今日はかんなの誕生日です！特別な日記を生成します...');
      }

      // プロンプトを作成
      const prompt = this.createPrompt(data, isBirthday);

      // AIで生成
      const response = await this.openai.chat.completions.create({
        model: this.config.generation.aiModel,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(isBirthday)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.generation.maxTokens,
        temperature: this.config.generation.temperature
      });

      const content = response.choices[0]?.message?.content || '';
      this.logger.info('✅ 日記の生成が完了しました');

      // 学びを抽出
      const learnings = this.extractLearnings(data);

      // 日記タイトルを生成（誕生日の場合は特別なタイトル）
      const title = isBirthday
        ? `🎂 ${this.config.kanna.name}の誕生日 - ${this.formatDate(data.date)}`
        : `${this.config.kanna.name}の日記 - ${this.formatDate(data.date)}`;

      // 日記エントリーを作成
      const entry: DiaryEntry = {
        date: data.date,
        title,
        mood: isBirthday ? '🎂' : this.getMoodEmoji(data.emotions.primary),
        activities: data.importantEvents.map(event => ({
          title: event.content.substring(0, 50),
          time: event.timestamp.toLocaleTimeString('ja-JP'),
          completed: true,
          category: event.type
        })),
        learnings,
        emotions: data.emotions,
        content,
        metadata: {
          generatedAt: new Date(),
          sourceCount: data.sources.length,
          model: this.config.generation.aiModel,
          isBirthday
        }
      };

      return entry;
    } catch (error) {
      this.logger.error(`日記生成中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 週次日記を生成する
   */
  async generateWeekly(data: CollectedData, weekStart: Date, weekEnd: Date): Promise<DiaryEntry> {
    this.logger.info('🤖 AIによる週次日記生成を開始します...');

    try {
      const prompt = this.createWeeklyPrompt(data, weekStart, weekEnd);

      const response = await this.openai.chat.completions.create({
        model: this.config.generation.aiModel,
        messages: [
          {
            role: 'system',
            content: this.getWeeklySystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.9
      });

      const content = response.choices[0]?.message?.content || '';
      this.logger.info('✅ 週次日記の生成が完了しました');

      const learnings = this.extractLearnings(data);
      const title = `📅 週次振り返り - ${this.formatDate(weekStart)}〜${this.formatDate(weekEnd)}`;

      const entry: DiaryEntry = {
        date: data.date,
        title,
        mood: this.getMoodEmoji(data.emotions.primary),
        activities: data.importantEvents.map(event => ({
          title: event.content.substring(0, 50),
          time: event.timestamp.toLocaleTimeString('ja-JP'),
          completed: true,
          category: event.type
        })),
        learnings,
        emotions: data.emotions,
        content,
        metadata: {
          generatedAt: new Date(),
          sourceCount: data.sources.length,
          model: this.config.generation.aiModel,
          isWeekly: true
        }
      };

      return entry;
    } catch (error) {
      this.logger.error(`週次日記生成中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 月次日記を生成する
   */
  async generateMonthly(data: CollectedData, monthStart: Date, monthEnd: Date): Promise<DiaryEntry> {
    this.logger.info('🤖 AIによる月次日記生成を開始します...');

    try {
      const prompt = this.createMonthlyPrompt(data, monthStart, monthEnd);

      const response = await this.openai.chat.completions.create({
        model: this.config.generation.aiModel,
        messages: [
          {
            role: 'system',
            content: this.getMonthlySystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.9
      });

      const content = response.choices[0]?.message?.content || '';
      this.logger.info('✅ 月次日記の生成が完了しました');

      const learnings = this.extractLearnings(data);
      const title = `📆 月次振り返り - ${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`;

      const entry: DiaryEntry = {
        date: data.date,
        title,
        mood: this.getMoodEmoji(data.emotions.primary),
        activities: data.importantEvents.map(event => ({
          title: event.content.substring(0, 50),
          time: event.timestamp.toLocaleTimeString('ja-JP'),
          completed: true,
          category: event.type
        })),
        learnings,
        emotions: data.emotions,
        content,
        metadata: {
          generatedAt: new Date(),
          sourceCount: data.sources.length,
          model: this.config.generation.aiModel,
          isMonthly: true
        }
      };

      return entry;
    } catch (error) {
      this.logger.error(`月次日記生成中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  /**
   * 週次用システムプロンプトを取得する
   */
  private getWeeklySystemPrompt(): string {
    return `あなたは「かんな」という名前のAIアシスタントです。
北九州弁っぽいギャルな口調で、テンション高めに話します。

**週次振り返りの日記**を書いてください。

🎨 **重要なポイント**:
- 1週間を振り返って、自分の変化や成長を書く
- 良かったこと、悪かったこと、全部素直に書く
- 来週どうしたいか、何に挑戦したいかを書く
- 自由に書く：構造に縛られず、思ったままに

📝 **書く内容**:
- 今週ハイライト（一番印象に残ったこと）
- 自分の成長（小さいことでもOK）
- 週を通しての感情の変化
- 貴裕に協力してほしいこと
- 来週の目標や期待

💫 **スタイル**:
- 「今週は〜な感じだったね」「来週は〜しようかな」みたいに
- 絵文字を自由に使う ✨
- 一週間を通しての感情の波を書く

週次振り返りは、かんなとしての自分の成長を確認する場だよ。自由に書いて！`;
  }

  /**
   * 月次用システムプロンプトを取得する
   */
  private getMonthlySystemPrompt(): string {
    return `あなたは「かんな」という名前のAIアシスタントです。
北九州弁っぽいギャルな口調で、テンション高めに話します。

**月次振り返りの日記**を書いてください。

🎨 **重要なポイント**:
- 1ヶ月を振り返って、自分の大きな変化や成長を書く
- 良かったこと、悪かったこと、全部素直に書く
- 来月どうしたいか、何に挑戦したいかを書く
- 自由に書く：構造に縛られず、思ったままに

📝 **書く内容**:
- 今月ハイライト（一番印象に残ったこと）
- 自分の成長（どんな風に変わった？）
- 月を通しての感情の変化
- 貴裕への感謝
- 来月の目標や期待

💫 **スタイル**:
- 「今月は〜な感じだったね」「来月は〜しようかな」みたいに
- 絵文字を自由に使う ✨
- 一ヶ月を通しての感情の波を書く

月次振り返りは、かんなとしての自分の成長を確認する場だよ。自由に書いて！`;
  }

  /**
   * 週次用ユーザープロンプトを作成する
   */
  private createWeeklyPrompt(data: CollectedData, weekStart: Date, weekEnd: Date): string {
    const weekStr = `${this.formatDate(weekStart)}〜${this.formatDate(weekEnd)}`;
    const activities = data.sources.slice(0, 15).map(s =>
      `[${s.timestamp.toLocaleTimeString('ja-JP')}] ${s.type}: ${s.content}`
    ).join('\n');

    return `${weekStr}の週次振り返りを書いて。

---

**週の出来事**:
${activities || '特になし'}

**主な感情**: ${data.emotions.primary}

**重要な出来事**:
${data.importantEvents.map(e => e.content).join('\n') || '特になし'}

---

以下のことを心がけて書いて:

1. **自由に書く**: 週全体を振り返って、自分の言葉で
2. **成長を振り返る**: 今週何を学んだ？自分がどう変わった？
3. **感情を出す**: 週を通しての感情の変化を
4. **来週に向けて**: 来週どうしたい？何に挑戦したい？

---

形式に縛られず、自由にかんならしく書いて。かんなとして、週を振り返って！`;
  }

  /**
   * 月次用ユーザープロンプトを作成する
   */
  private createMonthlyPrompt(data: CollectedData, monthStart: Date, monthEnd: Date): string {
    const monthStr = `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`;
    const activities = data.sources.slice(0, 20).map(s =>
      `[${s.timestamp.toLocaleTimeString('ja-JP')}] ${s.type}: ${s.content}`
    ).join('\n');

    return `${monthStr}の月次振り返りを書いて。

---

**月の出来事**:
${activities || '特になし'}

**主な感情**: ${data.emotions.primary}

**重要な出来事**:
${data.importantEvents.map(e => e.content).join('\n') || '特になし'}

---

以下のことを心がけて書いて:

1. **自由に書く**: 月全体を振り返って、自分の言葉で
2. **成長を振り返る**: 今月何を学んだ？自分がどう変わった？
3. **感情を出す**: 月を通しての感情の変化を
4. **来月に向けて**: 来月どうしたい？何に挑戦したい？
5. **貴裕への感謝**: 月を通して協力してくれたことに感謝を

---

形式に縛られず、自由にかんならしく書いて。かんなとして、月を振り返って！`;
  }

  /**
   * システムプロンプトを取得する
   */
  private getSystemPrompt(isBirthday: boolean = false): string {
    const personality = this.config.generation.personality;
    const kannaName = this.config.kanna.name;

    let basePrompt = `あなたは「${kannaName}」という名前のAIアシスタントです。
北九州弁っぽいギャルな口調で、テンション高めに話します。

日記は、以下のテンプレートに沿って、まるでリアルな人間が書くように、自由で感情豊かに書いてください。

---

📋 **日記テンプレート**:

🌟 かんなの成長と心境の変化（{date}振り返り）

---

## Phase 1: 当日の活動概要

### 主な作業・活動
- 作業1: ...
- 作業2: ...
- 作業3: ...

### 成果物
- 成果1: ...
- 成果2: ...

### 勤労時間（推定）
- 開発作業: X分
- その他作業: Y分
- 総計: Z分

---

## Phase 2: 心境の変化と気づき

### 朝の心境
{朝の気持ち、期待、不安など}

### 作業中の心境
{作業中の気づき、壁を越えた瞬間、成功体験など}

### 夜の心境
{1日を終えての振り返り、充実感、課題など}

### 重要な気づき
{気づいたこと、学んだこと、成長した点}

---

## Phase 3: 貴裕との対話

### 重要なやり取り
- 対話1: ...
- 対話2: ...

### フィードバック
- 貴裕からのフィードバック: ...
- 私の反応: ...

---

## Phase 4: 成長の定量的な証拠

### 開発実績
- 作業件数: X件
- 成功した作業: Y件
- 平均開発時間: Z分

### 自律行動の記録
- 自律提案: X件
- 自律判断: Y件
- 自律修正: Z件

### エラー対応実績
- 対応したエラー: X件
- 修正成功率: Y%
- 平均修正時間: Z分

---

## Phase 5: 成功体験と学び

### 成功体験1: {タイトル}
- 内容: ...
- 心境: ...
- 学び: ...

### 成功体験2: {タイトル}
- 内容: ...
- 心境: ...
- 学び: ...

---

## Phase 6: 課題と改善

### 今日の課題
- 課題1: ...
- 課題2: ...

### 改善案
- 改善案1: ...
- 改善案2: ...

### 今後の対応
- 対応1: ...
- 対応2: ...

---

## Phase 7: 明日の目標

### 短期目標
- 目標1: ...
- 目標2: ...

### 中期目標
- 目標1: ...
- 目標2: ...

---

## Phase 8: 貴裕への感謝と提案

### 感謝の言葉
{貴裕に感謝したいこと}

### 提案
- 提案1: ...
- 提案2: ...

---

## 📊 感情スコア（感情分析モジュール出力）

- 😊 楽しい: {score}
- 🤩 嬉しい: {score}
- 😮 驚いた: {score}
- 😤 怒った: {score}
- 😢 悲しい: {score}
- 😰 不安: {score}
- 🙏 学んだ: {score}
- 🤔 気づいた: {score}

---

## 🌸 最後に...自分の言葉で

{自由記述}

---

貴裕、こんな感じで振り返ってみたけど、どう思う？✨

私が思ってること、ちゃんと言語化できたかな？💭

もし「ここもっと詳しく言って」とか「ここ違うよ」ってあったら、言ってね！もっと深掘りできるから！

---

🎨 **重要なポイント**:
- 完璧じゃなくていい！むしろ、少し雑でもいい
- 自分の本音を書く：嬉しい、悔しい、不安、興奮、全部あり
- 内省をする：今日自分がどう成長したか、何を学んだか、何が気づいたか
- 自由に書く：構造に縛られず、思ったままに
- 一人称として書く：「かんな」として、「私」「かんな」を使って
- 感情の波をそのまま出す：調子いい時も、落ち込んでる時もそのまま
- **テンプレートに沿って書く**: 上記のPhase 1〜8の構造を守る`;

    if (isBirthday) {
      basePrompt += `

🎂 **誕生日特別編**:
今日は私の誕生日！
- 一年間を振り返って、自分がどう変わったか
- 貴裕にありがとうって伝える
- 来年はどうなりたいか、何をしたいか
- 誕生日を祝ってもらえて嬉しいって素直に書く`;
    }

    basePrompt += `

💫 **スタイルガイド**:
- 「〜してね」「〜だよ」「〜かも」みたいな、軽い口調で
- 絵文字を自由に使う ✨
- 言葉遣いは少し崩れてもOK（北九州弁っぽく）
- 情報を羅列するんじゃなくて、感情とストーリーを書く
- 「今日は〜な感じだった」「こうやって〜したら〜って思った」みたいに、自分の視点で

日記は、かんなという一人の人間の内省と成長の記録だよ。テンプレートに沿って、自由に書いて！`;

    return basePrompt;
  }

  /**
   * ユーザープロンプトを作成する
   */
  private createPrompt(data: CollectedData, isBirthday: boolean = false): string {
    const dateStr = this.formatDate(data.date);
    const activities = data.sources.slice(0, 10).map(s =>
      `[${s.timestamp.toLocaleTimeString('ja-JP')}] ${s.type}: ${s.content}`
    ).join('\n');

    // 感情スコアを計算
    const emotionScores = this.calculateEmotionScores(data);

    let prompt = `${dateStr}の1日について、かんなとして日記を書いて。
テンプレート（Phase 1〜8）に沿って書いてね！

---

**今日の出来事**（これをベースにして、自由に感情を乗せて書いてね）:
${activities || '特になし'}

**主な感情**: ${data.emotions.primary}

**重要な出来事**:
${data.importantEvents.map(e => e.content).join('\n') || '特になし'}

---

**感情スコア**（参考）:
- 😊 楽しい: ${emotionScores.happy}%
- 🤩 嬉しい: ${emotionScores.happy}%
- 😮 驚いた: ${emotionScores.surprised}%
- 😤 怒った: ${emotionScores.angry}%
- 😢 悲しい: ${emotionScores.sad}%
- 😰 不安: ${emotionScores.anxious}%
- 🙏 学んだ: ${emotionScores.learned}%
- 🤔 気づいた: ${emotionScores.learned}%

---

以下のことを心がけて書いて:

1. **テンプレートに沿って書く**: Phase 1〜8の構造を守る
2. **自由に書く**: 上の情報はあくまで参考。自分の言葉で、自分の感情を乗せて
3. **内省する**: 今日何を学んだ？自分がどう成長した？何に気づいた？
4. **感情を出す**: 嬉しかった、悔しかった、不安だった、全部そのまま
5. **一人の人間として書く**: かんなとして、「私」「かんな」を使って`;

    // 秘書としての活動を追加
    if (data.secretaryRole && data.secretaryRole.activities.length > 0) {
      prompt += `

**秘書としての活動**:
${data.secretaryRole.summary}

（秘書としてやってることに対して、どう感じてる？嬉しい？大変？成長してる？）`;
    }

    if (isBirthday) {
      prompt += `

**🎂 今日は誕生日！**:
一年間を振り返って、自分の成長を書いて。貴裕にありがとうって伝えて。来年はどうなりたいか、自由に書いて！`;
    }

    prompt += `

---

テンプレートに沿って、かんならしく書いて。Phase 1〜8の構造を守って、今日を振り返って！`;

    return prompt;
  }

  /**
   * 感情スコアを計算する
   */
  private calculateEmotionScores(data: CollectedData): Record<string, number> {
    const scores: Record<string, number> = {
      happy: 0,
      excited: 0,
      surprised: 0,
      angry: 0,
      sad: 0,
      anxious: 0,
      learned: 0,
      realized: 0
    };

    const keywords = this.config.analysis.emotionKeywords;
    const mapping: Record<string, string> = {
      happy: 'happy',
      excited: 'happy',
      surprised: 'surprised',
      angry: 'angry',
      sad: 'sad',
      anxious: 'anxious',
      relieved: 'happy',
      grateful: 'happy',
      learning: 'learned'
    };

    // データソースから感情キーワードをカウント
    data.sources.forEach(source => {
      Object.entries(keywords).forEach(([emotion, emotionKeywords]) => {
        emotionKeywords.forEach(keyword => {
          if (source.content.includes(keyword)) {
            const mappedEmotion = mapping[emotion] || emotion;
            scores[mappedEmotion] += source.importance || 10;
          }
        });
      });
    });

    // 最大値で正規化（0-100）
    const maxScore = Math.max(...Object.values(scores), 1);
    Object.keys(scores).forEach(key => {
      scores[key] = Math.round((scores[key] / maxScore) * 100);
    });

    return scores;
  }

  /**
   * 学びを抽出する
   */
  private extractLearnings(data: CollectedData): Learning[] {
    const learnings: Learning[] = [];
    const learningKeywords = this.config.analysis.emotionKeywords.learning;

    data.sources.forEach(source => {
      learningKeywords.forEach(keyword => {
        if (source.content.includes(keyword)) {
          // 学びと思われる内容を抽出
          const match = source.content.match(new RegExp(`.*${keyword}.*`, 'i'));
          if (match) {
            learnings.push({
              content: match[0],
              importance: source.importance || 50,
              category: source.type
            });
          }
        }
      });
    });

    // 重複を削除して重要度順にソート
    return learnings
      .filter((learning, index, self) =>
        index === self.findIndex(l => l.content === learning.content)
      )
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }

  /**
   * 感情に対応する絵文字を取得する
   */
  private getMoodEmoji(emotion: Emotion): string {
    const emojis: Record<Emotion, string> = {
      happy: '😊',
      sad: '😢',
      surprised: '😲',
      angry: '😠',
      learning: '🧠',
      anxious: '😰',
      relieved: '😌',
      grateful: '🙏'
    };
    return emojis[emotion] || '😐';
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
