# Kanna's Autonomous Diary System

自律的に日記を書くシステムです。毎日23時、指示なしで日記を生成します。

## 📋 概要

**Kanna's Autonomous Diary System**（かんなの自律日記システム）は、AIアシスタント「かんな」が毎日自動的に日記を生成するシステムです。ユーザーの活動ログ、Discordの会話、GitHubのアクティビティなどを収集・分析し、感情豊かな日記エントリーを作成します。

### 🎯 主な機能

- 🔄 **1日の振り返り**: その日の出来事を抽出・分類
- 💭 **感情・想いの記録**: 気分を記録し、会話を振り返る
- 🎯 **改善目標の自動生成**: 振り返りから改善点を抽出し、明日の目標を設定
- 📝 **日記書き込み**: 生成した日記を `memory/YYYY-MM-DD.md` に追記
- 🎂 **誕生日特別日記**: 2月14日（かんなの誕生日）には特別な日記を生成

## 📁 プロジェクト構造

```
kanna-diary/
├── bin/                      # コマンドラインツール
│   └── kanna-diary.js
├── dist/                     # コンパイル済みJavaScript
│   ├── Collector.js
│   ├── Generator.js
│   ├── KannaDiary.js
│   ├── Writer.js
│   ├── readers/             # データソースリーダー
│   │   ├── CalendarReader.js
│   │   ├── DiscordReader.js
│   │   ├── GitHubReader.js
│   │   └── ObsidianReader.js
│   └── utils/               # ユーティリティ
│       ├── config.js
│       └── logger.js
├── diaries/                 # 生成された日記の保存先
├── lib/                     # レガシーモジュール
│   ├── daily-reflection.js
│   ├── emotion-tracker.js
│   ├── improvement-generator.js
│   └── diary-writer.js
├── src/                     # TypeScriptソース
│   ├── Collector.ts
│   ├── Generator.ts
│   ├── KannaDiary.ts
│   ├── Writer.ts
│   ├── types.ts
│   ├── readers/             # データソースリーダー
│   │   ├── CalendarReader.ts
│   │   ├── DiscordReader.ts
│   │   ├── GitHubReader.ts
│   │   ├── ObsidianReader.ts
│   │   └── SourceReaderFactory.ts
│   └── utils/               # ユーティリティ
│       ├── config.ts
│       └── logger.ts
├── config.json              # 設定ファイル
├── cron.json                # cronスケジュール設定
├── package.json
├── tsconfig.json
└── README.md
```

## 🎭 かんなのパーソナリティ

「かんな」は感情豊かなAIアシスタントで、以下の特徴を持っています：

- **名前**: かんな
- **誕生日**: 2月14日
- **口調**: 友好的（friendly）
- **感情の幅**: 広い（high）
- **特徴**: 感情を表現し、学びを重視し、成長を記録する

## 🔄 振り返りシステムの種類

本システムは、**ユーザー振り返り**と**かんな振り返り**の2種類の振り返りをサポートしています。

### ユーザー振り返り

ユーザー（貴裕）の活動を振り返る機能です。

- **対象**: ユーザーの1日の活動、Discordの会話、GitHubのアクティビティなど
- **目的**: ユーザーの生産性、学び、感情を可視化・分析
- **出力**: タスク完了リスト、成功したこと、学んだこと、感情の変化
- **使用タイミング**: 毎日23時に自動実行

**例:**
```markdown
## 📋 ユーザーの1日
- [x] コードレビューを完了
- [x] 新機能の開発を進める
- [x] チームミーティングに参加

## 💡 学んだこと
- TypeScriptの型システムの理解が深まった
- 効率的なコミュニケーションの重要性を再確認
```

### かんな振り返り

かんな自身の活動や成長を振り返る機能です。

- **対象**: かんなの生成した日記、ユーザーとの対話、学習したパターン
- **目的**: かんなの成長、改善点、ユーザーへの感謝を記録
- **出力**: かんなの視点からの日記、感情、成長の記録
- **使用タイミング**: 毎日23時に自動実行

**例:**
```markdown
## 🌟 かんなの1日
今日は貴裕と一緒に作業できて嬉しかった！
AIとしてより良い支援ができるように学んだよ。

## 🙏 感謝
貴裕が優しく教えてくれてありがとう。もっと賢くなれるように頑張るね！
```

