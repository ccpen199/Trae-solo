import db from '../database/index.js';

const RATE_LIMITS = {
  follow: { max: 50, window: 3600 },
  unfollow: { max: 100, window: 3600 },
  friend_request: { max: 20, window: 3600 },
  report: { max: 10, window: 3600 },
};

export function rateLimit(action) {
  return (req, res, next) => {
    const limit = RATE_LIMITS[action];
    if (!limit) return next();

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = new Date(now - limit.window * 1000).toISOString();

    const rateRecord = db.prepare(`
      SELECT * FROM rate_limits 
      WHERE user_id = ? AND action = ?
    `).get(userId, action);

    if (rateRecord) {
      if (rateRecord.window_start < windowStart) {
        db.prepare(`
          UPDATE rate_limits 
          SET count = 1, window_start = CURRENT_TIMESTAMP
          WHERE user_id = ? AND action = ?
        `).run(userId, action);
        return next();
      }

      if (rateRecord.count >= limit.max) {
        return res.status(429).json({ error: '操作过于频繁，请稍后再试' });
      }

      db.prepare(`
        UPDATE rate_limits SET count = count + 1
        WHERE user_id = ? AND action = ?
      `).run(userId, action);
    } else {
      db.prepare(`
        INSERT INTO rate_limits (user_id, action, count)
        VALUES (?, ?, 1)
      `).run(userId, action);
    }

    next();
  };
}

export function checkBatchFollowRisk(userId) {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const followCount = db.prepare(`
    SELECT COUNT(*) as count FROM relations
    WHERE follower_id = ? AND created_at > ?
  `).get(userId, oneHourAgo).count;

  if (followCount >= 30) {
    db.prepare(`
      INSERT OR IGNORE INTO risk_records (user_id, type, description, severity)
      VALUES (?, 'batch_follow', ?, 2)
    `).run(userId, `1小时内关注 ${followCount} 人，疑似批量关注`);
    return true;
  }
  return false;
}
