import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import authMiddleware, { type AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'flexible-work-platform-secret-key-2024';

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, name, phone } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({ success: false, error: '邮箱、密码和角色为必填项' });
      return;
    }

    if (!['job_seeker', 'employer', 'admin'].includes(role)) {
      res.status(400).json({ success: false, error: '无效的角色类型' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      res.status(400).json({ success: false, error: '该邮箱已被注册' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(userId, email, phone || null, passwordHash, role, name || null);

    if (role === 'job_seeker') {
      const seekerId = uuidv4();
      db.prepare(`
        INSERT INTO job_seekers (id, user_id)
        VALUES (?, ?)
      `).run(seekerId, userId);
    } else if (role === 'employer') {
      const employerId = uuidv4();
      db.prepare(`
        INSERT INTO employers (id, user_id)
        VALUES (?, ?)
      `).run(employerId, userId);
    }

    const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: { id: userId, email, role, name: name || null }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: '邮箱和密码为必填项' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    let profile = null;
    if (user.role === 'job_seeker') {
      profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(user.id);
    } else if (user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);
    }

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          avatar_url: user.avatar_url,
          status: user.status
        },
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT id, email, role, name, avatar_url, status, created_at FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    let profile = null;
    let skills = [];
    let certificates = [];

    if (user.role === 'job_seeker') {
      profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(user.id);
      skills = db.prepare(`
        SELECT s.id, s.name, s.category, js.proficiency_level, js.verified
        FROM job_seeker_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.job_seeker_id = (SELECT id FROM job_seekers WHERE user_id = ?)
      `).all(user.id);
      certificates = db.prepare(`
        SELECT * FROM skill_certificates WHERE job_seeker_id = (SELECT id FROM job_seekers WHERE user_id = ?)
      `).all(user.id);
    } else if (user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);
    }

    res.json({
      success: true,
      data: { user, profile, skills, certificates }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
});

router.post('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, avatar_url, ...profileData } = req.body;

    if (name) {
      db.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, userId);
    }
    if (avatar_url) {
      db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatar_url, userId);
    }

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (user.role === 'job_seeker') {
      const { gender, birth_date, location_lat, location_lng, location_address, bio, onboarding_effectiveness_hours } = profileData;
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (gender !== undefined) { updateFields.push('gender = ?'); updateValues.push(gender); }
      if (birth_date !== undefined) { updateFields.push('birth_date = ?'); updateValues.push(birth_date); }
      if (location_lat !== undefined) { updateFields.push('location_lat = ?'); updateValues.push(location_lat); }
      if (location_lng !== undefined) { updateFields.push('location_lng = ?'); updateValues.push(location_lng); }
      if (location_address !== undefined) { updateFields.push('location_address = ?'); updateValues.push(location_address); }
      if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio); }
      if (onboarding_effectiveness_hours !== undefined) { updateFields.push('onboarding_effectiveness_hours = ?'); updateValues.push(onboarding_effectiveness_hours); }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        db.prepare(`UPDATE job_seekers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(...updateValues);
      }
    } else if (user.role === 'employer') {
      const { company_name, company_type, location_lat, location_lng, location_address, contact_name, contact_phone } = profileData;
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (company_name !== undefined) { updateFields.push('company_name = ?'); updateValues.push(company_name); }
      if (company_type !== undefined) { updateFields.push('company_type = ?'); updateValues.push(company_type); }
      if (location_lat !== undefined) { updateFields.push('location_lat = ?'); updateValues.push(location_lat); }
      if (location_lng !== undefined) { updateFields.push('location_lng = ?'); updateValues.push(location_lng); }
      if (location_address !== undefined) { updateFields.push('location_address = ?'); updateValues.push(location_address); }
      if (contact_name !== undefined) { updateFields.push('contact_name = ?'); updateValues.push(contact_name); }
      if (contact_phone !== undefined) { updateFields.push('contact_phone = ?'); updateValues.push(contact_phone); }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        db.prepare(`UPDATE employers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(...updateValues);
      }
    }

    res.json({ success: true, message: '资料更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: '更新资料失败' });
  }
});

export default router;
