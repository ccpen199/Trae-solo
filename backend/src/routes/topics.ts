import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity } from '../middleware/auth';
import { filterSensitiveWords } from '../utils/sensitive-words';
import type { AuthenticatedRequest, Topic } from '../types';

const router = Router();

router.get('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const category = req.query.category as string;
  const communityId = authReq.community!.id;

  const db = getDb();
  let whereClause = 'WHERE t.community_id = ? AND t.status = ?';
  const params: any[] = [communityId, 'active'];

  if (category) {
    whereClause += ' AND t.category = ?';
    params.push(category);
  }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM topics t ${whereClause}`).get(...params) as any).cnt;
  const topics = db.prepare(
    `SELECT t.*, r.real_name as author_name FROM topics t JOIN residents r ON t.resident_id = r.id ${whereClause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({
    success: true,
    data: { items: topics, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.get('/aggregated', verifyToken, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const topics = db.prepare(
    `SELECT t.*, r.real_name as author_name, c.name as community_name,
     (t.view_count * 0.3 + t.like_count * 0.5 + t.comment_count * 0.2) as recommendation_score
     FROM topics t
     JOIN residents r ON t.resident_id = r.id
     JOIN communities c ON t.community_id = c.id
     WHERE t.status = ? AND t.is_filtered = 0
     ORDER BY recommendation_score DESC
     LIMIT ? OFFSET ?`
  ).all('active', limit, offset);

  const total = (db.prepare('SELECT COUNT(*) as cnt FROM topics WHERE status = ? AND is_filtered = 0').get('active') as any).cnt;

  res.json({
    success: true,
    data: { items: topics, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.post('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { title, content, geo_lat, geo_lng, geo_label, category } = req.body;

  if (!title || !content || !category) {
    res.status(400).json({ success: false, error: '标题、内容和分类不能为空' });
    return;
  }

  const validCategories = ['discussion', 'secondhand', 'activity', 'complaint'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ success: false, error: '无效的话题分类' });
    return;
  }

  const titleFilter = filterSensitiveWords(title);
  const contentFilter = filterSensitiveWords(content);

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO topics (community_id, resident_id, title, content, geo_lat, geo_lng, geo_label, category, is_filtered, filter_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    authReq.community!.id,
    authReq.user!.id,
    titleFilter.filtered,
    contentFilter.filtered,
    geo_lat || null,
    geo_lng || null,
    geo_label || null,
    category,
    contentFilter.hasFiltered ? 1 : 0,
    contentFilter.hasFiltered ? `包含敏感词: ${contentFilter.matchedWords.join(', ')}` : null
  );

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: topic });
});

router.get('/:id', verifyToken, (req, res) => {
  const db = getDb();
  const topic = db.prepare(
    'SELECT t.*, r.real_name as author_name FROM topics t JOIN residents r ON t.resident_id = r.id WHERE t.id = ?'
  ).get(req.params.id) as Topic & { author_name: string } | undefined;

  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' });
    return;
  }

  db.prepare('UPDATE topics SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  topic.view_count += 1;

  const comments = db.prepare(
    'SELECT tc.*, r.real_name as author_name FROM topic_comments tc JOIN residents r ON tc.resident_id = r.id WHERE tc.topic_id = ? ORDER BY tc.created_at ASC'
  ).all(req.params.id);

  res.json({ success: true, data: { ...topic, comments } });
});

router.post('/:id/like', verifyToken, (req, res) => {
  const db = getDb();
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id) as Topic | undefined;

  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' });
    return;
  }

  db.prepare('UPDATE topics SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);

  const updated = db.prepare('SELECT id, like_count FROM topics WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.post('/:id/comments', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ success: false, error: '评论内容不能为空' });
    return;
  }

  const db = getDb();
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id) as Topic | undefined;

  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' });
    return;
  }

  const contentFilter = filterSensitiveWords(content);

  const result = db.prepare(
    'INSERT INTO topic_comments (topic_id, resident_id, content, is_filtered) VALUES (?, ?, ?, ?)'
  ).run(parseInt(req.params.id as string), authReq.user!.id, contentFilter.filtered, contentFilter.hasFiltered ? 1 : 0);

  db.prepare('UPDATE topics SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.id);

  const comment = db.prepare(
    'SELECT tc.*, r.real_name as author_name FROM topic_comments tc JOIN residents r ON tc.resident_id = r.id WHERE tc.id = ?'
  ).get(result.lastInsertRowid);

  res.status(201).json({ success: true, data: comment });
});

export default router;
