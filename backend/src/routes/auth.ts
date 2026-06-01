import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, rowToUser } from '../db.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.post('/login', (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const userRow = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!userRow) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const userWithPass = {
    ...rowToUser(userRow),
    passwordHash: userRow.password_hash
  };

  if (!userWithPass || userWithPass.status !== 'active') {
    res.status(401).json({ error: 'Account disabled' });
    return;
  }

  const isValid = bcrypt.compareSync(password, userWithPass.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const sessionResult = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(token, userWithPass.id, expiresAt);

  const sessionId = sessionResult.lastInsertRowid as number;
  const jwtToken = generateToken(userWithPass.id, sessionId);

  logAudit(userWithPass.id, 'login', 'session', sessionId);

  const { passwordHash: _, ...user } = userWithPass;
  res.json({ token: jwtToken, user });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.session) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.session.id);
    logAudit(req.user!.id, 'logout', 'session', req.session.id);
  }
  res.json({ message: 'Logged out successfully' });
});

export default router;
