import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'weaver-video-messaging-secret-key-2024';
const SALT_ROUNDS = 10;

class AccountService {
  generateCID() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `W${timestamp}${random}`;
  }

  async register(userData) {
    const { username, email, phone, password } = userData;
    
    if (email) {
      const existingEmail = db.prepare('SELECT id FROM accounts WHERE email = ?').get(email);
      if (existingEmail) {
        return { success: false, message: '该邮箱已被注册' };
      }
    }

    if (phone) {
      const existingPhone = db.prepare('SELECT id FROM accounts WHERE phone = ?').get(phone);
      if (existingPhone) {
        return { success: false, message: '该手机号已被注册' };
      }
    }

    let cid;
    let attempts = 0;
    do {
      cid = this.generateCID();
      const existingCID = db.prepare('SELECT id FROM accounts WHERE cid = ?').get(cid);
      if (!existingCID) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return { success: false, message: '生成账号失败，请稍后重试' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const insertStmt = db.prepare(`
      INSERT INTO accounts (cid, username, email, phone, password_hash, status)
      VALUES (?, ?, ?, ?, ?, 'offline')
    `);

    const result = insertStmt.run(cid, username || cid, email || null, phone || null, passwordHash);

    return {
      success: true,
      message: '注册成功',
      data: {
        id: result.lastInsertRowid,
        cid,
        username: username || cid,
        email,
        phone
      }
    };
  }

  async login(loginData) {
    const { cid, email, phone, password } = loginData;

    let account;
    
    if (cid) {
      account = db.prepare('SELECT * FROM accounts WHERE cid = ?').get(cid);
    } else if (email) {
      account = db.prepare('SELECT * FROM accounts WHERE email = ?').get(email);
    } else if (phone) {
      account = db.prepare('SELECT * FROM accounts WHERE phone = ?').get(phone);
    }

    if (!account) {
      return { success: false, message: '账号不存在' };
    }

    const passwordMatch = await bcrypt.compare(password, account.password_hash);
    if (!passwordMatch) {
      return { success: false, message: '密码错误' };
    }

    const token = jwt.sign(
      { userId: account.id, cid: account.cid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const insertSessionStmt = db.prepare(`
      INSERT INTO login_sessions (user_id, token, is_active, expires_at)
      VALUES (?, ?, 1, datetime('now', '+7 days'))
    `);
    insertSessionStmt.run(account.id, token);

    db.prepare('UPDATE accounts SET status = ?, last_login_at = datetime(\'now\') WHERE id = ?')
      .run('online', account.id);

    return {
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: account.id,
          cid: account.cid,
          username: account.username,
          email: account.email,
          phone: account.phone,
          avatar: account.avatar,
          status: 'online'
        }
      }
    };
  }

  async logout(userId, token) {
    if (token) {
      db.prepare('UPDATE login_sessions SET is_active = 0 WHERE token = ?').run(token);
    }
    db.prepare('UPDATE accounts SET status = ? WHERE id = ?').run('offline', userId);
    
    return { success: true, message: '已登出' };
  }

  async switchAccount(userId, targetCID) {
    const targetAccount = db.prepare('SELECT * FROM accounts WHERE cid = ?').get(targetCID);
    
    if (!targetAccount) {
      return { success: false, message: '目标账号不存在' };
    }

    const passwordMatch = true;
    if (!passwordMatch) {
      return { success: false, message: '请先验证密码' };
    }

    return {
      success: true,
      message: '切换成功',
      data: {
        targetAccount: {
          id: targetAccount.id,
          cid: targetAccount.cid,
          username: targetAccount.username
        }
      }
    };
  }

  async resetPassword(resetData) {
    const { email, phone, newPassword } = resetData;

    let account;
    if (email) {
      account = db.prepare('SELECT * FROM accounts WHERE email = ?').get(email);
    } else if (phone) {
      account = db.prepare('SELECT * FROM accounts WHERE phone = ?').get(phone);
    }

    if (!account) {
      return { success: false, message: '未找到关联账号' };
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    db.prepare('UPDATE accounts SET password_hash = ? WHERE id = ?')
      .run(passwordHash, account.id);

    db.prepare('UPDATE login_sessions SET is_active = 0 WHERE user_id = ?').run(account.id);

    return { success: true, message: '密码重置成功' };
  }

  getProfile(userId) {
    const account = db.prepare(`
      SELECT id, cid, username, email, phone, avatar, status, created_at, last_login_at
      FROM accounts WHERE id = ?
    `).get(userId);

    if (!account) {
      return { success: false, message: '用户不存在' };
    }

    return { success: true, data: account };
  }

  updateProfile(userId, updateData) {
    const { username, avatar, phone, email } = updateData;

    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (phone !== undefined) {
      const existing = db.prepare('SELECT id FROM accounts WHERE phone = ? AND id != ?').get(phone, userId);
      if (existing) {
        return { success: false, message: '手机号已被其他账号使用' };
      }
      updates.push('phone = ?');
      values.push(phone);
    }
    if (email !== undefined) {
      const existing = db.prepare('SELECT id FROM accounts WHERE email = ? AND id != ?').get(email, userId);
      if (existing) {
        return { success: false, message: '邮箱已被其他账号使用' };
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return { success: false, message: '没有可更新的内容' };
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(userId);

    const query = `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return { success: true, message: '更新成功' };
  }

  findUserByCID(cid) {
    const account = db.prepare(`
      SELECT id, cid, username, avatar, status
      FROM accounts WHERE cid = ?
    `).get(cid);

    if (!account) {
      return { success: false, message: '用户不存在' };
    }

    return { success: true, data: account };
  }

  searchUsers(keyword) {
    const likeKeyword = `%${keyword}%`;
    const users = db.prepare(`
      SELECT id, cid, username, avatar, status
      FROM accounts 
      WHERE cid LIKE ? OR username LIKE ?
      LIMIT 20
    `).all(likeKeyword, likeKeyword);

    return { success: true, data: users };
  }
}

export const accountService = new AccountService();
