import { getDB } from '../models/database';
import dayjs from 'dayjs';

const BEHAVIOR_WINDOW = 3600000;
const SUSPICIOUS_BEHAVIORS: Record<string, number> = {
  rapid_task_completion: 20,
  abnormal_step_count: 30,
  multi_account_device: 40,
  frequent_withdrawal: 25,
  ip_anomaly: 15,
};

const behaviorCache = new Map<string, { events: string[]; timestamp: number }>();

export function evaluateWithdrawalRisk(user: any, amount: number): { level: string; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (user.is_cheater) {
    score += 50;
    reasons.push('可疑用户');
  }

  score += user.risk_score || 0;

  const db = getDB();
  const registrationDays = dayjs().diff(dayjs(user.created_at), 'day');
  if (registrationDays < 1) {
    score += 30;
    reasons.push('新注册用户');
  }

  const totalEarned = user.total_earned_coins || 0;
  if (amount > 50 && totalEarned < 100000) {
    score += 20;
    reasons.push('高金额低累计收入');
  }

  const withdrawalCount = (db.prepare(`
    SELECT COUNT(*) as count FROM withdrawals WHERE user_id = ? AND date(created_at) = date('now')
  `).get(user.id) as any).count;

  if (withdrawalCount >= 3) {
    score += 25;
    reasons.push('单日多次提现');
    recordRiskEvent(user.id, 'frequent_withdrawal', 'medium', `单日提现${withdrawalCount}次`);
  }

  const deviceAccounts = (db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE device_fingerprint = ?
  `).get(user.device_fingerprint) as any).count;

  if (deviceAccounts >= 3) {
    score += 40;
    reasons.push(`设备关联${deviceAccounts}个账号`);
  }

  let level = 'low';
  if (score >= 80) level = 'high';
  else if (score >= 40) level = 'medium';

  return { level, reason: reasons.join(', ') || '正常' };
}

export function recordRiskEvent(userId: number | null, eventType: string, riskLevel: string, details: string, deviceId?: string, ip?: string) {
  const db = getDB();
  db.prepare(`
    INSERT INTO risk_events (user_id, device_id, ip, event_type, risk_level, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, deviceId || null, ip || null, eventType, riskLevel, details);

  if (userId && riskLevel === 'high') {
    const score = SUSPICIOUS_BEHAVIORS[eventType] || 10;
    db.prepare('UPDATE users SET risk_score = risk_score + ? WHERE id = ?').run(score, userId);
  }
}

export function analyzeBehavior(userId: number, action: string, deviceId: string, ip: string): boolean {
  const key = `${userId}_${deviceId}`;
  const now = Date.now();
  const cache = behaviorCache.get(key) || { events: [], timestamp: now };

  if (now - cache.timestamp > BEHAVIOR_WINDOW) {
    cache.events = [];
    cache.timestamp = now;
  }

  cache.events.push(action);
  behaviorCache.set(key, cache);

  if (cache.events.length > 50) {
    recordRiskEvent(userId, 'rapid_task_completion', 'medium', `1小时内${cache.events.length}次操作`, deviceId, ip);
    return false;
  }

  const taskCompletions = cache.events.filter(e => e.startsWith('task:')).length;
  if (taskCompletions > 20) {
    recordRiskEvent(userId, 'rapid_task_completion', 'high', `1小时内完成${taskCompletions}个任务`, deviceId, ip);
    return false;
  }

  return true;
}

export function getRiskEvents(page: number = 1, pageSize: number = 20, eventType?: string) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM risk_events';
  let countQuery = 'SELECT COUNT(*) as count FROM risk_events';
  const params: any[] = [];

  if (eventType) {
    query += ' WHERE event_type = ?';
    countQuery += ' WHERE event_type = ?';
    params.push(eventType);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const list = db.prepare(query).all(...params, pageSize, offset);
  const total = (db.prepare(countQuery).get(...params) as any).count;

  return { list, total, page, pageSize };
}

export function getRiskStats() {
  const db = getDB();

  const todayEvents = (db.prepare(`
    SELECT COUNT(*) as count FROM risk_events WHERE date(created_at) = date('now')
  `).get() as any).count;

  const highRiskUsers = (db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE risk_score >= 80 OR is_cheater = 1
  `).get() as any).count;

  const blockedUsers = (db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE is_blocked = 1
  `).get() as any).count;

  const eventTypes = db.prepare(`
    SELECT event_type, COUNT(*) as count FROM risk_events
    WHERE date(created_at) >= date('now', '-7 days')
    GROUP BY event_type ORDER BY count DESC
  `).all();

  return { todayEvents, highRiskUsers, blockedUsers, eventTypes };
}
