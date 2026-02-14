# タスク2 & タスク5 実装ドキュメント

## 実装概要

### タスク2: GitHub API連携 - Issues/PR収集機能

#### 実装内容
- `src/readers/GitHubReader.ts` の完全実装
- GitHub API (Octokit) の使用
- Issues/PR収集メソッド: `read(date: Date)`
- `SourceReader` インターフェースの実装

#### 主な機能
1. **Issues収集**
   - 指定したリポジトリからIssuesを収集
   - 更新日時でフィルタリング（当日のみ）
   - コメントも含めて収集

2. **Pull Requests収集**
   - 指定したリポジトリからPRsを収集
   - 更新日時でフィルタリング（当日のみ）
   - コメントとレビューコメントを取得

3. **複数リポジトリ対応**
   - 複数のリポジトリから一括収集可能
   - 設定ファイルでリポジトリを指定

#### 設定例
```json
{
  "sources": {
    "github": {
      "enabled": true,
      "repos": [
        "tndg16-bot/automation-skills",
        "tndg16-bot/xboost"
      ],
      "issueLabels": ["diary", "daily"]
    }
  }
}
```

#### GitHub API認証
- 環境変数 `GITHUB_TOKEN` または `GH_TOKEN` を使用
- GitHub CLI認証もサポート（keyring経由）

#### 収集データ構造
```typescript
{
  type: 'github',
  timestamp: Date,
  content: 'Issue #123: タイトル',
  metadata: {
    repo: 'owner/repo',
    issueNumber: 123,
    type: 'issue' | 'pull_request',
    state: 'open' | 'closed',
    url: 'https://github.com/...',
    body: 'Issueの本文',
    comments: [...],      // コメント配列
    reviewComments: [...] // PRレビューコメント（PRのみ）
  },
  importance: number
}
```

---

### タスク5: Collector実装 - データ集約・フィルタリング

#### 実装内容
- `src/Collector.ts` の完全実装
- パブリックメソッドの追加:
  - `collect(date: Date)`: Promise<CollectedData>
  - `filter(data: CollectedData): CollectedData`
  - `score(data: CollectedData): CollectedData`

#### 主な機能
1. **データ集約**
   - 各ソース（Discord, GitHub, Calendar, Obsidian）からデータを収集
   - 統一的な `CollectedData` 形式で返却

2. **重複排除**
   - タイプ、タイムスタンプ、コンテンツを基に重複を検知
   - 重複したデータを自動的に除外

3. **重要度スコアリング**
   - 以下の要因に基づいて重要度を計算:
     - コンテンツの長さ
     - 感情キーワードの出現
     - ソースタイプ（GitHub/Calendarは重要度高）
     - メタデータ（コメント数、変更量など）
     - 更新日時（新しいほど重要）

4. **関連情報のグループ化**
   - 感情分析による分類
   - 重要イベントの抽出
   - タイムラインの生成

#### Collectorの使用方法
```typescript
const collector = new Collector(config);

// データ収集
const data = await collector.collect(new Date());

// フィルタリング（重複排除、無効データ削除）
const filtered = collector.filter(data);

// スコアリング（重要度の再計算）
const scored = collector.score(filtered);
```

#### スコアリングアルゴリズム
```typescript
score += (コンテンツ長 / 100) * 10       // 最大20点
score += キーワード出現回数 * 5          // キーワードごと
score += ソースタイプボーナス            // GitHub:15, Calendar:10, Discord:5
score += コメント数 * 2                   // 通常コメント
score += レビューコメント数 * 3           // レビューコメント
score += 時間ボーナス                     // 6時間以内:20, 12時間以内:15, 24時間以内:10

最終スコア = Math.min(score, 100)        // 最大100点
```

---

## テスト実行

### 統合テスト
```bash
node test/integration.test.js
```

### ユニットテスト（Jest）
```bash
npm test
```

### カバレッジ
```bash
npm run test:coverage
```

---

## 受入条件の確認

### タスク2: GitHub API連携
- ✅ 指定したリポジトリから当日のIssues/PRを収集できる
- ✅ 更新日時でフィルタリングできる
- ✅ コメント情報も取得できる
- ✅ 複数リポジトリに対応

### タスク5: Collector実装
- ✅ 複数のソースからデータを集約できる
- ✅ 重複を排除できる
- ✅ 重要度をスコアリングできる
- ✅ 関連情報をグループ化できる（感情分析、重要イベント抽出）

---

## 依存パッケージ

新しく追加した依存関係:
```json
{
  "dependencies": {
    "octokit": "^5.0.5"
  },
  "devDependencies": {
    "jest": "^30.2.0",
    "@types/jest": "^30.0.0",
    "ts-jest": "^29.4.6",
    "ts-node": "^10.9.2"
  }
}
```

---

## 注意事項

1. **GitHub API認証**
   - GitHub APIを使用するには認証が必要
   - GitHub CLIを使用している場合は、`gh auth login` で認証済みのこと
   - 環境変数 `GITHUB_TOKEN` または `GH_TOKEN` を設定可能

2. **API制限**
   - GitHub APIにはレート制限がある
   - 認証済みの場合: 1時間あたり5,000リクエスト
   - 未認証の場合: 1時間あたり60リクエスト

3. **パフォーマンス**
   - 多くのリポジトリを指定すると時間がかかる
   - 必要なリポジトリだけを設定することを推奨

---

## 次のステップ

1. GitHub Issues #3 と #6 をクローズ
2. 他のタスクの実装を進める
3. 統合テストを追加して他のモジュールとの連携を検証
