import { getDB } from '../models/database';

export function getAdConfigs() {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM ad_configs WHERE is_active = 1 ORDER BY sort_order ASC, id DESC
  `).all();
}

export function getAdminAdList() {
  const db = getDB();
  return db.prepare('SELECT * FROM ad_configs ORDER BY sort_order ASC, id DESC').all();
}

export function createAdConfig(data: any) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO ad_configs (platform, position, ad_unit_id, is_active, sort_order, ext_config)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.platform,
    data.position,
    data.ad_unit_id,
    data.is_active ?? 1,
    data.sort_order || 0,
    data.ext_config ? JSON.stringify(data.ext_config) : null,
  );

  return db.prepare('SELECT * FROM ad_configs WHERE id = ?').get(result.lastInsertRowid);
}

export function updateAdConfig(id: number, data: any) {
  const db = getDB();
  const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
  const values = Object.values(data).filter((_, i) => Object.keys(data)[i] !== 'id');
  values.push(id);

  db.prepare(`UPDATE ad_configs SET ${fields} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM ad_configs WHERE id = ?').get(id);
}

export function deleteAdConfig(id: number) {
  const db = getDB();
  db.prepare('DELETE FROM ad_configs WHERE id = ?').run(id);
  return true;
}

export function reportAdImpression(adId: number) {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT * FROM ad_stats WHERE ad_id = ? AND stat_date = ?')
    .get(adId, today);

  if (existing) {
    db.prepare('UPDATE ad_stats SET impressions = impressions + 1 WHERE id = ?')
      .run((existing as any).id);
  } else {
    db.prepare(`
      INSERT INTO ad_stats (ad_id, stat_date, impressions, clicks, revenue)
      VALUES (?, ?, 1, 0, 0)
    `).run(adId, today);
  }
}

export function reportAdClick(adId: number, revenue?: number) {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT * FROM ad_stats WHERE ad_id = ? AND stat_date = ?')
    .get(adId, today);

  if (existing) {
    db.prepare(`
      UPDATE ad_stats SET clicks = clicks + 1, revenue = revenue + ?
      WHERE id = ?
    `).run(revenue || 0, (existing as any).id);
  } else {
    db.prepare(`
      INSERT INTO ad_stats (ad_id, stat_date, impressions, clicks, revenue)
      VALUES (?, ?, 1, 1, ?)
    `).run(adId, today, revenue || 0);
  }
}

export function getAdStats(days: number = 7) {
  const db = getDB();
  const stats: any[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayStats = db.prepare(`
      SELECT
        COALESCE(SUM(impressions), 0) as impressions,
        COALESCE(SUM(clicks), 0) as clicks,
        COALESCE(SUM(revenue), 0) as revenue
      FROM ad_stats WHERE stat_date = ?
    `).get(dateStr) as any;

    stats.push({
      date: dateStr,
      impressions: dayStats.impressions,
      clicks: dayStats.clicks,
      revenue: dayStats.revenue,
      ctr: dayStats.impressions > 0 ? ((dayStats.clicks / dayStats.impressions) * 100).toFixed(2) + '%' : '0%',
    });
  }

  return stats;
}
