/**
 * 設定ファイルローダー
 */

import * as fs from 'fs';
import { Config } from '../types';

export function loadConfig(configPath: string): Config {
  try {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    const config: Config = JSON.parse(configFile);
    return config;
  } catch (error) {
    throw new Error(`設定ファイルの読み込みに失敗しました: ${error}`);
  }
}

export function getDefaultConfig(): Config {
  return {
    diary: {
      userStoragePath: './diaries/user',
      kannaStoragePath: './diaries/kanna',
      fileNameFormat: 'YYYY-MM-DD.md',
      encoding: 'utf8'
    },
    kanna: {
      name: 'かんな',
      birthday: '02-14'
    },
    sources: {
      discord: {
        enabled: false,
        channels: [],
        messageLimit: 100,
        includeReactions: true
      },
      github: {
        enabled: false,
        repo: '',
        issueLabels: ['diary', 'daily']
      },
      calendar: {
        enabled: false,
        calendarId: 'primary'
      },
      obsidian: {
        enabled: false,
        vaultPath: '',
        dailyNotesFormat: 'YYYY-MM-DD'
      }
    },
    generation: {
      aiModel: 'gpt-4o-mini',
      maxTokens: 2000,
      temperature: 0.8,
      personality: {
        name: 'かんな',
        tone: 'friendly',
        emotionalRange: 'high'
      }
    },
    output: {
      saveToFile: true,
      postToDiscord: false,
      postAsThread: false,
      discordChannelId: '1472332732595044544'
    },
    analysis: {
      emotionKeywords: {
        happy: ['楽しい', '嬉しい', 'うれしい', '面白い', '素晴らしい'],
        sad: ['悲しい', '辛い', '寂しい', '残念'],
        surprised: ['驚いた', 'びっくり', 'すごい', 'えー'],
        angry: ['怒った', '腹立つ', 'イライラ'],
        learning: ['学んだ', '気づいた', '分かった', '発見'],
        anxious: ['不安', '心配', '怖い'],
        relieved: ['安心', 'ホッとする'],
        grateful: ['ありがとう', '感謝']
      },
      importanceThreshold: 0.6
    }
  };
}
