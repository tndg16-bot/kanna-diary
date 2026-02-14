/**
 * 型定義
 */

export interface Config {
  diary: {
    userStoragePath: string;    // ユーザー（貴裕）の日記保存先
    kannaStoragePath: string;   // かんなの日記保存先
    fileNameFormat: string;
    encoding: string;
  };
  kanna: {
    name: string;
    birthday: string;  // MM-DD format
  };
  sources: {
    discord: DiscordConfig;
    github: GitHubConfig;
    calendar: CalendarConfig;
    obsidian: ObsidianConfig;
  };
  generation: {
    aiModel: string;
    maxTokens: number;
    temperature: number;
    personality: PersonalityConfig;
  };
  output: {
    saveToFile: boolean;
    postToDiscord: boolean;
    discordChannelId?: string;
  };
  analysis: {
    emotionKeywords: Record<string, string[]>;
    importanceThreshold: number;
  };
}

export interface DiscordConfig {
  enabled: boolean;
  channels: string[];
  messageLimit: number;
  includeReactions: boolean;
}

export interface GitHubConfig {
  enabled: boolean;
  repo: string;
  issueLabels: string[];
}

export interface CalendarConfig {
  enabled: boolean;
  calendarId: string;
}

export interface ObsidianConfig {
  enabled: boolean;
  vaultPath: string;
  dailyNotesFormat: string;
}

export interface PersonalityConfig {
  name: string;
  tone: string;
  emotionalRange: string;
}

export interface SourceData {
  type: SourceType;
  timestamp: Date;
  content: string;
  metadata?: Record<string, any>;
  importance?: number;
}

export enum SourceType {
  Discord = 'discord',
  GitHub = 'github',
  Calendar = 'calendar',
  Obsidian = 'obsidian'
}

export interface CollectedData {
  date: Date;
  sources: SourceData[];
  importantEvents: SourceData[];
  emotions: EmotionAnalysis;
  context: string;
  secretaryRole?: {
    activities: SourceData[];
    categories: Record<string, SourceData[]>;
    summary: string;
  };
}

export interface EmotionAnalysis {
  primary: Emotion;
  secondary?: Emotion;
  confidence: number;
  timeline: { time: string; emotion: Emotion }[];
}

export type Emotion = 'happy' | 'sad' | 'surprised' | 'angry' | 'learning' | 'anxious' | 'relieved' | 'grateful';

export interface Learning {
  content: string;
  importance: number;
  category: string;
}

export interface DiaryEntry {
  date: Date;
  title: string;
  mood: string;
  activities: Activity[];
  learnings: Learning[];
  emotions: EmotionAnalysis;
  content: string;
  metadata: Record<string, any>;
}

export interface Activity {
  title: string;
  time?: string;
  completed: boolean;
  category: string;
}
