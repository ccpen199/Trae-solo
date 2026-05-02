import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken, generateToken, requireRoles } from '../middleware/auth';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const result = await query(
      `SELECT * FROM users WHERE username = $1 AND is_active = true`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      doctorId: user.doctor_id,
    });

    await query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        doctorId: user.doctor_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  res.json({ message: '已登出' });
});

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.name, u.role, u.doctor_id, d.name as doctor_name, d.department_id, dept.name as department_name
       FROM users u
       LEFT JOIN doctors d ON u.doctor_id = d.id
       LEFT JOIN departments dept ON d.department_id = dept.id
       WHERE u.id = $1`,
      [req.user?.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      doctorId: user.doctor_id,
      doctorName: user.doctor_name,
      departmentId: user.department_id,
      departmentName: user.department_name,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '旧密码和新密码不能为空' });
    }

    const result = await query(
      `SELECT * FROM users WHERE id = $1`,
      [req.user?.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, req.user?.userId]
    );

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: '修改密码失败' });
  }
});

export default router;
