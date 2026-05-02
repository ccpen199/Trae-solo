const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { get, run, all } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'legal-consultation-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  async register(userData) {
    const { username, email, password, role = 'client', realName, phone } = userData;

    const existingUser = await get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return { 
        success: false, 
        message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册' 
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await run(`
      INSERT INTO users (id, username, email, password_hash, role, real_name, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, username, email, passwordHash, role, realName, phone]);

    await run(`
      INSERT INTO user_wallets (id, user_id, balance, frozen_balance, total_income, created_at, updated_at)
      VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [uuidv4(), userId]);

    const token = this.generateToken(userId, username, role);

    return {
      success: true,
      user: {
        id: userId,
        username,
        email,
        role,
        realName
      },
      token
    };
  }

  async login(usernameOrEmail, password) {
    const user = await get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [usernameOrEmail, usernameOrEmail]
    );

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, message: '密码错误' };
    }

    if (user.status !== 'active') {
      return { success: false, message: '账户已被禁用' };
    }

    await run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    const token = this.generateToken(user.id, user.username, user.role);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        realName: user.real_name,
        avatarUrl: user.avatar_url
      },
      token
    };
  }

  generateToken(userId, username, role) {
    return jwt.sign(
      { userId, username, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  async getCurrentUser(userId) {
    const user = await get(`
      SELECT u.*, 
             l.id as lawyer_id, l.license_number, l.practice_years, l.law_firm, 
             l.specializations, l.bio, l.rating, l.total_consultations, l.completed_consultations,
             w.balance, w.total_income
      FROM users u
      LEFT JOIN lawyers l ON u.id = l.user_id
      LEFT JOIN user_wallets w ON u.id = w.user_id
      WHERE u.id = ?
    `, [userId]);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        realName: user.real_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        status: user.status,
        createdAt: user.created_at,
        lawyer: user.lawyer_id ? {
          id: user.lawyer_id,
          licenseNumber: user.license_number,
          practiceYears: user.practice_years,
          lawFirm: user.law_firm,
          specializations: JSON.parse(user.specializations || '[]'),
          bio: user.bio,
          rating: user.rating,
          totalConsultations: user.total_consultations,
          completedConsultations: user.completed_consultations
        } : null,
        wallet: {
          balance: user.balance || 0,
          totalIncome: user.total_income || 0
        }
      }
    };
  }

  async updateProfile(userId, updates) {
    const allowedFields = ['real_name', 'phone', 'avatar_url'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return { success: false, message: '没有可更新的字段' };
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    await run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return { success: true, message: '更新成功' };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      return { success: false, message: '原密码错误' };
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    return { success: true, message: '密码修改成功' };
  }
}

module.exports = new AuthService();
