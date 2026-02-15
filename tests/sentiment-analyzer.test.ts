/**
 * SentimentAnalyzer Tests
 * GLM4.7 APIを使用した感情分析のテスト
 */

import { SentimentAnalyzer } from '../src/sentiment-analyzer';
import { Config, SourceData } from '../src/types';

// テスト用のモック設定
const mockConfig: Config = {
  diary: {
    userStoragePath: './test/diaries/user',
    kannaStoragePath: './test/diaries/kanna',
    fileNameFormat: 'YYYY-MM-DD.md',
    encoding: 'utf8'
  },
  kanna: {
    name: 'かんな',
    birthday: '02-14'
  },
  sources: {
    discord: { enabled: false, channels: [], messageLimit: 100, includeReactions: true },
    github: { enabled: false, repo: 'test/repo', issueLabels: ['diary'] },
    calendar: { enabled: false, calendarId: 'primary' },
    obsidian: { enabled: false, vaultPath: '', dailyNotesFormat: 'YYYY-MM-DD' }
  },
  generation: {
    aiModel: 'zai/glm-4.7',
    maxTokens: 2000,
    temperature: 0.8,
    personality: { name: 'かんな', tone: 'friendly', emotionalRange: 'high' }
  },
  output: {
    saveToFile: false,
    postToDiscord: false
  },
  analysis: {
    emotionKeywords: {
      happy: ['楽しい', '嬉しい', 'うれしい'],
      sad: ['悲しい', '辛い', '寂しい'],
      learning: ['学んだ', '気づいた', '分かった']
    },
    importanceThreshold: 0.6
  }
};

/**
 * テストデータを生成するヘルパー関数
 */
function createTestData(scenario: 'happy' | 'sad' | 'learning' | 'mixed'): SourceData[] {
  const now = new Date();

  const scenarios: Record<string, SourceData[]> = {
    happy: [
      {
        type: 'discord' as any,
        timestamp: new Date(now.getTime() - 3600000),
        content: '今日は楽しい一日だった！新しいプロジェクトが順調に進んで嬉しい',
        importance: 90
      },
      {
        type: 'github' as any,
        timestamp: new Date(now.getTime() - 7200000),
        content: '素晴らしいコードが書けた。チームのみんなと協力できてよかった',
        importance: 85
      }
    ],
    sad: [
      {
        type: 'discord' as any,
        timestamp: new Date(now.getTime() - 3600000),
        content: '今日は辛い一日だった。バグが多くて大変だった',
        importance: 90
      },
      {
        type: 'github' as any,
        timestamp: new Date(now.getTime() - 7200000),
        content: 'デッドラインに間に合わなくて残念だ。もっと早く着手すべきだった',
        importance: 80
      }
    ],
    learning: [
      {
        type: 'discord' as any,
        timestamp: new Date(now.getTime() - 3600000),
        content: '今日は新しい技術を学んだ。AI APIの使い方が分かってきた',
        importance: 85
      },
      {
        type: 'obsidian' as any,
        timestamp: new Date(now.getTime() - 7200000),
        content: 'TypeScriptの型定義について深く理解できた。気づきがたくさんあった',
        importance: 90
      }
    ],
    mixed: [
      {
        type: 'discord' as any,
        timestamp: new Date(now.getTime() - 3600000),
        content: '朝はバグで大変だったけど、午後からは順調に進んだ',
        importance: 80
      },
      {
        type: 'github' as any,
        timestamp: new Date(now.getTime() - 7200000),
        content: '新しい機能を実装できて嬉しい。学びもたくさんあった',
        importance: 85
      },
      {
        type: 'obsidian' as any,
        timestamp: new Date(now.getTime() - 10800000),
        content: '明日のプレゼンの準備ができて安心した',
        importance: 75
      }
    ]
  };

  return scenarios[scenario];
}

/**
 * テスト実行関数
 */
async function runTests() {
  console.log('🧪 SentimentAnalyzer Tests\n');
  console.log('='.repeat(50));

  // テスト環境の設定
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEYが設定されていません');
    console.log('テストをスキップします');
    return;
  }

  const analyzer = new SentimentAnalyzer(mockConfig);
  let passedTests = 0;
  let failedTests = 0;

  // テスト1: 喜びの感情を検出
  console.log('\n📝 Test 1: Happy emotion detection');
  try {
    const happyData = createTestData('happy');
    const result = await analyzer.analyzeEmotions(happyData);

    console.log(`  Primary emotion: ${result.primary}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Timeline entries: ${result.timeline.length}`);

    const score = analyzer.calculateEmotionScore(result);
    console.log(`  Emotion score: ${score}`);

    if (result.primary === 'happy' && score > 0) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ⚠️  Expected: happy, Got:', result.primary);
      console.log('  ❌ FAILED');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト2: 悲しみの感情を検出
  console.log('\n📝 Test 2: Sad emotion detection');
  try {
    const sadData = createTestData('sad');
    const result = await analyzer.analyzeEmotions(sadData);

    console.log(`  Primary emotion: ${result.primary}`);
    console.log(`  Confidence: ${result.confidence}`);

    const score = analyzer.calculateEmotionScore(result);
    console.log(`  Emotion score: ${score}`);

    if (result.primary === 'sad' && score < 0) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ⚠️  Expected: sad, Got:', result.primary);
      console.log('  ❌ FAILED');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト3: 学びの感情を検出
  console.log('\n📝 Test 3: Learning emotion detection');
  try {
    const learningData = createTestData('learning');
    const result = await analyzer.analyzeEmotions(learningData);

    console.log(`  Primary emotion: ${result.primary}`);
    console.log(`  Confidence: ${result.confidence}`);

    const category = analyzer.categorizeEmotion(result);
    console.log(`  Emotion category: ${category}`);

    if (result.primary === 'learning') {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ⚠️  Expected: learning, Got:', result.primary);
      console.log('  ❌ FAILED');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト4: 感情スコアの範囲検証
  console.log('\n📝 Test 4: Emotion score range validation');
  try {
    const mixedData = createTestData('mixed');
    const result = await analyzer.analyzeEmotions(mixedData);

    const score = analyzer.calculateEmotionScore(result);
    console.log(`  Emotion score: ${score}`);

    if (score >= -1.0 && score <= 1.0) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log(`  ⚠️  Score out of range: ${score}`);
      console.log('  ❌ FAILED');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト5: 空データの扱い
  console.log('\n📝 Test 5: Empty data handling');
  try {
    const result = await analyzer.analyzeEmotions([]);

    console.log(`  Primary emotion: ${result.primary}`);
    console.log(`  Confidence: ${result.confidence}`);

    if (result.primary === 'learning' && result.confidence === 0.3) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ⚠️  Expected default values, Got:', result);
      console.log('  ❌ FAILED');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト6: タイムラインの生成
  console.log('\n📝 Test 6: Timeline generation');
  try {
    const mixedData = createTestData('mixed');
    const result = await analyzer.analyzeEmotions(mixedData);

    console.log(`  Timeline entries: ${result.timeline.length}`);

    if (Array.isArray(result.timeline)) {
      console.log('  Timeline samples:');
      result.timeline.slice(0, 3).forEach((entry, i) => {
        console.log(`    [${i}] ${entry.time} - ${entry.emotion}`);
      });
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ❌ FAILED - Timeline is not an array');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト結果のサマリー
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
  }

  return { passed: passedTests, failed: failedTests };
}

// テストを実行
runTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
