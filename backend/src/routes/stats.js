import express from 'express';
import db from '../database/index.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/overview', (req, res) => {
  const days = parseInt(req.query.days || 7);

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM relations WHERE created_at >= datetime('now', ?)) as new_relations,
      (SELECT COUNT(*) FROM friendships WHERE status = 1 AND created_at >= datetime('now', ?)) as new_friendships,
      (SELECT COUNT(*) FROM relations WHERE status = 0 AND updated_at >= datetime('now', ?)) as unfollows,
      (SELECT COUNT(*) FROM recommendations WHERE status = 1 AND created_at >= datetime('now', ?)) as rec_accepted,
      (SELECT COUNT(*) FROM recommendations WHERE created_at >= datetime('now', ?)) as rec_total,
      (SELECT COUNT(*) FROM reports WHERE created_at >= datetime('now', ?)) as reports
  `).get(`-${days} days`, `-${days} days`, `-${days} days`, `-${days} days`, `-${days} days`, `-${days} days`);

  const totalStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM relations WHERE status = 1) as total_follows,
      (SELECT COUNT(*) FROM friendships WHERE status = 1) as total_friendships,
      (SELECT COUNT(*) FROM users WHERE status = 1) as total_users
  `).get();

  const mutualFollowCount = db.prepare(`
    SELECT COUNT(*) / 2 as count
    FROM relations r1
    JOIN relations r2 ON r1.follower_id = r2.following_id AND r1.following_id = r2.follower_id
    WHERE r1.status = 1 AND r2.status = 1 AND r1.follower_id < r1.following_id
  `).get().count;

  const followRate = stats.rec_total > 0 ? ((stats.rec_accepted / stats.rec_total) * 100).toFixed(2) : 0;
  const unfollowRate = stats.new_relations > 0 ? ((stats.unfollows / stats.new_relations) * 100).toFixed(2) : 0;
  const reportRate = totalStats.total_users > 0 ? ((stats.reports / totalStats.total_users) * 100).toFixed(2) : 0;
  const mutualRate = totalStats.total_follows > 0 ? ((mutualFollowCount / totalStats.total_follows * 2) * 100).toFixed(2) : 0;

  res.json({
    ...stats,
    ...totalStats,
    mutual_follows: mutualFollowCount,
    mutual_rate: mutualRate,
    follow_conversion_rate: followRate,
    unfollow_rate: unfollowRate,
    report_rate: reportRate
  });
});

router.get('/trend', (req, res) => {
  const days = parseInt(req.query.days || 7);

  const data = db.prepare(`
    SELECT 
      date(created_at) as date,
      SUM(CASE WHEN action = 'follow' THEN 1 ELSE 0 END) as follows,
      SUM(CASE WHEN action = 'unfollow' THEN 1 ELSE 0 END) as unfollows,
      SUM(CASE WHEN action = 'friend_request' THEN 1 ELSE 0 END) as friend_requests,
      SUM(CASE WHEN action = 'friend_accept' THEN 1 ELSE 0 END) as friend_accepts
    FROM action_logs
    WHERE created_at >= datetime('now', ?)
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).all(`-${days} days`);

  res.json({ list: data });
});

router.get('/user-trail/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const { page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  const logs = db.prepare(`
    SELECT 
      al.*,
      u.nickname as target_nickname,
      u.username as target_username
    FROM action_logs al
    LEFT JOIN users u ON al.target_id = u.id
    WHERE al.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(pageSize), offset);

  const relationStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM relations WHERE follower_id = ? AND status = 1) as following_count,
      (SELECT COUNT(*) FROM relations WHERE following_id = ? AND status = 1) as follower_count,
      (SELECT COUNT(*) FROM friendships WHERE (user_id1 = ? OR user_id2 = ?) AND status = 1) as friend_count,
      (SELECT COUNT(*) FROM blacklist WHERE user_id = ?) as blacklist_count,
      (SELECT COUNT(*) FROM reports WHERE reported_user_id = ?) as report_count
  `).get(userId, userId, userId, userId, userId, userId);

  const total = db.prepare('SELECT COUNT(*) as count FROM action_logs WHERE user_id = ?').get(userId).count;

  res.json({
    logs: { list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) },
    stats: relationStats
  });
});

export default router;