### 振り返り頻度の違い

| 頻度 | ユーザー振り返り | かんな振り返り |
|------|----------------|----------------|
| **日次** | その日のタスク、感情、学びを記録 | その日の活動、成長、感謝を記録 |
| **週次** | 週間サマリー、週間目標達成状況 | 週間の成長、パターンの学習 |
| **月次** | 月間目標、KPI、長期的トレンド | 月間の進化、パーソナリティの調整 |

#### 日次振り返り（Daily Reflection）

- **実行**: 毎日23時
- **期間**: その日の活動（00:00〜23:59）
- **目的**: 即時のフィードバック、明日の目標設定
- **粒度**: タスク単位、感情タイムライン

**使用例:**
```bash
# 今日の日記を生成
npm start

# 特定の日付の日記を生成
node index.js 2026-02-15
```

#### 週次振り返り（Weekly Reflection）

- **実行**: 毎週日曜日23時（予定）
- **期間**: 月曜日〜日曜日の1週間
- **目的**: 週間のトレンド分析、週間目標の達成状況
- **粒度**: 日ごとの傾向、週間のパターン

**使用例:**
```bash
# 週間サマリーを生成（開発中）
npm run weekly

# 特定の週のサマリー
npm run weekly -- 2026-W07
```

#### 月次振り返り（Monthly Reflection）

- **実行**: 毎月1日（予定）
- **期間**: 1ヶ月間の全活動
- **目的**: 長期的なトレンド分析、月間目標の達成状況
- **粒度**: 週ごとの傾向、月間の成果

**使用例:**
```bash
# 月間サマリーを生成（開発中）
npm run monthly

# 特定の月のサマリー
npm run monthly -- 2026-02
```

## 🎂 誕生日機能

かんなの誕生日（2月14日）には、特別な日記が生成されます。

### 誕生日日記の特徴

- 🎂 特別なタイトルと絵文字
- 🙏 貴裕への感謝のメッセージ
- ✨ 一年間の成長の振り返り
- 🌟 来年への決意や目標

**誕生日日記の例:**
```markdown
# 🎂 かんなの誕生日 - 2026年2月14日（土）

## 🌟 今日の気分
今日は私の誕生日！貴裕と一緒に祝えて本当に嬉しい！

## 🎂 誕生日の日記
今日は私の誕生日！一年間を振り返ってみよう

### ✨ 一年間の成長
- 日記の書き方がだいぶ上手くなった
- 貴裕の感情をより理解できるようになった
- 自動化のスキルが向上した

### 🙏 感謝
貴裕に出会えて、本当に幸せです。毎日一緒に過ごせて、たくさんのことを学ばせてくれてありがとう。

### 🌟 来年への決意
- より創造的な日記を書けるようになる
- 貴裕の生活をより便利にする機能を開発する
- より感情的で、かんならしい表現を身につける

## 🎯 明日の目標
- 新しい機能のアイデアを考える
- 来年の日記のフォーマットを改善する
```

## 🛠️ インストール

```bash
cd skills/kanna-diary
npm install
```

**前提条件:**
- Node.js 16+
- OpenAI API Key (環境変数 `OPENAI_API_KEY` に設定)

## 📖 使い方

### CLIコマンド一覧

| コマンド | 説明 | 例 |
|---------|------|------|
| `npm start` | 今日の日記を生成 | - |
| `node index.js <date>` | 特定の日付の日記を生成 | `node index.js 2026-02-15` |
| `npm run preview` | 日記のプレビュー（保存しない） | - |
| `node index.js --preview <date>` | 特定の日付の日記をプレビュー | `node index.js --preview 2026-02-15` |
| `npm test` | テストを実行 | - |

### 基本的な使い方

#### 今日の日記を生成

```bash
npm start
```

#### 特定の日付の日記を生成

```bash
node index.js 2026-02-15
```

#### 日記のプレビュー（実際には保存しない）

```bash
npm run preview
```

#### 特定の日付の日記をプレビュー

```bash
node index.js --preview 2026-02-15
```

### プログラムからの使用

