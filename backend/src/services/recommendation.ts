import { getDB } from '../db/init';

interface InterestProfile {
  [category: string]: number;
}

export function recordBehavior(
  userId: number,
  action: string,
  targetType: string | null,
  targetId: number | null,
  dwellTime: number = 0,
  latitude?: number,
  longitude?: number,
  deviceFingerprint?: string,
  ipAddress?: string
): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO user_behaviors (user_id, action, target_type, target_id, dwell_time, latitude, longitude, device_fingerprint, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, action, targetType, targetId, dwellTime, latitude ?? null, longitude ?? null, deviceFingerprint ?? null, ipAddress ?? null);

  if (action === 'view' && dwellTime > 0) {
    db.prepare('UPDATE users SET total_reading_time = total_reading_time + ? WHERE id = ?').run(dwellTime, userId);
  }
}

export function updateInterestEmbedding(userId: number): void {
  const db = getDB();

  const behaviors = db.prepare(`
    SELECT ub.action, ub.dwell_time, ub.target_type, ub.target_id,
      COALESCE(n.category, v.category) as category
    FROM user_behaviors ub
    LEFT JOIN news n ON ub.target_type = 'news' AND ub.target_id = n.id
    LEFT JOIN videos v ON ub.target_type = 'video' AND ub.target_id = v.id
    WHERE ub.user_id = ? AND ub.created_at > datetime('now', '-30 days')
    ORDER BY ub.created_at DESC
    LIMIT 200
  `).all(userId) as any[];

  const profile: InterestProfile = {};
  for (const b of behaviors) {
    if (!b.category) continue;
    let weight = 0;
    switch (b.action) {
      case 'click': weight = 1; break;
      case 'view': weight = Math.min(b.dwell_time / 5000, 3); break;
      case 'like': weight = 3; break;
      case 'comment': weight = 4; break;
      case 'share': weight = 5; break;
      default: weight = 0.5;
    }
    profile[b.category] = (profile[b.category] || 0) + weight;
  }

  const total = Object.values(profile).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const k of Object.keys(profile)) {
      profile[k] = Math.round((profile[k] / total) * 1000) / 1000;
    }
  }

  db.prepare('UPDATE users SET reading_profile = ? WHERE id = ?').run(JSON.stringify(profile), userId);
}

function getRealtimeInterests(userId: number): InterestProfile {
  const db = getDB();
  const behaviors = db.prepare(`
    SELECT ub.action, ub.dwell_time, COALESCE(n.category, v.category) as category
    FROM user_behaviors ub
    LEFT JOIN news n ON ub.target_type = 'news' AND ub.target_id = n.id
    LEFT JOIN videos v ON ub.target_type = 'video' AND ub.target_id = v.id
    WHERE ub.user_id = ? AND ub.created_at > datetime('now', '-2 hours')
    ORDER BY ub.created_at DESC
    LIMIT 50
  `).all(userId) as any[];

  const profile: InterestProfile = {};
  for (const b of behaviors) {
    if (!b.category) continue;
    let weight = 0;
    switch (b.action) {
      case 'click': weight = 2; break;
      case 'view': weight = Math.min(b.dwell_time / 3000, 4); break;
      case 'like': weight = 5; break;
      case 'comment': weight = 6; break;
      case 'share': weight = 7; break;
      default: weight = 1;
    }
    profile[b.category] = (profile[b.category] || 0) + weight;
  }
  return profile;
}

function getOfflineInterests(userId: number): InterestProfile {
  const db = getDB();
  const user = db.prepare('SELECT reading_profile FROM users WHERE id = ?').get(userId) as { reading_profile: string } | undefined;
  if (!user || !user.reading_profile) return {};
  try {
    return JSON.parse(user.reading_profile);
  } catch {
    return {};
  }
}

function mergeInterests(realtime: InterestProfile, offline: InterestProfile): InterestProfile {
  const merged: InterestProfile = {};
  const allKeys = new Set([...Object.keys(realtime), ...Object.keys(offline)]);
  for (const k of allKeys) {
    merged[k] = (realtime[k] || 0) * 0.6 + (offline[k] || 0) * 0.4;
  }
  return merged;
}

export function getRecommendations(userId: number, contentType: 'news' | 'video', limit: number = 10): any[] {
  const db = getDB();
  const realtime = getRealtimeInterests(userId);
  const offline = getOfflineInterests(userId);
  const merged = mergeInterests(realtime, offline);

  const table = contentType === 'news' ? 'news' : 'videos';
  const items = db.prepare(`SELECT * FROM ${table} WHERE status = 'published'`).all() as any[];

  const viewed = new Set(
    (db.prepare(
      'SELECT target_id FROM user_behaviors WHERE user_id = ? AND target_type = ? AND action = ?'
    ).all(userId, contentType, 'view') as any[]).map(r => r.target_id)
  );

  const scored = items
    .filter(item => !viewed.has(item.id))
    .map(item => {
      let categoryScore = merged[item.category] || 0;
      let popularityScore = Math.log1p(item.view_count) * 0.1 + Math.log1p(item.like_count) * 0.3;
      let recencyScore = 0;
      if (item.created_at) {
        const hours = (Date.now() - new Date(item.created_at).getTime()) / 3600000;
        recencyScore = Math.exp(-hours / 48);
      }
      const totalScore = categoryScore * 0.5 + popularityScore * 0.3 + recencyScore * 0.2;
      return { ...item, recommendation_score: totalScore };
    })
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);

  return scored;
}
