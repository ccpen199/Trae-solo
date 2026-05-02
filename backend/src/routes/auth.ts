import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database';
import { generateToken } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const user = db.get<User>(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '参数不完整'
      });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const user = db.get<User>(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    const isValidPassword = bcrypt.compareSync(oldPassword, user.password);

    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        message: '原密码错误'
      });
      return;
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();

    db.run(
      `UPDATE users SET password = ?, updatedAt = ? WHERE id = ?`,
      [hashedPassword, now, userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败，请稍后重试'
    });
  }
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const users = db.all<Omit<User, 'password'>>(
      `SELECT id, username, name, role, department, createdAt, updatedAt FROM users`
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

export default router;
