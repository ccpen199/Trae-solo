import db from '../db/database.js';
import { verifyPassword } from '../utils/hash.js';
import { signToken } from '../middleware/auth.js';
import { LoginRequest, LoginResponse } from '../../shared/types.js';

export function login(req: LoginRequest): LoginResponse | null {
  const user = db.prepare(`
    SELECT id, account, password_hash, name, role, phone, avatar FROM users 
    WHERE account = ? AND role = ?
  `).get(req.account, req.role) as {
    id: string; password_hash: string; name: string; role: string; phone?: string; avatar?: string;
  } | undefined;

  if (!user || !verifyPassword(req.password, user.password_hash)) {
    return null;
  }

  const token = signToken({ userId: user.id, role: user.role as 'student' | 'investor' | 'admin', name: user.name });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role as 'student' | 'investor' | 'admin',
      phone: user.phone,
      avatar: user.avatar,
    },
  };
}
