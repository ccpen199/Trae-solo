import { Router, Request, Response } from 'express';
import { getDB } from '../db/init';
import { auth, adminAuth } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDB();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const level = req.query.level as string;
  const verified = req.query.verified as string;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (level) {
    where += ' AND c.creator_level = ?';
    params.push(parseInt(level));
  }
  if (verified !== undefined) {
    where += ' AND c.verified = ?';
    params.push(verified === 'true' ? 1 : 0);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM creators c ${where}`).get(...params) as any).count;
  const rows = db.prepare(`
    SELECT c.*, u.username, u.avatar_url FROM creators c
    LEFT JOIN users u ON c.user_id = u.id
    ${where}
    ORDER BY c.follower_count DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  res.json({ data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const creator = db.prepare(`
    SELECT c.*, u.username, u.avatar_url FROM creators c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id) as any;

  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }

  res.json(creator);
});

router.post('/apply', auth, (req: Request, res: Response) => {
  const db = getDB();

  const existing = db.prepare('SELECT id FROM creators WHERE user_id = ?').get(req.user!.id);
  if (existing) {
    res.status(409).json({ error: 'Already a creator' });
    return;
  }

  const { creator_name, bio } = req.body;
  const result = db.prepare(`
    INSERT INTO creators (user_id, creator_name, bio)
    VALUES (?, ?, ?)
  `).run(req.user!.id, creator_name || req.user!.username, bio || null);

  db.prepare("UPDATE users SET role = 'creator' WHERE id = ?").run(req.user!.id);

  res.status(201).json({ id: Number(result.lastInsertRowid), creator_name: creator_name || req.user!.username });
});

router.put('/:id', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const creator = db.prepare('SELECT user_id FROM creators WHERE id = ?').get(id) as any;
  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }
  if (creator.user_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const { creator_name, bio, business_whitelist } = req.body;
  const fields: string[] = [];
  const values: any[] = [];

  if (creator_name !== undefined) { fields.push('creator_name = ?'); values.push(creator_name); }
  if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
  if (business_whitelist !== undefined) { fields.push('business_whitelist = ?'); values.push(JSON.stringify(business_whitelist)); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  db.prepare(`UPDATE creators SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/level', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const { creator_level } = req.body;

  if (creator_level === undefined || creator_level < 1 || creator_level > 10) {
    res.status(400).json({ error: 'Valid creator_level (1-10) required' });
    return;
  }

  db.prepare('UPDATE creators SET creator_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(creator_level, id);
  const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(id);
  res.json(updated);
});

router.get('/:id/content', (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const creator = db.prepare('SELECT user_id FROM creators WHERE id = ?').get(id) as any;
  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }

  const news = db.prepare(`
    SELECT * FROM news WHERE author_id = ? AND status = 'published' ORDER BY created_at DESC
  `).all(creator.user_id);

  const videos = db.prepare(`
    SELECT * FROM videos WHERE author_id = ? AND status = 'published' ORDER BY created_at DESC
  `).all(creator.user_id);

  res.json({ news, videos });
});

router.post('/:id/follow', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const creator = db.prepare('SELECT id, user_id FROM creators WHERE id = ?').get(id) as any;
  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }

  const existing = db.prepare('SELECT id FROM user_follows WHERE user_id = ? AND creator_id = ?').get(req.user!.id, id);
  if (existing) {
    db.prepare('DELETE FROM user_follows WHERE user_id = ? AND creator_id = ?').run(req.user!.id, id);
    db.prepare('UPDATE creators SET follower_count = follower_count - 1 WHERE id = ?').run(id);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO user_follows (user_id, creator_id) VALUES (?, ?)').run(req.user!.id, id);
    db.prepare('UPDATE creators SET follower_count = follower_count + 1 WHERE id = ?').run(id);
    res.json({ following: true });
  }
});

router.get('/:id/stats', (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const creator = db.prepare('SELECT user_id FROM creators WHERE id = ?').get(id) as any;
  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }

  const newsStats = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(view_count), 0) as total_views, COALESCE(SUM(like_count), 0) as total_likes
    FROM news WHERE author_id = ? AND status = 'published'
  `).get(creator.user_id) as any;

  const videoStats = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(view_count), 0) as total_views, COALESCE(SUM(like_count), 0) as total_likes
    FROM videos WHERE author_id = ? AND status = 'published'
  `).get(creator.user_id) as any;

  const creatorInfo = db.prepare('SELECT * FROM creators WHERE id = ?').get(id) as any;

  res.json({
    news: newsStats,
    videos: videoStats,
    follower_count: creatorInfo?.follower_count || 0,
    creator_level: creatorInfo?.creator_level || 1,
    originality_coefficient: creatorInfo?.originality_coefficient || 0.5,
  });
});

export default router;
