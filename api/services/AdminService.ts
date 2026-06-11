import { db } from '../db/database';
import type { DataSource, ApiKey, ApiCallStats } from '../../shared/types';
import { randomBytes } from 'crypto';

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

function mapDbApiKeyToApiKey(dbKey: any): ApiKey {
  return {
    id: dbKey.id,
    keyName: dbKey.key_name,
    apiKey: dbKey.api_key,
    status: dbKey.status as ApiKey['status'],
    rateLimit: dbKey.rate_limit,
    callCount: dbKey.call_count,
    createdAt: dbKey.created_at,
    expiresAt: dbKey.expires_at || undefined,
  };
}

function generateApiKey(): string {
  return 'weather-' + randomBytes(20).toString('hex');
}

export const AdminService = {
  getDataSources(): DataSource[] {
    const sources = db.prepare('SELECT * FROM data_sources ORDER BY type, name').all() as any[];
    return sources.map(mapDbSourceToDataSource);
  },

  getDataSourceById(id: string): DataSource | null {
    const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(id) as any;
    if (!source) return null;
    return mapDbSourceToDataSource(source);
  },

  updateDataSource(id: string, data: Partial<DataSource> & { weight?: number; errorCount?: number }): DataSource | null {
    const existing = db.prepare('SELECT id FROM data_sources WHERE id = ?').get(id) as any;
    if (!existing) return null;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.type !== undefined) {
      fields.push('type = ?');
      values.push(data.type);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.uptime !== undefined) {
      fields.push('uptime = ?');
      values.push(data.uptime);
    }
    if (data.latency !== undefined) {
      fields.push('latency = ?');
      values.push(data.latency);
    }
    if (data.successRate !== undefined) {
      fields.push('success_rate = ?');
      values.push(data.successRate);
    }
    if (data.qualityScore !== undefined) {
      fields.push('quality_score = ?');
      values.push(data.qualityScore);
    }
    if (data.weight !== undefined) {
      fields.push('weight = ?');
      values.push(data.weight);
    }
    if (data.errorCount !== undefined) {
      fields.push('error_count = ?');
      values.push(data.errorCount);
    }
    if (data.circuitBreakReason !== undefined) {
      fields.push('circuit_break_reason = ?');
      values.push(data.circuitBreakReason);
    }
    if (data.circuitBreakTime !== undefined) {
      fields.push('circuit_break_time = ?');
      values.push(data.circuitBreakTime);
    }
    
    if (fields.length === 0) {
      return this.getDataSourceById(id);
    }
    
    fields.push('last_update = DATETIME(\'now\')');
    values.push(id);
    
    db.prepare(`
      UPDATE data_sources 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.getDataSourceById(id);
  },

  createDataSource(source: Omit<DataSource, 'lastUpdate'> & { weight?: number }): DataSource | null {
    const existing = db.prepare('SELECT id FROM data_sources WHERE id = ?').get(source.id) as any;
    if (existing) return null;
    
    db.prepare(`
      INSERT INTO data_sources (id, name, type, status, uptime, latency, success_rate, quality_score, weight, last_update)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'))
    `).run(
      source.id,
      source.name,
      source.type,
      source.status,
      source.uptime,
      source.latency,
      source.successRate,
      source.qualityScore,
      source.weight ?? 1.0
    );
    
    return this.getDataSourceById(source.id);
  },

  deleteDataSource(id: string): boolean {
    const result = db.prepare('DELETE FROM data_sources WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getApiStats(): ApiCallStats {
    const totalResult = db.prepare('SELECT COUNT(*) as total FROM api_call_logs').get() as any;
    const successResult = db.prepare('SELECT COUNT(*) as count FROM api_call_logs WHERE status_code < 400').get() as any;
    const failedResult = db.prepare('SELECT COUNT(*) as count FROM api_call_logs WHERE status_code >= 400').get() as any;
    const avgTimeResult = db.prepare('SELECT AVG(response_time) as avg_time FROM api_call_logs').get() as any;
    
    const topEndpoints = db.prepare(`
      SELECT endpoint, COUNT(*) as count 
      FROM api_call_logs 
      GROUP BY endpoint 
      ORDER BY count DESC 
      LIMIT 10
    `).all() as any[];
    
    const dailyStats = db.prepare(`
      SELECT DATE(call_time) as date, COUNT(*) as count 
      FROM api_call_logs 
      WHERE call_time >= DATETIME('now', '-7 days')
      GROUP BY DATE(call_time) 
      ORDER BY date DESC
    `).all() as any[];
    
    return {
      totalCalls: totalResult.total || 0,
      successCalls: successResult.count || 0,
      failedCalls: failedResult.count || 0,
      avgResponseTime: Math.round(avgTimeResult.avg_time || 0),
      topEndpoints: topEndpoints.map(e => ({ endpoint: e.endpoint, count: e.count })),
      dailyStats: dailyStats.map(d => ({ date: d.date, count: d.count })),
    };
  },

  getApiKeys(): ApiKey[] {
    const keys = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all() as any[];
    return keys.map(mapDbApiKeyToApiKey);
  },

  getApiKeyById(id: string): ApiKey | null {
    const key = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as any;
    if (!key) return null;
    return mapDbApiKeyToApiKey(key);
  },

  getApiKeyByKey(apiKey: string): ApiKey | null {
    const key = db.prepare('SELECT * FROM api_keys WHERE api_key = ?').get(apiKey) as any;
    if (!key) return null;
    return mapDbApiKeyToApiKey(key);
  },

  createApiKey(keyName: string, rateLimit: number = 1000, expiresDays?: number): ApiKey {
    const id = 'key-' + Date.now() + '-' + randomBytes(4).toString('hex');
    const apiKey = generateApiKey();
    
    const expiresAt = expiresDays 
      ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    db.prepare(`
      INSERT INTO api_keys (id, key_name, api_key, status, rate_limit, call_count, created_at, expires_at)
      VALUES (?, ?, ?, 'active', ?, 0, DATETIME('now'), ?)
    `).run(id, keyName, apiKey, rateLimit, expiresAt);
    
    return this.getApiKeyById(id)!;
  },

  updateApiKeyStatus(id: string, status: 'active' | 'inactive'): ApiKey | null {
    const existing = db.prepare('SELECT id FROM api_keys WHERE id = ?').get(id) as any;
    if (!existing) return null;
    
    db.prepare('UPDATE api_keys SET status = ? WHERE id = ?').run(status, id);
    
    return this.getApiKeyById(id);
  },

  updateApiKey(id: string, data: Partial<Pick<ApiKey, 'keyName' | 'rateLimit' | 'expiresAt'>>): ApiKey | null {
    const existing = db.prepare('SELECT id FROM api_keys WHERE id = ?').get(id) as any;
    if (!existing) return null;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.keyName !== undefined) {
      fields.push('key_name = ?');
      values.push(data.keyName);
    }
    if (data.rateLimit !== undefined) {
      fields.push('rate_limit = ?');
      values.push(data.rateLimit);
    }
    if (data.expiresAt !== undefined) {
      fields.push('expires_at = ?');
      values.push(data.expiresAt);
    }
    
    if (fields.length === 0) {
      return this.getApiKeyById(id);
    }
    
    values.push(id);
    
    db.prepare(`
      UPDATE api_keys 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.getApiKeyById(id);
  },

  deleteApiKey(id: string): boolean {
    const result = db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
    return result.changes > 0;
  },

  recordApiCall(apiKeyId: string | null, endpoint: string, method: string, statusCode: number, responseTime: number, ipAddress?: string): void {
    db.prepare(`
      INSERT INTO api_call_logs (api_key_id, endpoint, method, status_code, response_time, call_time, ip_address)
      VALUES (?, ?, ?, ?, ?, DATETIME('now'), ?)
    `).run(apiKeyId, endpoint, method, statusCode, responseTime, ipAddress || null);
    
    if (apiKeyId) {
      db.prepare('UPDATE api_keys SET call_count = call_count + 1 WHERE id = ?').run(apiKeyId);
    }
  },

  validateApiKey(apiKey: string): { valid: boolean; key?: ApiKey; reason?: string } {
    const key = this.getApiKeyByKey(apiKey);
    
    if (!key) {
      return { valid: false, reason: 'API密钥不存在' };
    }
    
    if (key.status !== 'active') {
      return { valid: false, reason: 'API密钥已被禁用' };
    }
    
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, reason: 'API密钥已过期' };
    }
    
    return { valid: true, key };
  },

  getSystemStats(): {
    cityCount: number;
    userCount: number;
    alertCount: number;
    dataSourceCount: number;
    apiKeyCount: number;
  } {
    const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get() as any;
    const userCount = db.prepare('SELECT COUNT(DISTINCT user_session) as count FROM user_cities').get() as any;
    const alertCount = db.prepare('SELECT COUNT(*) as count FROM weather_alerts WHERE end_time > DATETIME(\'now\')').get() as any;
    const dataSourceCount = db.prepare('SELECT COUNT(*) as count FROM data_sources').get() as any;
    const apiKeyCount = db.prepare('SELECT COUNT(*) as count FROM api_keys').get() as any;
    
    return {
      cityCount: cityCount.count || 0,
      userCount: userCount.count || 0,
      alertCount: alertCount.count || 0,
      dataSourceCount: dataSourceCount.count || 0,
      apiKeyCount: apiKeyCount.count || 0,
    };
  },
};
