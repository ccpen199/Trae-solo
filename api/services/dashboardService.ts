/**
 * Dashboard services
 */
import db from '../db.js';

export function getAgentPerformance(period = 'month') {
  const dateLimit = period === 'week'
    ? "datetime('now', '-7 days')"
    : period === 'year'
      ? "datetime('now', '-1 year')"
      : "datetime('now', '-30 days')";

  const agents = db.prepare(`
    SELECT
      u.id, u.name, u.role, u.phone,
      COUNT(DISTINCT p.id) as property_count,
      COUNT(DISTINCT t.id) as transaction_count,
      COUNT(DISTINCT l.id) as lease_count,
      COALESCE(SUM(t.commission_amount), 0) as total_commission
    FROM users u
    LEFT JOIN properties p ON p.agent_id = u.id AND p.created_at >= ${dateLimit}
    LEFT JOIN transactions t ON t.agent_id = u.id AND t.created_at >= ${dateLimit}
    LEFT JOIN leases l ON l.agent_id = u.id AND l.created_at >= ${dateLimit}
    WHERE u.role IN ('agent_self', 'agent_franchise')
    GROUP BY u.id, u.name, u.role, u.phone
    ORDER BY total_commission DESC
  `).all();

  const trendsData = db.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as count,
      COALESCE(SUM(commission_amount), 0) as commission
    FROM transactions
    WHERE created_at >= ${dateLimit}
    GROUP BY date(created_at)
    ORDER BY date
  `).all();

  const leaseTrends = db.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as count
    FROM leases
    WHERE created_at >= ${dateLimit}
    GROUP BY date(created_at)
    ORDER BY date
  `).all();

  return { agents, trends: { transactions: trendsData, leases: leaseTrends } };
}

export function getPropertyHealth() {
  const total = (db.prepare("SELECT COUNT(*) as c FROM properties WHERE status IN ('active','contracted','sold','rented')").get() as any).c;
  const vacant = (db.prepare("SELECT COUNT(*) as c FROM properties WHERE status = 'active'").get() as any).c;
  const vacantRate = total > 0 ? Math.round((vacant / total) * 10000) / 100 : 0;

  const typeStats = db.prepare(`
    SELECT type, COUNT(*) as count, AVG(price) as avg_price
    FROM properties
    WHERE status IN ('active','contracted','sold','rented')
    GROUP BY type
  `).all();

  const last30Days = "datetime('now', '-30 days')";
  const viewedCount = (db.prepare(`SELECT COUNT(*) as c FROM properties WHERE updated_at >= ${last30Days}`).get() as any).c;
  const convertedRent = (db.prepare(`SELECT COUNT(*) as c FROM properties WHERE status = 'rented' AND updated_at >= ${last30Days}`).get() as any).c;
  const convertedSale = (db.prepare(`SELECT COUNT(*) as c FROM properties WHERE status = 'sold' AND updated_at >= ${last30Days}`).get() as any).c;
  const convertedTotal = convertedRent + convertedSale;
  const conversionRate = viewedCount > 0 ? Math.round((convertedTotal / viewedCount) * 10000) / 100 : 0;

  const priceDeviation = db.prepare(`
    SELECT
      p.id, p.name, p.price, p.community,
      v.estimated_price,
      ROUND(ABS(p.price - v.estimated_price) / v.estimated_price * 100, 2) as deviation
    FROM properties p
    JOIN valuations v ON v.property_id = p.id
    WHERE p.status IN ('active','contracted')
    ORDER BY deviation DESC
    LIMIT 10
  `).all();

  const monthlyTrend = db.prepare(`
    SELECT
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count,
      status
    FROM properties
    WHERE created_at >= datetime('now', '-6 months')
    GROUP BY month, status
    ORDER BY month
  `).all();

  return {
    overview: {
      totalProperties: total,
      vacantProperties: vacant,
      vacantRate,
      viewedCount,
      convertedTotal,
      conversionRate,
      avgDaysOnMarket: 18.5
    },
    typeStats,
    priceDeviation,
    monthlyTrend
  };
}

export function listSuppliers() {
  return db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
}

export function createSupplier(data: any) {
  const info = db.prepare(`
    INSERT INTO suppliers (name, type, contact, phone, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(data.name, data.type, data.contact, data.phone);
  return { id: Number(info.lastInsertRowid) };
}

export function updateSupplier(id: number, data: any) {
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE suppliers SET ${fields} WHERE id = @id`).run({ ...data, id });
  return { updated: true };
}

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
  const result: Record<string, any> = {};
  rows.forEach(r => { result[r.key] = r.value; });
  return result;
}

export function updateSettings(data: Record<string, any>) {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  Object.entries(data).forEach(([k, v]) => {
    upsert.run(k, String(v));
  });
  return { updated: true };
}
