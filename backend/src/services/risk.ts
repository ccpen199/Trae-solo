import { db } from '../database';
import { generateId, now, isVirtualPhone, getClientIp, getRegionByIp } from '../utils';

export interface RiskCheckRequest {
  userId?: string;
  ip: string;
  region: string;
  productId?: string;
  action: string;
  amount?: number;
  account?: string;
  extra?: Record<string, any>;
}

export interface RiskCheckResult {
  passed: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  blocked?: boolean;
  suggestions?: string[];
}

const RULE_CONFIG = {
  dailyOrderLimit: 20,
  hourlyOrderLimit: 5,
  sameAccountHourly: 3,
  minOrderInterval: 10,
  maxSingleAmount: 10000,
  virtualPhoneBlocked: true
};

class RiskEngine {
  check(req: RiskCheckRequest): RiskCheckResult {
    const results: RiskCheckResult[] = [];

    results.push(this.checkIpBlacklist(req.ip));
    if (results[results.length - 1].blocked) return this.summarize(results, req);

    results.push(this.checkVirtualPhone(req.account));
    results.push(this.checkRegionLimit(req.productId, req.region));

    if (req.userId) {
      results.push(this.checkUserFrequency(req.userId));
      results.push(this.checkUserDailyLimit(req.userId));
      results.push(this.checkUserHourlyLimit(req.userId));
    }

    if (req.account) {
      results.push(this.checkSameAccountFrequency(req.account));
    }

    if (req.amount) {
      results.push(this.checkSingleAmount(req.amount));
    }

    results.push(this.checkAbnormalPattern(req));

    const final = this.summarize(results, req);
    this.logRisk(req, final);
    return final;
  }

