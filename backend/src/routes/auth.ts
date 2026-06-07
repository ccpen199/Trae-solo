import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, getAsync } from '../database/init';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-life-service-jwt-secret-2024';

router.post('/login', async (req, res) => {
  try {
    const { phone, username, password } = req.body;
    const account = phone || username;

    if (!account || !password) {
      return res.status(400).json({ success: false, message: '请输入账号和密码' });
    }

    const user = await getAsync(
      'SELECT * FROM users WHERE phone = ? OR name = ?',
      [account, account]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    const storedPassword = user.password_hash || '';
    const passwordMatched = storedPassword === password || bcrypt.compareSync(password, storedPassword);
    if (!passwordMatched) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role, gridCode: user.grid_code },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          gridCode: user.grid_code,
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { phone, name, gridCode, password, role } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({ success: false, message: '手机号、姓名和密码不能为空' });
    }

    const existing = await getAsync('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existing) {
      return res.status(400).json({ success: false, message: '手机号已注册' });
    }

    const result = await new Promise<{ lastID: number }>((resolve, reject) => {
      db.run(`
        INSERT INTO users (phone, name, grid_code, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `, [phone, name, gridCode, bcrypt.hashSync(password, 10), role || 'resident'], function(this: any, err: Error | null) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID });
      });
    });

    const token = jwt.sign(
      { userId: result.lastID, phone, role: role || 'resident', gridCode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: result.lastID,
          name,
          phone,
          role: role || 'resident',
          gridCode,
        }
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

export default router;
