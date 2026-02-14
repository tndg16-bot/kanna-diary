/**
 * ソースリーダーインターフェース
 */

import { SourceData } from '../types';

export interface SourceReader {
  read(date: Date): Promise<SourceData[]>;
  getSourceType(): string;
}
