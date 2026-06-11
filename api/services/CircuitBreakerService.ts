import { db } from '../db/database';
import type { CircuitBreakLog, DataSource } from '../../shared/types';

const ERROR_THRESHOLD = 5;
const RECOVERY_TIME_MINUTES = 30;
const HALF_OPEN_ERROR_THRESHOLD = 2;

function mapDbSourceToDataSource(dbSource: any): DataSource {
  return {
    id: dbSource.id,
    name: dbSource.name,
    type: dbSource.type as DataSource['type'],
    status: dbSource.status as DataSource['status'],
    uptime: dbSource.uptime,
    latency: dbSource.latency,
    successRate: dbSource.success_rate,
    qualityScore: dbSource.quality_score,
    lastUpdate: dbSource.last_update,
    circuitBreakReason: dbSource.circuit_break_reason || undefined,
    circuitBreakTime: dbSource.circuit_break_time || undefined,
  };
}

function logCircuitBreakAction(sourceId: string, action: 'break' | 'restore', reason: string): void {
  db.prepare(`
    INSERT INTO circuit_break_logs (source_id, action, reason, action_time)
    VALUES (?, ?, ?, DATETIME('now'))
  `).run(sourceId, action, reason);
}

export const CircuitBreakerService = {
  recordError(sourceId: string): void {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) return;
    
    const newErrorCount = (source.error_count || 0) + 1;
    
    db.prepare('UPDATE data_sources SET error_count = ? WHERE id = ?').run(newErrorCount, sourceId);
    
    if (source.status === 'online' && newErrorCount >= ERROR_THRESHOLD) {
      this.triggerCircuitBreak(sourceId, `连续错误达到阈值 ${ERROR_THRESHOLD} 次`);
    } else if (source.status === 'circuit_break') {
      const breakTime = new Date(source.circuit_break_time).getTime();
      const now = Date.now();
      const elapsedMinutes = (now - breakTime) / 60000;
      
      if (elapsedMinutes >= RECOVERY_TIME_MINUTES) {
        this.attemptRecovery(sourceId);
      }
    } else if (source.status === 'degraded' && newErrorCount >= HALF_OPEN_ERROR_THRESHOLD) {
      this.triggerCircuitBreak(sourceId, '半开状态下错误次数过多，重新熔断');
    }
  },

  recordSuccess(sourceId: string): void {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) return;
    
    if (source.status === 'degraded') {
      this.restoreCircuit(sourceId, '半开状态下请求成功，恢复正常');
    } else if (source.status === 'online') {
      const newErrorCount = Math.max(0, (source.error_count || 0) - 1);
      db.prepare('UPDATE data_sources SET error_count = ? WHERE id = ?').run(newErrorCount, sourceId);
    }
  },

  checkCircuitBreak(sourceId: string): { isBroken: boolean; status: string; reason?: string } {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) {
      return { isBroken: false, status: 'unknown' };
    }
    
    if (source.status === 'circuit_break') {
      const breakTime = new Date(source.circuit_break_time).getTime();
      const now = Date.now();
      const elapsedMinutes = (now - breakTime) / 60000;
      
      if (elapsedMinutes >= RECOVERY_TIME_MINUTES) {
        this.attemptRecovery(sourceId);
        return { isBroken: false, status: 'degraded', reason: '熔断超时，进入半开状态' };
      }
      
      const remainingMinutes = Math.ceil(RECOVERY_TIME_MINUTES - elapsedMinutes);
      return { 
        isBroken: true, 
        status: 'circuit_break', 
        reason: `${source.circuit_break_reason || '未知原因'}，预计 ${remainingMinutes} 分钟后恢复` 
      };
    }
    
    return { isBroken: false, status: source.status };
  },

  triggerCircuitBreak(sourceId: string, reason: string): void {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source || source.status === 'circuit_break') return;
    
    db.prepare(`
      UPDATE data_sources 
      SET status = 'circuit_break', circuit_break_reason = ?, circuit_break_time = DATETIME('now')
      WHERE id = ?
    `).run(reason, sourceId);
    
    logCircuitBreakAction(sourceId, 'break', reason);
  },

  attemptRecovery(sourceId: string): void {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source || source.status !== 'circuit_break') return;
    
    db.prepare(`
      UPDATE data_sources 
      SET status = 'degraded', error_count = 0
      WHERE id = ?
    `).run(sourceId);
    
    logCircuitBreakAction(sourceId, 'restore', '熔断超时，进入半开状态尝试恢复');
  },

  restoreCircuit(sourceId: string, reason: string): void {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) return;
    
    db.prepare(`
      UPDATE data_sources 
      SET status = 'online', error_count = 0, circuit_break_reason = NULL, circuit_break_time = NULL
      WHERE id = ?
    `).run(sourceId);
    
    logCircuitBreakAction(sourceId, 'restore', reason);
  },

  manualBreak(sourceId: string, reason: string): boolean {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) return false;
    
    db.prepare(`
      UPDATE data_sources 
      SET status = 'circuit_break', circuit_break_reason = ?, circuit_break_time = DATETIME('now'), error_count = 0
      WHERE id = ?
    `).run(reason, sourceId);
    
    logCircuitBreakAction(sourceId, 'break', `手动熔断：${reason}`);
    
    return true;
  },

  manualRestore(sourceId: string): boolean {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) return false;
    
    db.prepare(`
      UPDATE data_sources 
      SET status = 'online', error_count = 0, circuit_break_reason = NULL, circuit_break_time = NULL
      WHERE id = ?
    `).run(sourceId);
    
    logCircuitBreakAction(sourceId, 'restore', '手动恢复');
    
    return true;
  },

  getCircuitBreakLogs(sourceId?: string, limit: number = 50): CircuitBreakLog[] {
    let logs: any[];
    
    if (sourceId) {
      logs = db.prepare(`
        SELECT * FROM circuit_break_logs 
        WHERE source_id = ? 
        ORDER BY action_time DESC 
        LIMIT ?
      `).all(sourceId, limit);
    } else {
      logs = db.prepare(`
        SELECT * FROM circuit_break_logs 
        ORDER BY action_time DESC 
        LIMIT ?
      `).all(limit);
    }
    
    return logs.map(log => ({
      id: log.id,
      sourceId: log.source_id,
      action: log.action as 'break' | 'restore',
      reason: log.reason || '',
      actionTime: log.action_time,
    }));
  },

  getCircuitBreakStatus(sourceId: string): DataSource | null {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(sourceId) as any;
    if (!source) return null;
    return mapDbSourceToDataSource(source);
  },

  resetErrorCount(sourceId: string): boolean {
    const result = db.prepare('UPDATE data_sources SET error_count = 0 WHERE id = ?').run(sourceId);
    return result.changes > 0;
  },

  getErrorThreshold(): { errorThreshold: number; recoveryTimeMinutes: number; halfOpenErrorThreshold: number } {
    return {
      errorThreshold: ERROR_THRESHOLD,
      recoveryTimeMinutes: RECOVERY_TIME_MINUTES,
      halfOpenErrorThreshold: HALF_OPEN_ERROR_THRESHOLD,
    };
  },
};
