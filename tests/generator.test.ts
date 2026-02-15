/**
 * Generator Tests
 * GLM4.7 APIを使用した日記生成のテスト
 */

import { Generator } from '../src/Generator';
import { Config, CollectedData } from '../src/types';

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
      learning: ['学んだ', '気づいた', '分かった']
    },
    importanceThreshold: 0.6
  }
};

/**
 * テストデータを生成するヘルパー関数
 */
function createMockCollectedData(isBirthday = false): CollectedData {
  const now = new Date();

  // 誕生日テストの場合は誕生日に設定
  if (isBirthday) {
    now.setMonth(1); // 2月
    now.setDate(14);
  }

  return {
    date: now,
    sources: [
      {
        type: 'discord' as any,
        timestamp: new Date(now.getTime() - 3600000),
        content: '今日は楽しい一日だった！新しいプロジェクトが順調に進んでいる',
        importance: 90
      },
      {
        type: 'github' as any,
        timestamp: new Date(now.getTime() - 7200000),
        content: '素晴らしいコードが書けた。TypeScriptの型定義について学んだ',
        importance: 85
      },
      {
        type: 'obsidian' as any,
        timestamp: new Date(now.getTime() - 10800000),
        content: '日記を書く習慣がついてきた。気づきがたくさんある',
        importance: 75
      }
    ],
    importantEvents: [
      {
        type: 'discord' as any,
        timestamp: new Date(now.getTime() - 3600000),
        content: '新しいプロジェクトが順調に進んでいる',
        importance: 90
      }
    ],
    emotions: {
      primary: 'happy',
      secondary: 'learning',
      confidence: 0.8,
      timeline: [
        { time: '09:00', emotion: 'learning' },
        { time: '14:00', emotion: 'happy' }
      ]
    },
    context: JSON.stringify({
      activities: [
        { type: 'discord', time: '09:00', content: '会議に参加' },
        { type: 'github', time: '10:00', content: 'コードを書く' }
      ],
      emotions: 'happy'
    }),
    secretaryRole: {
      activities: [
        {
          type: 'discord' as any,
          timestamp: new Date(now.getTime() - 3600000),
          content: 'プロジェクトの進捗管理',
          importance: 85
        }
      ],
      categories: {
        '会議・調整': [],
        '進捗管理': [],
        '資料作成・報告': [],
        '連絡・対応': [],
        'その他': []
      },
      summary: '秘書としての活動: 1件'
    }
  };
}

/**
 * テスト実行関数
 */
async function runTests() {
  console.log('🧪 Generator Tests\n');
  console.log('='.repeat(50));

  // テスト環境の設定
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEYが設定されていません');
    console.log('テストをスキップします');
    return;
  }

  const generator = new Generator(mockConfig);
  let passedTests = 0;
  let failedTests = 0;

  // テスト1: 基本的な日記生成
  console.log('\n📝 Test 1: Basic diary generation');
  try {
    const mockData = createMockCollectedData();
    const diaryEntry = await generator.generate(mockData);

    console.log(`  Title: ${diaryEntry.title}`);
    console.log(`  Mood: ${diaryEntry.mood}`);
    console.log(`  Content length: ${diaryEntry.content.length} chars`);
    console.log(`  Activities: ${diaryEntry.activities.length}`);
    console.log(`  Learnings: ${diaryEntry.learnings.length}`);

    if (diaryEntry.title && diaryEntry.content && diaryEntry.content.length > 0) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ❌ FAILED - Missing required fields');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト2: 誕生日の日記生成
  console.log('\n📝 Test 2: Birthday diary generation');
  try {
    const mockData = createMockCollectedData(true);
    const diaryEntry = await generator.generate(mockData);

    console.log(`  Title: ${diaryEntry.title}`);
    console.log(`  Mood: ${diaryEntry.mood}`);
    console.log(`  Is birthday: ${diaryEntry.metadata.isBirthday}`);

    if (diaryEntry.metadata.isBirthday && diaryEntry.title.includes('誕生日')) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ❌ FAILED - Birthday not detected or title incorrect');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト3: 学びの抽出
  console.log('\n📝 Test 3: Learning extraction');
  try {
    const mockData = createMockCollectedData();
    const diaryEntry = await generator.generate(mockData);

    console.log(`  Learnings count: ${diaryEntry.learnings.length}`);
    if (diaryEntry.learnings.length > 0) {
      console.log('  Sample learning:', diaryEntry.learnings[0].content.substring(0, 50) + '...');
    }

    if (Array.isArray(diaryEntry.learnings) && diaryEntry.learnings.length > 0) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ⚠️  No learnings extracted');
      console.log('  ❌ FAILED');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト4: アクティビティのフォーマット
  console.log('\n📝 Test 4: Activity formatting');
  try {
    const mockData = createMockCollectedData();
    const diaryEntry = await generator.generate(mockData);

    console.log(`  Activities count: ${diaryEntry.activities.length}`);
    if (diaryEntry.activities.length > 0) {
      console.log('  Sample activity:', diaryEntry.activities[0]);
    }

    if (
      Array.isArray(diaryEntry.activities) &&
      diaryEntry.activities.length > 0 &&
      diaryEntry.activities[0].title &&
      diaryEntry.activities[0].category
    ) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ❌ FAILED - Activities not properly formatted');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト5: 日記の内容の品質
  console.log('\n📝 Test 5: Diary content quality');
  try {
    const mockData = createMockCollectedData();
    const diaryEntry = await generator.generate(mockData);

    const content = diaryEntry.content;
    const hasEmotions = content.match(/[😊😢😲😠🧠😰😌🙏]/);
    const hasStructure = content.includes('##') || content.includes('---');

    console.log(`  Content quality checks:`);
    console.log(`    Has emojis: ${!!hasEmotions}`);
    console.log(`    Has structure: ${hasStructure}`);
    console.log(`    Content length: ${content.length} chars`);

    if (hasEmotions && hasStructure && content.length > 200) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ❌ FAILED - Content quality issues');
      failedTests++;
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error}`);
    failedTests++;
  }

  // テスト6: メタデータの検証
  console.log('\n📝 Test 6: Metadata validation');
  try {
    const mockData = createMockCollectedData();
    const diaryEntry = await generator.generate(mockData);

    const metadata = diaryEntry.metadata;
    console.log(`  Generated at: ${metadata.generatedAt}`);
    console.log(`  Source count: ${metadata.sourceCount}`);
    console.log(`  Model: ${metadata.model}`);
    console.log(`  Is birthday: ${metadata.isBirthday}`);

    if (
      metadata.generatedAt instanceof Date &&
      typeof metadata.sourceCount === 'number' &&
      typeof metadata.model === 'string'
    ) {
      console.log('  ✅ PASSED');
      passedTests++;
    } else {
      console.log('  ❌ FAILED - Invalid metadata');
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
