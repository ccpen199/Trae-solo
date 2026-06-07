import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.ts';
import { authMiddleware, signToken, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ code: -1, message: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user) {
    return res.json({ code: -1, message: 'Invalid username or password' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (!isValid) {
    return res.json({ code: -1, message: 'Invalid username or password' });
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role });

  let profile: any = {
    id: user.id,
    username: user.username,
    role: user.role,
    phone: user.phone,
    created_at: user.created_at,
  };

  if (user.role === 'merchant') {
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(user.id);
    profile = { ...profile, merchant };
  } else if (user.role === 'knight') {
    const knight = db.prepare('SELECT * FROM knights WHERE user_id = ?').get(user.id);
    profile = { ...profile, knight };
  }

  res.json({
    code: 0,
    data: { token, user: profile },
    message: 'Login successful',
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.json({ code: -1, message: 'User not found' });
  }

  const fullUser = db.prepare('SELECT id, username, role, phone, created_at FROM users WHERE id = ?').get(user.id) as any;

  let profile: any = { ...fullUser };

  if (fullUser.role === 'merchant') {
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(user.id);
    profile = { ...profile, merchant };
  } else if (fullUser.role === 'knight') {
    const knight = db.prepare('SELECT * FROM knights WHERE user_id = ?').get(user.id);
    profile = { ...profile, knight };
  }

  res.json({
    code: 0,
    data: profile,
    message: 'Success',
  });
});

export default router;
