import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../db/init';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username, password, nickname, device_fingerprint } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }
  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, nickname, device_fingerprint) VALUES (?, ?, ?, ?)'
  ).run(username, hash, nickname || username, device_fingerprint || null);

  if (device_fingerprint) {
    db.prepare('UPDATE users SET device_fingerprint = ? WHERE id = ?').run(device_fingerprint, Number(result.lastInsertRowid));
  }

  db.prepare('INSERT INTO user_lili_beans (user_id, balance, total_earned, total_spent) VALUES (?, 0, 0, 0)').run(Number(result.lastInsertRowid));

  const secret = process.env.JWT_SECRET || 'default_secret';
  const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, secret, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: result.lastInsertRowid, username, nickname: nickname || username, role: 'user' } });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const secret = process.env.JWT_SECRET || 'default_secret';
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      role: user.role,
      latitude: user.latitude,
      longitude: user.longitude,
    },
  });
});

router.get('/profile', auth, (req: Request, res: Response) => {
  const db = getDB();
  const user = db.prepare(
    'SELECT id, username, nickname, avatar_url, latitude, longitude, lbs_accuracy, device_fingerprint, reading_profile, total_reading_time, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const beans = db.prepare('SELECT balance, total_earned, total_spent FROM user_lili_beans WHERE user_id = ?').get(req.user!.id) as any;
  res.json({ ...user, lili_beans: beans || { balance: 0, total_earned: 0, total_spent: 0 } });
});

router.put('/profile', auth, (req: Request, res: Response) => {
  const { nickname, avatar_url, reading_profile } = req.body;
  const db = getDB();
  const updates: string[] = [];
  const values: any[] = [];

  if (nickname !== undefined) { updates.push('nickname = ?'); values.push(nickname); }
  if (avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(avatar_url); }
  if (reading_profile !== undefined) { updates.push('reading_profile = ?'); values.push(typeof reading_profile === 'string' ? reading_profile : JSON.stringify(reading_profile)); }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(req.user!.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const user = db.prepare('SELECT id, username, nickname, avatar_url, latitude, longitude, reading_profile, role FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

router.put('/location', auth, (req: Request, res: Response) => {
  const { latitude, longitude, accuracy } = req.body;
  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'Latitude and longitude required' });
    return;
  }
  const db = getDB();
  db.prepare('UPDATE users SET latitude = ?, longitude = ?, lbs_accuracy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(latitude, longitude, accuracy || 0, req.user!.id);
  res.json({ latitude, longitude, accuracy: accuracy || 0 });
});

router.post('/device-fingerprint', auth, (req: Request, res: Response) => {
  const { device_fingerprint } = req.body;
  if (!device_fingerprint) {
    res.status(400).json({ error: 'Device fingerprint required' });
    return;
  }
  const db = getDB();
  db.prepare('UPDATE users SET device_fingerprint = ? WHERE id = ?').run(device_fingerprint, req.user!.id);
  res.json({ success: true });
});

export default router;
