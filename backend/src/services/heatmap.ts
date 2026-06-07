import db from '../db/database.ts';

const CENTER_LAT = 31.23;
const CENTER_LNG = 121.47;
const GRID_SIZE = 4;
const AREA_SIZE_KM = 1;

function generateAreaCode(row: number, col: number): string {
  const letter = String.fromCharCode(65 + row);
  return `${letter}${col + 1}`;
}

function getAreaForCoords(lat: number, lng: number): { row: number; col: number } | null {
  const latOffset = lat - CENTER_LAT;
  const lngOffset = lng - CENTER_LNG;

  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos(CENTER_LAT * Math.PI / 180);

  const row = Math.floor(latOffset * kmPerDegLat / AREA_SIZE_KM + GRID_SIZE / 2);
  const col = Math.floor(lngOffset * kmPerDegLng / AREA_SIZE_KM + GRID_SIZE / 2);

  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    return null;
  }

  return { row, col };
}

function getAreaCenter(row: number, col: number): { lat: number; lng: number } {
  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos(CENTER_LAT * Math.PI / 180);

  const latOffset = (row - GRID_SIZE / 2 + 0.5) * AREA_SIZE_KM / kmPerDegLat;
  const lngOffset = (col - GRID_SIZE / 2 + 0.5) * AREA_SIZE_KM / kmPerDegLng;

  return {
    lat: CENTER_LAT + latOffset,
    lng: CENTER_LNG + lngOffset,
  };
}

export function getAreaName(row: number, col: number): string {
  const areas = [
    ['Nanjing Rd East', 'The Bund', 'Pudong North', 'Wujiaochang'],
    ['People\'s Square', 'Yuyuan Garden', 'Lujiazui', 'Century Park'],
    ['Jing\'an Temple', 'Xintiandi', 'Xujiahui', 'Zhangjiang'],
    ['Changshou Rd', 'Xujiahui Park', 'Hongqiao', 'Minhang'],
  ];
  return areas[row]?.[col] || generateAreaCode(row, col);
}

export function calculateHeatmap() {
  const knights = db.prepare(`
    SELECT lat, lng FROM knights WHERE status IN ('online', 'busy')
  `).all() as { lat: number; lng: number }[];

  const pendingWaybills = db.prepare(`
    SELECT sender_lat as lat, sender_lng as lng FROM waybills WHERE status = 'pending'
  `).all() as { lat: number; lng: number }[];

  const knightCounts: Record<string, number> = {};
  const waybillCounts: Record<string, number> = {};

  knights.forEach(k => {
    const area = getAreaForCoords(k.lat, k.lng);
    if (area) {
      const code = generateAreaCode(area.row, area.col);
      knightCounts[code] = (knightCounts[code] || 0) + 1;
    }
  });

  pendingWaybills.forEach(w => {
    const area = getAreaForCoords(w.lat, w.lng);
    if (area) {
      const code = generateAreaCode(area.row, area.col);
      waybillCounts[code] = (waybillCounts[code] || 0) + 1;
    }
  });

  db.prepare('DELETE FROM area_heatmap').run();

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO area_heatmap (area_code, area_name, center_lat, center_lng, active_knights, pending_orders, gap_score, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const results: any[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const code = generateAreaCode(row, col);
      const center = getAreaCenter(row, col);
      const name = getAreaName(row, col);
      const knightsCount = knightCounts[code] || 0;
      const ordersCount = waybillCounts[code] || 0;
      const gapScore = ordersCount / Math.max(knightsCount, 1);

      insert.run(code, name, center.lat, center.lng, knightsCount, ordersCount, gapScore, now);

      results.push({
        area_code: code,
        area_name: name,
        center_lat: center.lat,
        center_lng: center.lng,
        active_knights: knightsCount,
        pending_orders: ordersCount,
        gap_score: gapScore,
        recorded_at: now,
      });
    }
  }

  return results;
}

export function getHeatmap() {
  const latest = db.prepare(`
    SELECT recorded_at FROM area_heatmap ORDER BY recorded_at DESC LIMIT 1
  `).get() as { recorded_at: string } | undefined;

  if (!latest) {
    return calculateHeatmap();
  }

  return db.prepare(`
    SELECT * FROM area_heatmap WHERE recorded_at = ? ORDER BY area_code
  `).all(latest.recorded_at);
}

export function getGapPredictions() {
  const current = getHeatmap();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const previous = db.prepare(`
    SELECT * FROM area_heatmap
    WHERE recorded_at <= ?
    ORDER BY recorded_at DESC
    LIMIT ${GRID_SIZE * GRID_SIZE}
  `).all(oneHourAgo);

  const prevMap: Record<string, any> = {};
  previous.forEach((p: any) => {
    prevMap[p.area_code] = p;
  });

  return current.map((c: any) => {
    const prev = prevMap[c.area_code];
    const prevGap = prev?.gap_score || c.gap_score;
    const trend = c.gap_score - prevGap;
    const predictedGap = c.gap_score + trend * 0.5;

    return {
      ...c,
      previous_gap: prevGap,
      trend,
      predicted_gap: Math.max(0, predictedGap),
      recommendation: predictedGap > 3 ? 'increase_knights' : predictedGap < 0.5 ? 'reduce_knights' : 'maintain',
    };
  });
}
