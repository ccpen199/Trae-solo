import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import * as bcrypt from 'bcryptjs';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['operation', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, role, status, keyword } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (keyword) {
      whereClause += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const users = await allQuery(
      `SELECT id, username, real_name, phone, email, role, id_card, license_number, license_verified, status, created_at 
       FROM users ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: users,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/customers', authMiddleware, roleMiddleware(['operation', 'service', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const customers = await allQuery(
      `SELECT id, username, real_name, phone, email, id_card, license_number, license_verified, status, created_at 
       FROM users WHERE role = ? ORDER BY id DESC`,
      ['customer']
    );
    res.json({ code: 200, message: 'success', data: customers });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/status', authMiddleware, roleMiddleware(['operation', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    await runQuery('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, message: '状态更新成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { real_name, phone, email, id_card, license_number } = req.body;
    await runQuery(
      'UPDATE users SET real_name = ?, phone = ?, email = ?, id_card = ?, license_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [real_name || '', phone || '', email || '', id_card || '', license_number || '', req.user!.id]
    );
    res.json({ code: 200, message: '更新成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { old_password, new_password } = req.body;
    const user = await getQuery('SELECT password FROM users WHERE id = ?', [req.user!.id]);
    
    if (!user) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    
    const isPasswordValid = bcrypt.compareSync(old_password, user.password);
    if (!isPasswordValid) {
      return res.json({ code: 400, message: '原密码错误' });
    }
    
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    await runQuery('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, req.user!.id]);
    
    res.json({ code: 200, message: '密码修改成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
