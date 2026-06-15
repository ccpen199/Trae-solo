import { db } from '../database';
import { generateId, now } from '../utils';

const COMMISSION_RATES = {
  level1: 0.08,
  level2: 0.04,
  level3: 0.02,
  default: 0.05
};

class CommissionService {
  buildRelationChain(userId: string, referrerId: string | null) {
    if (!referrerId) return;

    db.prepare('DELETE FROM user_relations WHERE user_id = ?').run(userId);

    const insertStmt = db.prepare(`INSERT INTO user_relations (user_id, parent_id, depth, created_at) VALUES (?, ?, ?, ?)`);

    let currentParent = referrerId;
    let depth = 1;

    while (currentParent && depth <= 3) {
      insertStmt.run(userId, currentParent, depth, now());

      const user: any = db.prepare('SELECT referrer_id FROM users WHERE id = ?').get(currentParent);
      if (!user || !user.referrer_id) break;
      currentParent = user.referrer_id;
      depth++;
    }
  }

  getAncestors(userId: string): { userId: string; depth: number }[] {
    const rows: any[] = db.prepare(`
      SELECT parent_id as userId, depth
      FROM user_relations
      WHERE user_id = ?
      ORDER BY depth ASC
    `).all(userId);
    return rows.map(r => ({ userId: r.userId, depth: r.depth }));
  }

  getReferralCount(userId: string): { total: number; direct: number; indirect: number } {
    const directRow: any = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE referrer_id = ?').get(userId);
    const indirectRow: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM user_relations ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.parent_id = ? AND ur.depth > 1
    `).get(userId);

    return {
      total: directRow.cnt + indirectRow.cnt,
      direct: directRow.cnt,
      indirect: indirectRow.cnt
    };
  }

  calculateCommission(orderId: string, userId: string, finalAmount: number, productCommissionRate: number = 0) {
    const ancestors = this.getAncestors(userId);
    const insertRecord = db.prepare(`
      INSERT INTO commission_records (id, order_id, user_id, from_user_id, level, amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    const results: { userId: string; level: number; amount: number }[] = [];

    for (const ancestor of ancestors) {
      const rate = productCommissionRate > 0
        ? productCommissionRate * (ancestor.depth === 1 ? 0.6 : ancestor.depth === 2 ? 0.25 : 0.15)
        : (COMMISSION_RATES as any)[`level${ancestor.depth}`] || 0;

      const amount = Math.round(finalAmount * rate * 100) / 100;

      if (amount > 0) {
        insertRecord.run(generateId(), orderId, ancestor.userId, userId, ancestor.depth, amount, now());
        results.push({ userId: ancestor.userId, level: ancestor.depth, amount });
      }
    }

    return results;
  }

  settleCommission(settleTime?: number) {
    const t = settleTime || now() - 86400 * 7;
    const records: any[] = db.prepare(`
      SELECT cr.*, o.status as order_status
      FROM commission_records cr
      JOIN orders o ON cr.order_id = o.id
      WHERE cr.status = 'pending' AND o.status = 'completed' AND o.finish_time <= ?
    `).all(t);

    const updateStmt = db.prepare(`UPDATE commission_records SET status = 'settled', settled_at = ? WHERE id = ?`);
    const balanceStmt = db.prepare(`UPDATE users SET available_commission = available_commission + ?, total_commission = total_commission + ? WHERE id = ?`);

    const tx = db.transaction(() => {
      for (const record of records) {
        updateStmt.run(now(), record.id);
        balanceStmt.run(record.amount, 0, record.user_id);
      }
    });

    tx();
    return records.length;
  }

  withdrawCommission(userId: string, amount: number): boolean {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user || user.available_commission < amount) return false;

    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET available_commission = available_commission - ? WHERE id = ?').run(amount, userId);
    });

    try {
      tx();
      return true;
    } catch {
      return false;
    }
  }

  getCommissionRecords(userId: string, limit: number = 50): any[] {
    return db.prepare(`
      SELECT cr.*, u.nickname as from_nickname, u.avatar as from_avatar,
             o.final_amount as order_amount, o.product_name
      FROM commission_records cr
      LEFT JOIN users u ON cr.from_user_id = u.id
      LEFT JOIN orders o ON cr.order_id = o.id
      WHERE cr.user_id = ?
      ORDER BY cr.created_at DESC
      LIMIT ?
    `).all(userId, limit);
  }

  getTeamPerformance(userId: string, days: number = 30): {
    totalSales: number;
    totalCommission: number;
    memberCount: number;
    levels: Record<number, { sales: number; commission: number; count: number }>;
  } {
    const startTime = now() - 86400 * days;

    const salesRow: any = db.prepare(`
      SELECT SUM(o.final_amount) as sales
      FROM user_relations ur
      JOIN orders o ON ur.user_id = o.user_id
      WHERE ur.parent_id = ? AND o.created_at >= ? AND o.status = 'completed'
    `).get(userId, startTime);

    const commissionRow: any = db.prepare(`
      SELECT SUM(amount) as commission
      FROM commission_records
      WHERE user_id = ? AND created_at >= ?
    `).get(userId, startTime);

    const levels: any = {};
    for (let i = 1; i <= 3; i++) {
      const levelRow: any = db.prepare(`
        SELECT SUM(o.final_amount) as sales, COUNT(DISTINCT ur.user_id) as count
        FROM user_relations ur
        LEFT JOIN orders o ON ur.user_id = o.user_id AND o.created_at >= ? AND o.status = 'completed'
        WHERE ur.parent_id = ? AND ur.depth = ?
      `).get(startTime, userId, i);

      const commissionByLevel: any = db.prepare(`
        SELECT SUM(amount) as commission
        FROM commission_records
        WHERE user_id = ? AND level = ? AND created_at >= ?
      `).get(userId, i, startTime);

      levels[i] = {
        sales: levelRow.sales || 0,
        count: levelRow.count || 0,
        commission: commissionByLevel.commission || 0
      };
    }

    const memberCount = this.getReferralCount(userId).total;

    return {
      totalSales: salesRow.sales || 0,
      totalCommission: commissionRow.commission || 0,
      memberCount,
      levels
    };
  }
}

export const commissionService = new CommissionService();