  private checkIpBlacklist(ip: string): RiskCheckResult {
    const row: any = db.prepare('SELECT * FROM ip_blacklist WHERE ip = ?').get(ip);
    if (row && (!row.expire_time || row.expire_time > now())) {
      return { passed: false, riskLevel: 'critical', reason: `IP ${ip} 已被封禁: ${row.reason || '未知原因'}`, blocked: true };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkVirtualPhone(account?: string): RiskCheckResult {
    if (!account || !RULE_CONFIG.virtualPhoneBlocked) return { passed: true, riskLevel: 'low' };
    if (isVirtualPhone(account)) {
      return { passed: false, riskLevel: 'high', reason: '虚拟号段不支持充值', blocked: true };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkRegionLimit(productId?: string, region?: string): RiskCheckResult {
    if (!productId || !region) return { passed: true, riskLevel: 'low' };
    const limits: any[] = db.prepare('SELECT * FROM region_limits WHERE product_id = ?').all(productId);
    if (limits.length === 0) return { passed: true, riskLevel: 'low' };

    const specific = limits.find(l => l.region_code === region);
    const global = limits.find(l => l.region_code === 'ALL');

    if (specific && specific.allow === 0) {
      return { passed: false, riskLevel: 'high', reason: `该商品不支持在${region}地区购买`, blocked: true };
    }
    if (global && global.allow === 0 && !specific) {
      return { passed: false, riskLevel: 'high', reason: `该商品有地域限制`, blocked: true };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkUserFrequency(userId: string): RiskCheckResult {
    const t = now() - RULE_CONFIG.minOrderInterval;
    const row: any = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE user_id = ? AND created_at > ?').get(userId, t);
    if (row.cnt > 0) {
      return { passed: false, riskLevel: 'medium', reason: '下单过于频繁，请稍后再试' };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkUserDailyLimit(userId: string): RiskCheckResult {
    const start = now() - 86400;
    const row: any = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE user_id = ? AND created_at > ?').get(userId, start);
    if (row.cnt >= RULE_CONFIG.dailyOrderLimit) {
      return { passed: false, riskLevel: 'high', reason: `今日下单次数已达上限(${RULE_CONFIG.dailyOrderLimit}次)`, blocked: true };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkUserHourlyLimit(userId: string): RiskCheckResult {
    const start = now() - 3600;
    const row: any = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE user_id = ? AND created_at > ?').get(userId, start);
    if (row.cnt >= RULE_CONFIG.hourlyOrderLimit) {
      return { passed: false, riskLevel: 'medium', reason: `每小时下单次数已达上限(${RULE_CONFIG.hourlyOrderLimit}次)` };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkSameAccountFrequency(account: string): RiskCheckResult {
    const start = now() - 3600;
    const row: any = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE recharge_account = ? AND created_at > ?').get(account, start);
    if (row.cnt >= RULE_CONFIG.sameAccountHourly) {
      return { passed: false, riskLevel: 'high', reason: '该号码充值过于频繁', blocked: true };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkSingleAmount(amount: number): RiskCheckResult {
    if (amount > RULE_CONFIG.maxSingleAmount) {
      return { passed: false, riskLevel: 'high', reason: `单笔金额超限`, blocked: true };
    }
    return { passed: true, riskLevel: 'low' };
  }

  private checkAbnormalPattern(req: RiskCheckRequest): RiskCheckResult {
    if (!req.userId) return { passed: true, riskLevel: 'low' };

    const recentOrders: any[] = db.prepare(`
      SELECT o.*, p.category_id FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ? AND o.created_at > ?
      ORDER BY o.created_at DESC LIMIT 50
    `).all(req.userId, now() - 86400 * 3);

    const categoryCount = new Map<string, number>();
    const accountSet = new Set<string>();
    recentOrders.forEach(o => {
      if (o.category_id) categoryCount.set(o.category_id, (categoryCount.get(o.category_id) || 0) + 1);
      if (o.recharge_account) accountSet.add(o.recharge_account);
    });

    if (accountSet.size >= 10) {
      return { passed: false, riskLevel: 'critical', reason: '检测到多账号异常充值行为', blocked: true };
    }

    let highRiskCategory = false;
    for (const [_, count] of categoryCount) {
      if (count >= 15) highRiskCategory = true;
    }
    if (highRiskCategory) {
      return { passed: false, riskLevel: 'high', reason: '同类商品购买过于集中' };
    }

    return { passed: true, riskLevel: 'low' };
  }

  private summarize(results: RiskCheckResult[], req: RiskCheckRequest): RiskCheckResult {
    const failures = results.filter(r => !r.passed);
    if (failures.length === 0) {
      return { passed: true, riskLevel: 'low' };
    }

    const priority: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    failures.sort((a, b) => priority[b.riskLevel] - priority[a.riskLevel]);

    return {
      passed: failures.every(f => !f.blocked),
      riskLevel: failures[0].riskLevel,
      reason: failures.map(f => f.reason).filter(Boolean).join('；'),
      blocked: failures.some(f => f.blocked),
      suggestions: failures.map(f => f.suggestions).flat().filter(Boolean)
    };
  }

  private logRisk(req: RiskCheckRequest, result: RiskCheckResult) {
    const logId = generateId();
    db.prepare(`INSERT INTO risk_logs (id, user_id, ip, region, action, risk_level, detail, blocked, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(logId, req.userId || null, req.ip, req.region || '', req.action,
        result.riskLevel, JSON.stringify({ ...req.extra, reason: result.reason }),
        result.blocked ? 1 : 0, now());
  }

  blockIp(ip: string, reason: string, duration: number = 86400) {
    db.prepare('INSERT OR REPLACE INTO ip_blacklist (id, ip, reason, expire_time, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(generateId(), ip, reason, now() + duration, now());
  }

  unblockIp(ip: string) {
    db.prepare('DELETE FROM ip_blacklist WHERE ip = ?').run(ip);
  }

  getRiskLogs(userId?: string, limit: number = 100) {
    const sql = userId
      ? 'SELECT * FROM risk_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
      : 'SELECT * FROM risk_logs ORDER BY created_at DESC LIMIT ?';
    return userId ? db.prepare(sql).all(userId, limit) : db.prepare(sql).all(limit);
  }
}

export const riskEngine = new RiskEngine();
