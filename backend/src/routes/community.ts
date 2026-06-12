import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';
import { filterSensitiveWords } from '../utils';

const router = Router();

router.get('/topics', authMiddleware, (req: AuthRequest, res) => {
  const { tag, keyword, status } = req.query;
  let sql = 'SELECT t.*, u.name as user_name, u.avatar FROM community_topics t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1';
  const params: any[] = [];
  if (status && (req.user!.role === 'hr' || req.user!.role === 'admin' || req.user!.role === 'trainer')) {
    sql += ' AND t.status = ?'; params.push(status);
  } else {
    sql += ' AND t.status = ?'; params.push('approved');
  }
  if (tag) { sql += ' AND t.tags LIKE ?'; params.push(`%${tag}%`); }
  if (keyword) { sql += ' AND (t.title LIKE ? OR t.content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY t.created_at DESC LIMIT 100';
  const topics = db.prepare(sql).all(...params);
  res.json({ topics: topics.map((t: any) => ({ ...t, tags: t.tags ? JSON.parse(t.tags) : [] })) });
});

router.post('/topics', authMiddleware, rbacMiddleware('community', 'create'), auditMiddleware('create_topic', 'topic'), (req: AuthRequest, res) => {
  const { title, content, tags = [] } = req.body;
  if (!title || !content) return res.status(400).json({ error: '标题和内容必填' });
  const filtered = filterSensitiveWords(content);
  const filteredTitle = filterSensitiveWords(title);
  const id = uuidv4();
  const isApproved = !filtered.blocked && !filteredTitle.blocked ? 1 : 0;
  const status = isApproved ? 'approved' : 'pending';
  db.prepare('INSERT INTO community_topics (id, tenant_id, user_id, title, content, tags, status, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user!.tenantId, req.user!.id, filteredTitle.text, filtered.text, JSON.stringify(tags), status, isApproved);
  if (!isApproved) return res.json({ id, warning: '内容包含敏感信息，需审核后发布' });
  db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(req.user!.id);
  res.json({ id });
});

router.get('/topics/:id', authMiddleware, (req: AuthRequest, res) => {
  const t = db.prepare('SELECT t.*, u.name as user_name, u.avatar FROM community_topics t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ?').get(req.params.id) as any;
  if (!t) return res.status(404).json({ error: '话题不存在' });
  db.prepare('UPDATE community_topics SET views = views + 1 WHERE id = ?').run(req.params.id);
  const comments = db.prepare('SELECT c.*, u.name as user_name, u.avatar FROM community_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.topic_id = ? AND c.is_approved = 1 ORDER BY c.created_at ASC').all(req.params.id);
  res.json({ topic: { ...t, tags: t.tags ? JSON.parse(t.tags) : [] }, comments });
});

router.post('/topics/:id/comments', authMiddleware, auditMiddleware('comment_topic', 'comment'), (req: AuthRequest, res) => {
  const { content, parentId } = req.body;
  if (!content) return res.status(400).json({ error: '评论内容必填' });
  const filtered = filterSensitiveWords(content);
  const id = uuidv4();
  db.prepare('INSERT INTO community_comments (id, topic_id, user_id, content, parent_id, is_approved) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, req.user!.id, filtered.text, parentId || null, filtered.blocked ? 0 : 1);
  if (!filtered.blocked) {
    db.prepare('UPDATE community_topics SET comments = comments + 1 WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE users SET points = points + 2 WHERE id = ?').run(req.user!.id);
  }
  res.json({ id, blocked: filtered.blocked });
});

router.post('/topics/:id/like', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('UPDATE community_topics SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/topics/:id/approve', authMiddleware, rbacMiddleware('community', 'update'), auditMiddleware('approve_topic', 'topic'), (req: AuthRequest, res) => {
  const { approved } = req.body;
  db.prepare('UPDATE community_topics SET is_approved = ?, status = ? WHERE id = ? AND tenant_id = ?')
    .run(approved ? 1 : 0, approved ? 'approved' : 'rejected', req.params.id, req.user!.tenantId);
  if (approved) {
    const topic = db.prepare('SELECT user_id FROM community_topics WHERE id = ?').get(req.params.id) as any;
    if (topic) db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(topic.user_id);
  }
  res.json({ success: true });
});

router.get('/stats/summary', authMiddleware, (req: AuthRequest, res) => {
  const topicCount = db.prepare('SELECT COUNT(*) as cnt FROM community_topics WHERE tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  const commentCount = db.prepare('SELECT COUNT(*) as cnt FROM community_comments c JOIN community_topics t ON c.topic_id = t.id WHERE t.tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  const pendingCount = db.prepare('SELECT COUNT(*) as cnt FROM community_topics WHERE tenant_id = ? AND status = ?').get(req.user!.tenantId, 'pending') as { cnt: number };
  const topUsers = db.prepare(`SELECT u.id, u.name, u.avatar, u.points FROM users u WHERE u.tenant_id = ? ORDER BY u.points DESC LIMIT 10`).all(req.user!.tenantId);
  const hotTopics = db.prepare('SELECT id, title, views, likes, comments FROM community_topics WHERE tenant_id = ? AND status = ? ORDER BY (views + likes * 2 + comments * 5) DESC LIMIT 5').all(req.user!.tenantId, 'approved');
  res.json({ stats: { topicCount: topicCount.cnt, commentCount: commentCount.cnt, pendingCount: pendingCount.cnt, topUsers, hotTopics } });
});

router.get('/ranking/users', authMiddleware, (req: AuthRequest, res) => {
  const users = db.prepare('SELECT id, name, avatar, points, role FROM users WHERE tenant_id = ? ORDER BY points DESC LIMIT 50').all(req.user!.tenantId);
  res.json({ ranking: users });
});

export default router;