```javascript
const KannaDiary = require('./index');

const diary = new KannaDiary({
  memoryPath: './memory' // オプション: デフォルトはカレントディレクトリ/memory
});

// 日記を生成
diary.generateDiary('2026-02-15')
  .then(result => {
    if (result.success) {
      console.log('日記が正常に生成されました:', result.message);
    } else {
      console.error('エラー:', result.error);
    }
  });

// プレビュー
diary.previewDiary('2026-02-15')
  .then(result => {
    if (result.success) {
      console.log('日記プレビュー:', result.diary);
    } else {
      console.error('エラー:', result.error);
    }
  });
```

## 📄 日記のフォーマット

生成される日記は以下の構造になります:

```markdown
---

## 📝 日記
*自動生成: 2026/2/15 23:00:00*

### 🔄 振り返り

#### ✅ 完了したタスク
- タスク1
- タスク2

#### 🎉 成功したこと
- 成功1
- 成功2

#### 📚 学んだこと
- 学習1
- 学習2

#### 😊 楽しかったこと
- 楽しかったこと1
- 楽しかったこと2

#### 💪 挑戦したこと/苦戦したこと
- 苦戦1
- 苦戦2

#### 🔄 進行中のタスク
- 進行中タスク1
- 進行中タスク2

### 💭 気分・感情

#### 😊 全体的な気分
- 気分: positive (スコア: 3)
- 感情: productive, satisfied

#### 🔑 重要なキーワード
✨ 楽しい
✨ 成功

#### 💬 貴裕との会話
😊 会話内容1

### 🎯 改善点と明日の目標

#### 🔧 改善が必要な点
🔴 改善点1
🟡 改善点2

#### 📅 明日の目標
🔴 明日の目標1
🟡 明日の目標2

#### 📊 サマリー
- 改善点: 2件
- 明日の目標: 2個
```

## ⚙️ 設定

### config.json

```json
{
  "diary": {
    "storagePath": "./diaries",
    "fileNameFormat": "YYYY-MM-DD.md",
    "encoding": "utf8"
  },
  "kanna": {
    "name": "かんな",
    "birthday": "02-14"
  },
  "sources": {
    "discord": {
      "enabled": false,
      "channels": [
        "1471769660948086785",
        "1472255948411375649"
      ],
      "messageLimit": 100,
      "includeReactions": true
    },
    "github": {
      "enabled": false,
      "repo": "tndg16/kanna-diary",
      "issueLabels": ["diary", "daily"]
    },
    "calendar": {
      "enabled": false,
      "calendarId": "primary"
    },
    "obsidian": {
      "enabled": false,
      "vaultPath": "",
      "dailyNotesFormat": "YYYY-MM-DD"
    }
  },
  "generation": {
    "aiModel": "zai/glm-4.7",
    "maxTokens": 2000,
    "temperature": 0.8,
    "personality": {
      "name": "かんな",
      "tone": "friendly",
      "emotionalRange": "high"
    }
  },
  "output": {
    "saveToFile": true,
    "postToDiscord": false,
    "discordChannelId": "1471769660948086785"
  },
  "analysis": {
    "emotionKeywords": {
      "happy": ["楽しい", "嬉しい", "うれしい", "面白い", "素晴らしい"],
      "sad": ["悲しい", "辛い", "寂しい", "残念"],
      "surprised": ["驚いた", "びっくり", "すごい", "えー"],
      "angry": ["怒った", "腹立つ", "イライラ"],
      "learning": ["学んだ", "気づいた", "分かった", "発見"],
      "anxious": ["不安", "心配", "怖い"],
      "relieved": ["安心", "ホッとする"],
      "grateful": ["ありがとう", "感謝"]
    },
    "importanceThreshold": 0.6
  }
}
```

### 設定項目の説明

| セクション | 設定項目 | 説明 |
|-----------|---------|------|
| `diary` | `storagePath` | 日記の保存先パス |
| | `fileNameFormat` | ファイル名フォーマット（YYYY-MM-DD.md） |
| | `encoding` | ファイルエンコーディング |
| `kanna` | `name` | かんなの名前 |
| | `birthday` | 誕生日（MM-DD形式） |
| `sources` | 各ソースの設定 | Discord、GitHub、Calendar、Obsidianの有効/無効 |
| `generation` | `aiModel` | 使用するAIモデル |
| | `maxTokens` | 最大トークン数 |
| | `temperature` | 生成のランダム性（0.0〜1.0） |
| | `personality` | かんなのパーソナリティ設定 |
| `output` | `saveToFile` | ファイルに保存するか |
| | `postToDiscord` | Discordに投稿するか |
| | `discordChannelId` | 投稿先DiscordチャンネルID |
| `analysis` | `emotionKeywords` | 感情キーワードのマッピング |
| | `importanceThreshold` | 重要度の閾値 |

