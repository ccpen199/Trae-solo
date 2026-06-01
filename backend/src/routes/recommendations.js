import express from 'express';
import db from '../database/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

function calculateRecommendationScore(user, targetUser, mutualFollowingCount) {
  let score = 0;
  let reasons = [];

  const userInterests = new Set((user.interests || '').split(',').filter(Boolean));
  const targetInterests = new Set((targetUser.interests || '').split(',').filter(Boolean));
  const commonInterests = [...userInterests].filter(x => targetInterests.has(x));

  if (commonInterests.length > 0) {
    score += commonInterests.length * 10;
    reasons.push({ type: 'interest', text: `共同兴趣：${commonInterests.slice(0, 3).join('、')}` });
  }

  if (user.location && targetUser.location && user.location === targetUser.location) {
    score += 15;
    reasons.push({ type: 'location', text: `同在${user.location}` });
  }

  if (mutualFollowingCount > 0) {
    score += mutualFollowingCount * 5;
    reasons.push({ type: 'mutual', text: `${mutualFollowingCount}位共同关注` });
  }

  return { score, reasons };
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const existingRecs = db.prepare(`
    SELECT r.*, u.nickname, u.avatar, u.bio, u.location, u.interests
    FROM recommendations r
    JOIN users u ON r.recommended_user_id = u.id
    WHERE r.user_id = ? AND r.status = 0 AND u.status = 1
    ORDER BY r.score DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(pageSize), offset);

  if (existingRecs.length > 0) {
    const total = db.prepare('SELECT COUNT(*) as count FROM recommendations WHERE user_id = ? AND status = 0').get(req.user.id).count;
    return res.json({ list: existingRecs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const followingIds = db.prepare('SELECT following_id FROM relations WHERE follower_id = ? AND status = 1').all(req.user.id).map(r => r.following_id);
  const blockedIds = db.prepare('SELECT blocked_user_id FROM blacklist WHERE user_id = ?').all(req.user.id).map(b => b.blocked_user_id);
  const blockedByIds = db.prepare('SELECT user_id FROM blacklist WHERE blocked_user_id = ?').all(req.user.id).map(b => b.user_id);

  const excludeIds = [...followingIds, ...blockedIds, ...blockedByIds, req.user.id];
  const placeholders = excludeIds.map(() => '?').join(',');

  const candidateUsers = db.prepare(`
    SELECT * FROM users 
    WHERE id NOT IN (${placeholders}) AND status = 1
    ORDER BY id DESC LIMIT 100
  `).all(...excludeIds);

  const recommendations = candidateUsers.map(targetUser => {
    const mutualFollowingCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM relations r1
      JOIN relations r2 ON r1.following_id = r2.following_id
      WHERE r1.follower_id = ? AND r2.follower_id = ? AND r1.status = 1 AND r2.status = 1
    `).get(req.user.id, targetUser.id).count;

    const { score, reasons } = calculateRecommendationScore(user, targetUser, mutualFollowingCount);

    return {
      userId: targetUser.id,
      score,
      reasons,
      reasonText: reasons.map(r => r.text).join('；')
    };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

  const insertRec = db.prepare(`
    INSERT OR IGNORE INTO recommendations (user_id, recommended_user_id, reason, reason_type, score, status)
    VALUES (?, ?, ?, ?, ?, 0)
  `);

  recommendations.forEach(rec => {
    insertRec.run(req.user.id, rec.userId, rec.reasonText, rec.reasons[0]?.type || 'other', rec.score);
  });

  const result = recommendations.slice(0, pageSize).map(rec => ({
    id: rec.userId,
    recommended_user_id: rec.userId,
    score: rec.score,
    reason: rec.reasonText,
    reason_type: rec.reasons[0]?.type || 'other',
    nickname: candidateUsers.find(u => u.id === rec.userId)?.nickname,
    avatar: candidateUsers.find(u => u.id === rec.userId)?.avatar,
    bio: candidateUsers.find(u => u.id === rec.userId)?.bio,
  }));

  res.json({ list: result, total: recommendations.length, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/:userId/accept', (req, res) => {
  const userId = parseInt(req.params.userId);

  db.prepare(`
    UPDATE recommendations SET status = 1 
    WHERE user_id = ? AND recommended_user_id = ?
  `).run(req.user.id, userId);

  res.json({ success: true });
});

router.post('/:userId/reject', (req, res) => {
  const userId = parseInt(req.params.userId);

  db.prepare(`
    UPDATE recommendations SET status = 2 
    WHERE user_id = ? AND recommended_user_id = ?
  `).run(req.user.id, userId);

  res.json({ success: true });
});

export default router;
