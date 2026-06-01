const express = require('express');
const db = require('../database');
const { authenticateToken, logBehavior } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { type, city, category, keyword, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM communities WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (city) {
    sql += ' AND city = ?';
    params.push(city);
  }
  if (category) {
    sql += ' AND category LIKE ?';
    params.push(`%${category}%`);
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY member_count DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const communities = db.prepare(sql).all(...params);

  if (req.user) {
    const memberships = db.prepare(`
      SELECT community_id FROM community_members WHERE user_id = ?
    `).all(req.user.id).map(m => m.community_id);
    
    communities.forEach(c => {
      c.is_member = memberships.includes(c.id);
    });
  }

  res.json({ communities });
});

router.get('/:id', (req, res) => {
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  if (req.user) {
    const membership = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    community.is_member = !!membership;
  } else {
    community.is_member = false;
  }

  res.json({ community });
});

router.post('/:id/join', authenticateToken, (req, res) => {
  const communityId = req.params.id;

  const existing = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?')
    .get(communityId, req.user.id);
  
  if (existing) {
    return res.json({ message: 'Already a member', member_id: existing.id, is_member: true });
  }

  const result = db.prepare('INSERT INTO community_members (community_id, user_id) VALUES (?, ?)')
    .run(communityId, req.user.id);

  db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?')
    .run(communityId);

  res.json({ message: 'Joined community successfully', member_id: result.lastInsertRowid, is_member: true });
});

router.get('/:id/posts', (req, res) => {
  const communityId = req.params.id;
  const { type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT cp.*, u.username, u.avatar,
           CASE WHEN cp.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as display_name
    FROM community_posts cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.community_id = ?
  `;
  const params = [communityId];

  if (type) {
    sql += ' AND cp.type = ?';
    params.push(type);
  }

  const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY[\s\S]*$/, '');
  const { count = 0 } = db.prepare(countSql).get(...params.slice(0, params.length - 2)) || {};

  sql += ' ORDER BY cp.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const posts = db.prepare(sql).all(...params);

  res.json({ posts, total: count });
});

router.post('/:id/posts', authenticateToken, logBehavior('create_post', 'post'), (req, res) => {
  const communityId = req.params.id;
  const { title, content, is_anonymous = 0, type = 'question' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const isMember = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?')
    .get(communityId, req.user.id);
  
  if (!isMember) {
    return res.status(403).json({ error: 'Must join community first' });
  }

  const result = db.prepare(`
    INSERT INTO community_posts (community_id, user_id, title, content, is_anonymous, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(communityId, req.user.id, title, content, is_anonymous ? 1 : 0, type);

  res.json({ id: result.lastInsertRowid, message: 'Post created successfully' });
});

router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`
    SELECT cp.*, c.name as community_name,
           CASE WHEN cp.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as author_name,
           u.avatar as author_avatar
    FROM community_posts cp
    JOIN communities c ON cp.community_id = c.id
    JOIN users u ON cp.user_id = u.id
    WHERE cp.id = ?
  `).get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  db.prepare('UPDATE community_posts SET view_count = view_count + 1 WHERE id = ?')
    .run(req.params.id);

  const referral = post.type === 'referral' ? 
    db.prepare('SELECT * FROM referrals WHERE post_id = ?').get(post.id) : null;

  res.json({ post, referral });
});

router.post('/posts/:id/report', authenticateToken, logBehavior('report', 'post'), (req, res) => {
  const { reason, description } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  db.prepare(`
    INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
    VALUES (?, 'post', ?, ?, ?)
  `).run(req.user.id, req.params.id, reason, description);

  res.json({ message: 'Report submitted successfully' });
});

module.exports = router;