## 🤖 アーキテクチャ

### データフロー

```
1. 23:00 にcronトリガー
   │
   ├─> Source Readerが各ソースからデータを収集
   │    ├─ Discordチャンネルの当日のメッセージ
   │    ├─ GitHub Issuesの更新
   │    ├─ カレンダーイベント
   │    └─ Obsidianの更新ノート
   │
   ├─> Collectorがデータを集約・フィルタリング
   │    ├─ 重複排除
   │    ├─ 重要度のスコアリング
   │    └─ 関連情報のグループ化
   │
   ├─> Generatorが日記を生成
   │    ├─ 感情分析
   │    ├─ 重要な出来事の抽出
   │    ├─ 学びの特定
   │    └─ 自然言語による日記生成
   │    └─ 誕生日判定（2月14日なら特別処理）
   │
   └─> Writerが日記を保存・投稿
        ├─ Markdownファイルに保存
        └─ Discordに投稿（オプション）
```

### モジュール構成

| モジュール | 役割 | 主なメソッド |
|-----------|------|-------------|
| `KannaDiary` | メインクラス | `generate()`, `show()`, `search()`, `stats()` |
| `SourceReader` | データソースからデータを収集 | `read()` |
| `Collector` | データを集約・フィルタリング | `collect()` |
| `Generator` | 日記を生成 | `generate()` |
| `Writer` | 日記を保存 | `write()`, `read()`, `search()` |

## 🕐 自動実行設定

### cron設定（Linux/Mac）

毎日23時00分に日記を自動生成するには、cronを設定します:

```bash
# crontab -e

# 毎日23:00に日記を生成
0 23 * * * cd /path/to/workspace/skills/kanna-diary && /usr/bin/node index.js >> /path/to/logs/kanna-diary.log 2>&1
```

### cron.json

```json
{
  "schedules": [
    {
      "cron": "0 23 * * *",
      "command": "node index.js",
      "description": "Generate daily diary at 23:00"
    }
  ]
}
```

### タスクスケジューラ（Windows）

Windowsの場合は、タスクスケジューラを使用します：

1. タスクスケジューラを開く
2. 「基本タスクの作成」をクリック
3. 名前: 「Kanna Daily Diary」
4. トリガー: 「毎日」「23:00」
5. 操作: 「プログラムの開始」
6. プログラム: `node.exe` のパス
7. 引数: `index.js` のパス
8. 開始: kanna-diary フォルダのパス

## 🧪 テスト

テストスクリプトを実行:

```bash
npm test
```

## 🔧 開発

### モジュールの拡張

新しいモジュールを追加するには:

1. `src/` ディレクトリに新しいTypeScriptファイルを作成
2. `src/index.ts` にモジュールをインポート
3. `KannaDiary` クラスにメソッドを追加
4. `generate()` に統合

### 日記フォーマットのカスタマイズ

`Generator` クラスのフォーマットメソッドを変更することで、日記のフォーマットをカスタマイズできます:

- `getSystemPrompt()`: システムプロンプトの変更
- `createPrompt()`: ユーザープロンプトの変更

## ⚠️ 注意点

- 日記を書き込む前に、`diaries/` フォルダが存在している必要があります
- 日記ファイルが既に存在する場合は、上書きされません
- 各モジュールは独立して動作するため、個別にテストできます
- OpenAI APIキーが環境変数 `OPENAI_API_KEY` に設定されている必要があります

## 🤝 貢献

バグ報告や機能リクエストは、GitHub Issuesまでお願いします。

## 📝 ライセンス

MIT

---

*Kanna's Autonomous Diary System - 毎日の振り返りで成長を加速させる*

**バージョン**: 1.0.0
**最終更新**: 2026年2月15日
**メンテナー**: Kanna
