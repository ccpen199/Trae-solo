const db = require('../models/database');

function getRecommendedContent(userId, limit = 20, offset = 0) {
  const followedTopics = db.prepare(
    "SELECT following_id FROM follows WHERE follower_id = ? AND following_type = 'topic'"
  ).all(userId);

  const followedUsers = db.prepare(
    "SELECT following_id FROM follows WHERE follower_id = ? AND following_type = 'user'"
  ).all(userId);

  const readHistory = db.prepare(
    'SELECT content_id FROM reading_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(userId);

  const readIds = readHistory.map(r => r.content_id);
  const user = db.prepare('SELECT city FROM users WHERE id = ?').get(userId);

  let query = `
    SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar, u.id as author_id,
           u.role as author_role, u.creator_level as author_level, u.is_certified as author_certified,
           cl.name as author_level_name,
           (c.like_count * 3 + c.view_count * 1 + c.comment_count * 5 + c.collect_count * 2) as hot_score
    FROM contents c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN creator_levels cl ON u.creator_level = cl.id
    WHERE c.status = 'active' AND c.review_status IN ('ai_approved', 'approved')
  `;
  const params = [];

  const conditions = [];

  if (followedTopics.length > 0) {
    const topicConditions = followedTopics.map(() => `c.topic_ids LIKE '%' || ? || '%'`);
    conditions.push(`(${topicConditions.join(' OR ')})`);
    params.push(...followedTopics.map(t => t.following_id));
  }

  if (followedUsers.length > 0) {
    const userPlaceholders = followedUsers.map(() => '?').join(',');
    conditions.push(`c.user_id IN (${userPlaceholders})`);
    params.push(...followedUsers.map(u => u.following_id));
  }

  if (user && user.city) {
    conditions.push('c.city = ?');
    params.push(user.city);
  }

  if (conditions.length > 0) {
    query += ' AND (' + conditions.join(' OR ') + ')';
  }

  if (readIds.length > 0) {
    const placeholders = readIds.map(() => '?').join(',');
    query += ` AND c.id NOT IN (${placeholders})`;
    params.push(...readIds);
  }

  query += ' ORDER BY c.is_pinned DESC, c.is_featured DESC, c.like_count DESC, c.view_count DESC, c.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  let contents = db.prepare(query).all(...params);

  let scored = contents.map(c => {
    let score = 0;
    const topicIds = JSON.parse(c.topic_ids || '[]');

    if (followedTopics.length > 0 && topicIds.some(t => followedTopics.map(ft => ft.following_id).includes(t))) {
      score += 30;
    }
    if (followedUsers.length > 0 && followedUsers.map(fu => fu.following_id).includes(c.user_id)) {
      score += 25;
    }
    if (user && user.city && c.city === user.city) {
      score += 20;
    }
    score += Math.min(c.like_count * 2, 20);
    score += Math.min(c.view_count, 10);
    if (c.is_featured) score += 15;

    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (userId) {
    scored = scored.map(c => {
      const isFollowing = db.prepare(
        "SELECT 1 FROM follows WHERE follower_id = ? AND following_type = 'user' AND following_id = ?"
      ).get(userId, c.user_id);
      return { ...c, is_following_author: !!isFollowing };
    });
  }

  return scored;
}

module.exports = { getRecommendedContent };
