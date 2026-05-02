import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fund-platform-jwt-secret-2026';

class UserService {
  async register(username, password, fullName, role = 'investor') {
    const now = new Date().toISOString();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = this.findByUsername(username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    eventStore.append(
      AggregateTypes.USER,
      userId,
      EventTypes.USER_CREATED,
      {
        userId,
        username,
        fullName,
        role,
        createdAt: now
      },
      { source: 'UserService' }
    );

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, username, passwordHash, fullName, role, now, now);

    return {
      id: userId,
      username,
      fullName,
      role,
      createdAt: now
    };
  }

  async login(username, password) {
    const user = this.findByUsername(username);
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new Error('用户名或密码错误');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        riskLevel: user.risk_level
      }
    };
  }

  findByUsername(username) {
    const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
    return stmt.get(username);
  }

  findById(userId) {
    const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
    return stmt.get(userId);
  }

  updateUser(userId, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.fullName !== undefined) {
      fields.push('full_name = ?');
      values.push(updates.fullName);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.idCard !== undefined) {
      fields.push('id_card = ?');
      values.push(updates.idCard);
    }

    if (fields.length === 0) {
      return this.findById(userId);
    }

    fields.push('updated_at = ?');
    values.push(now, userId);

    eventStore.append(
      AggregateTypes.USER,
      userId,
      EventTypes.USER_UPDATED,
      {
        userId,
        updates,
        updatedAt: now
      },
      { source: 'UserService' }
    );

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(userId);
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  getAllUsers(filters = {}) {
    let sql = `SELECT id, username, full_name, role, risk_level, phone, email, created_at FROM users WHERE 1=1`;
    const params = [];

    if (filters.role) {
      sql += ` AND role = ?`;
      params.push(filters.role);
    }

    sql += ` ORDER BY created_at DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }
}

export default new UserService();
