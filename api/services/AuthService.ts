import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/init';

const JWT_SECRET = process.env.JWT_SECRET || 'garbage-classification-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  login(username: string, password: string) {
    const admin = db.prepare(`
      SELECT id, username, password_hash as passwordHash, role, city_id as cityId, district
      FROM admins WHERE username = ?
    `).get(username) as {
      id: string;
      username: string;
      passwordHash: string;
      role: string;
      cityId: string;
      district: string | null;
    } | undefined;

    if (!admin) {
      return { success: false, error: '用户名或密码错误' };
    }

    const isValid = bcrypt.compareSync(password, admin.passwordHash);
    if (!isValid) {
      return { success: false, error: '用户名或密码错误' };
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        cityId: admin.cityId,
        district: admin.district
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        cityId: admin.cityId,
        district: admin.district
      }
    };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
}

export const authService = new AuthService();
