import db from '../db';
import type { CLVData, CLVTier } from '../../shared/types';

function determineTier(score: number): CLVTier {
  if (score >= 3000) return 'premium';
  if (score >= 1500) return 'high';
  if (score >= 500) return 'medium';
  return 'low';
}

export function calculateCLV(customerId: number): CLVData {
  const userOrders = db
    .prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(freight),0) as total FROM waybills WHERE user_id = ?`)
    .get(customerId) as { cnt: number; total: number };

  const userFirstOrder = db
    .prepare(`SELECT MIN(created_at) as first FROM waybills WHERE user_id = ?`)
    .get(customerId) as { first: string | null };

  const totalOrders = userOrders.cnt;
  const totalAmount = userOrders.total;
  const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

  let orderFrequency = 0;
  if (userFirstOrder.first) {
    const months = Math.max(1, (Date.now() - new Date(userFirstOrder.first).getTime()) / (30 * 24 * 3600 * 1000));
    orderFrequency = totalOrders / months;
  }

  const recentOrders = db
    .prepare(`SELECT COUNT(*) as cnt FROM waybills WHERE user_id = ? AND created_at >= date('now', '-3 months')`)
    .get(customerId) as { cnt: number };
  const churnRisk = recentOrders.cnt === 0 ? Math.min(0.9, 0.3 + (totalOrders === 0 ? 0.5 : 0)) : Math.max(0.05, 0.15 - recentOrders.cnt * 0.02);

  const clvScore = avgOrderValue * orderFrequency * 12 * (1 - churnRisk) * 2;

  const tier = determineTier(clvScore);

  const existing = db.prepare('SELECT id FROM clv_data WHERE customer_id = ?').get(customerId);
  if (existing) {
    db.prepare(
      `UPDATE clv_data SET total_orders=?, total_amount=?, order_frequency=?, avg_order_value=?, churn_risk=?, clv_score=?, tier=?, updated_at=CURRENT_TIMESTAMP WHERE customer_id=?`
    ).run(totalOrders, totalAmount, orderFrequency, avgOrderValue, churnRisk, clvScore, tier, customerId);
  } else {
    db.prepare(
      `INSERT INTO clv_data (customer_id, total_orders, total_amount, order_frequency, avg_order_value, churn_risk, clv_score, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(customerId, totalOrders, totalAmount, orderFrequency, avgOrderValue, churnRisk, clvScore, tier);
  }

  const row = db.prepare('SELECT * FROM clv_data WHERE customer_id = ?').get(customerId) as any;
  return {
    id: row.id,
    customerId: row.customer_id,
    totalOrders: row.total_orders,
    totalAmount: row.total_amount,
    orderFrequency: row.order_frequency,
    avgOrderValue: row.avg_order_value,
    churnRisk: row.churn_risk,
    clvScore: row.clv_score,
    tier: row.tier,
    updatedAt: row.updated_at,
  };
}

export function getAllCLVData(): CLVData[] {
  const rows = db.prepare('SELECT * FROM clv_data ORDER BY clv_score DESC').all() as any[];
  return rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    totalOrders: row.total_orders,
    totalAmount: row.total_amount,
    orderFrequency: row.order_frequency,
    avgOrderValue: row.avg_order_value,
    churnRisk: row.churn_risk,
    clvScore: row.clv_score,
    tier: row.tier,
    updatedAt: row.updated_at,
  }));
}

export function getCLVStats() {
  const rows = db.prepare('SELECT tier, COUNT(*) as cnt, SUM(clv_score) as total_score FROM clv_data GROUP BY tier').all() as any[];
  const total = db.prepare('SELECT COUNT(*) as customers, SUM(clv_score) as total_value FROM clv_data').get() as any;
  return {
    byTier: rows,
    totalCustomers: total.customers || 0,
    totalValue: total.total_value || 0,
  };
}
