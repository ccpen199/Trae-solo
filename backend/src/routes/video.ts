import { Router, Request, Response } from 'express';
import { getDB } from '../db/init';
import { auth, optionalAuth } from '../middleware/auth';
import { findNearby } from '../services/lbs';
import { getRecommendations, recordBehavior } from '../services/recommendation';

const router = Router();

router.get('/', optionalAuth, (req: Request, res: Response) => {
  const db = getDB();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const offset = (page - 1) * limit;

  let where = "WHERE status = 'published'";
  const params: any[] = [];

  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM videos ${where}`).get(...params) as any).count;
  const rows = db.prepare(`
    SELECT v.*, u.nickname as author_name FROM videos v
    LEFT JOIN users u ON v.author_id = u.id
    ${where}
    ORDER BY v.created_at DESC
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

  const results = findNearby(lat, lng, radius, 'video', limit);
  res.json({ data: results, radius_km: radius });
});

router.get('/recommendations', auth, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const results = getRecommendations(req.user!.id, 'video', limit);
  res.json({ data: results });
});

router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const video = db.prepare(`
    SELECT v.*, u.nickname as author_name FROM videos v
    LEFT JOIN users u ON v.author_id = u.id
    WHERE v.id = ?
  `).get(id) as any;

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  db.prepare('UPDATE videos SET view_count = view_count + 1 WHERE id = ?').run(id);
  video.view_count += 1;

  if (req.user) {
    recordBehavior(req.user!.id, 'view', 'video', id, 0);
  }

  res.json(video);
});

router.post('/', auth, (req: Request, res: Response) => {
  const db = getDB();
  const creator = db.prepare('SELECT id FROM creators WHERE user_id = ?').get(req.user!.id);
  if (!creator && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Creator access required' });
    return;
  }

  const { title, description, cover_url, video_url, duration, latitude, longitude, category, interaction_hotspots } = req.body;
  if (!title || !video_url) {
    res.status(400).json({ error: 'Title and video_url required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO videos (title, description, cover_url, video_url, duration, latitude, longitude, category, interaction_hotspots, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, description || null, cover_url || null, video_url,
    duration || 0, latitude || 0, longitude || 0, category || 'general',
    interaction_hotspots ? JSON.stringify(interaction_hotspots) : '[]',
    req.user!.id
  );

  res.status(201).json({ id: Number(result.lastInsertRowid), title });
});

router.put('/:id', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const video = db.prepare('SELECT author_id FROM videos WHERE id = ?').get(id) as any;
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }
  if (video.author_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['title', 'description', 'cover_url', 'video_url', 'duration', 'play_completion_rate', 'latitude', 'longitude', 'category', 'status'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (req.body.interaction_hotspots !== undefined) {
    fields.push('interaction_hotspots = ?');
    values.push(JSON.stringify(req.body.interaction_hotspots));
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  db.prepare(`UPDATE videos SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/:id/like', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const video = db.prepare('SELECT id FROM videos WHERE id = ?').get(id);
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  const existing = db.prepare('SELECT id FROM user_likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user!.id, 'video', id);
  if (existing) {
    db.prepare('DELETE FROM user_likes WHERE user_id = ? AND target_type = ? AND target_id = ?').run(req.user!.id, 'video', id);
    db.prepare('UPDATE videos SET like_count = like_count - 1 WHERE id = ?').run(id);
    recordBehavior(req.user!.id, 'unlike', 'video', id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO user_likes (user_id, target_type, target_id) VALUES (?, ?, ?)').run(req.user!.id, 'video', id);
    db.prepare('UPDATE videos SET like_count = like_count + 1 WHERE id = ?').run(id);
    recordBehavior(req.user!.id, 'like', 'video', id);
    res.json({ liked: true });
  }
});

router.post('/:id/play-event', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const { play_completion_rate, dwell_time } = req.body;

  const video = db.prepare('SELECT id, play_completion_rate FROM videos WHERE id = ?').get(id) as any;
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (play_completion_rate !== undefined) {
    const newRate = (video.play_completion_rate + play_completion_rate) / 2;
    db.prepare('UPDATE videos SET play_completion_rate = ? WHERE id = ?').run(newRate, id);
  }

  recordBehavior(req.user!.id, 'view', 'video', id, dwell_time || 0);
  res.json({ success: true });
});

export default router;
