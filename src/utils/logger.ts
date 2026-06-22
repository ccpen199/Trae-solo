import type { LogAction, LogModule, OperationLogEntry } from '@/types';
import { uid } from '@/types';

export function buildLogEntry(params: {
  module: LogModule;
  action: LogAction;
  operator?: string;
  targetId?: string;
  targetName?: string;
  summary: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
}): OperationLogEntry {
  return {
    id: uid('log_'),
    timestamp: new Date().toISOString(),
    module: params.module,
    action: params.action,
    operator: params.operator ?? '房东（管理员）',
    targetId: params.targetId,
    targetName: params.targetName,
    summary: params.summary,
    diff: params.diff,
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  };
}

export function diffObject(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  for (const k of keys) {
    const b = JSON.stringify(before[k]);
    const a = JSON.stringify(after[k]);
    if (b !== a) {
      diff[k] = { before: before[k], after: after[k] };
    }
  }
  return diff;
}
