import { getDB } from '../db/init';

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function findNearby(lat: number, lng: number, radiusKm: number, contentType: 'news' | 'video', limit: number = 20): any[] {
  const db = getDB();
  const table = contentType === 'news' ? 'news' : 'videos';
  const rows = db.prepare(`SELECT * FROM ${table} WHERE status = 'published'`).all() as any[];

  const results = rows
    .map(row => {
      const distance = calculateDistance(lat, lng, row.latitude, row.longitude);
      return { ...row, distance };
    })
    .filter(row => row.distance <= radiusKm)
    .sort((a, b) => {
      const scoreA = (1 / (1 + a.distance)) * (a.source_credibility || 0.5) * (a.time_decay_factor || 1);
      const scoreB = (1 / (1 + b.distance)) * (b.source_credibility || 0.5) * (b.time_decay_factor || 1);
      return scoreB - scoreA;
    })
    .slice(0, limit);

  return results;
}

export function getHotspots(lat: number, lng: number, radiusKm: number = 1): any[] {
  const db = getDB();
  const rows = db.prepare(`
    SELECT * FROM news
    WHERE status = 'published' AND source_credibility >= 0.7
  `).all() as any[];

  const now = Date.now();
  const results = rows
    .map(row => {
      const distance = calculateDistance(lat, lng, row.latitude, row.longitude);
      const hoursSinceCreated = row.created_at
        ? (now - new Date(row.created_at).getTime()) / 3600000
        : 100;
      const timeDecay = Math.exp(-hoursSinceCreated / 24);
      return { ...row, distance, computed_time_decay: timeDecay * (row.time_decay_factor || 1) };
    })
    .filter(row => row.distance <= radiusKm)
    .sort((a, b) => (b.computed_time_decay * b.source_credibility) - (a.computed_time_decay * a.source_credibility))
    .slice(0, 20);

  return results;
}

export function updateRegionHeat(): void {
  const db = getDB();

  const regions = db.prepare('SELECT DISTINCT region_name FROM region_heat').all() as { region_name: string }[];

  for (const region of regions) {
    const heatRow = db.prepare('SELECT latitude, longitude FROM region_heat WHERE region_name = ?').get(region.region_name) as { latitude: number; longitude: number };
    if (!heatRow) continue;

    const newsCount = db.prepare(`
      SELECT COUNT(*) as count FROM news WHERE status = 'published'
      AND ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05
    `).get(heatRow.latitude, heatRow.longitude) as { count: number };

    const videoCount = db.prepare(`
      SELECT COUNT(*) as count FROM videos WHERE status = 'published'
      AND ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05
    `).get(heatRow.latitude, heatRow.longitude) as { count: number };

    const activeUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_behaviors
      WHERE latitude IS NOT NULL
      AND ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05
      AND created_at > datetime('now', '-1 day')
    `).get(heatRow.latitude, heatRow.longitude) as { count: number };

    const contentCount = newsCount.count + videoCount.count;
    const heatScore = contentCount * 0.5 + activeUsers.count * 0.3 + Math.random() * 2;

    db.prepare(`
      UPDATE region_heat SET heat_score = ?, content_count = ?, active_users = ?, recorded_at = CURRENT_TIMESTAMP
      WHERE region_name = ?
    `).run(Math.round(heatScore * 10) / 10, contentCount, activeUsers.count, region.region_name);
  }
}
