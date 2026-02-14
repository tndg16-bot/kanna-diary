/**
 * ロガー
 */

export class Logger {
  private logLevel: string;

  constructor(logLevel: string = process.env.LOG_LEVEL || 'info') {
    this.logLevel = logLevel;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(`[${this.getTimestamp()}] ℹ️  ${message}`);
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.getTimestamp()}] ⚠️  ${message}`);
    }
  }

  error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(`[${this.getTimestamp()}] ❌ ${message}`);
    }
  }

  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.debug(`[${this.getTimestamp()}] 🔍 ${message}`);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}
