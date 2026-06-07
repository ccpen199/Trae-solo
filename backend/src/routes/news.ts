import { Router, Request, Response } from 'express';
import { getDB } from '../db/init';
import { auth, optionalAuth } from '../middleware/auth';
import { findNearby, getHotspots } from '../services/lbs';
import { getRecommendations, recordBehavior } from '../services/recommendation';

const router = Router();

router.get('/', optionalAuth, (req: Request, res: Response) => {
  const db = getDB();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const region = req.query.region as string;
  const offset = (page - 1) * limit;

  let where = "WHERE status = 'published'";
  const params: any[] = [];

  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  if (region) {
    where += ' AND region_tags LIKE ?';
    params.push(`%"${region}"%`);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM news ${where}`).get(...params) as any).count;
  const rows = db.prepare(`
    SELECT n.*, u.nickname as author_name FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    ${where}
    ORDER BY (n.time_decay_factor * n.source_credibility) DESC, n.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  res.json({ data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 5;
  const limit = parseInt(req.query.limit as string) || 20;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'Valid lat and lng required' });
    return;
  }

  const results = findNearby(lat, lng, radius, 'news', limit);
  res.json({ data: results, radius_km: radius });
});

router.get('/hotspot', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 1;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'Valid lat and lng required' });
    return;
  }

  const results = getHotspots(lat, lng, radius);
  res.json({ data: results });
});

router.get('/recommendations', auth, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const results = getRecommendations(req.user!.id, 'news', limit);
  res.json({ data: results });
});

router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const news = db.prepare(`
    SELECT n.*, u.nickname as author_name FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = ?
  `).get(id) as any;

  if (!news) {
    res.status(404).json({ error: 'News not found' });
    return;
  }

  db.prepare('UPDATE news SET view_count = view_count + 1 WHERE id = ?').run(id);
  news.view_count += 1;

  if (req.user) {
    recordBehavior(req.user.id, 'view', 'news', id, 0);
  }

  res.json(news);
});

router.post('/', auth, (req: Request, res: Response) => {
  const db = getDB();
  const creator = db.prepare('SELECT id FROM creators WHERE user_id = ?').get(req.user!.id);
  if (!creator && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Creator access required' });
    return;
  }

  const { title, content, summary, cover_url, source_name, source_credibility, time_decay_factor, region_tags, latitude, longitude, radius_km, category } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO news (title, content, summary, cover_url, source_name, source_credibility, time_decay_factor, region_tags, latitude, longitude, radius_km, category, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, content, summary || null, cover_url || null, source_name || null,
    source_credibility || 0.5, time_decay_factor || 1.0,
    region_tags ? JSON.stringify(region_tags) : '[]',
    latitude || 0, longitude || 0, radius_km || 5, category || 'general', req.user!.id
  );

  res.status(201).json({ id: Number(result.lastInsertRowid), title });
});

router.put('/:id', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const news = db.prepare('SELECT author_id FROM news WHERE id = ?').get(id) as any;
  if (!news) {
    res.status(404).json({ error: 'News not found' });
    return;
  }
  if (news.author_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['title', 'content', 'summary', 'cover_url', 'source_name', 'source_credibility', 'time_decay_factor', 'region_tags', 'latitude', 'longitude', 'radius_km', 'category', 'status'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'region_tags' ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  db.prepare(`UPDATE news SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/:id/like', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const news = db.prepare('SELECT id FROM news WHERE id = ?').get(id);
  if (!news) {
    res.status(404).json({ error: 'News not found' });
    return;
  }

  const existing = db.prepare('SELECT id FROM user_likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user!.id, 'news', id);
  if (existing) {
    db.prepare('DELETE FROM user_likes WHERE user_id = ? AND target_type = ? AND target_id = ?').run(req.user!.id, 'news', id);
    db.prepare('UPDATE news SET like_count = like_count - 1 WHERE id = ?').run(id);
    recordBehavior(req.user!.id, 'unlike', 'news', id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO user_likes (user_id, target_type, target_id) VALUES (?, ?, ?)').run(req.user!.id, 'news', id);
    db.prepare('UPDATE news SET like_count = like_count + 1 WHERE id = ?').run(id);
    recordBehavior(req.user!.id, 'like', 'news', id);
    res.json({ liked: true });
  }
});

export default router;
