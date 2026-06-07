import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { city_id, category, page = '1', pageSize = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (city_id) {
      whereClause += ' AND m.city_id = ?';
      params.push(city_id);
    }
    if (category) {
      whereClause += ' AND m.category = ?';
      params.push(category);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM merchants m ${whereClause}`).get(...params) as { total: number };
    
    const merchants = db.prepare(`
      SELECT m.*, c.name as city_name
      FROM merchants m
      JOIN cities c ON m.city_id = c.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, offset);

    res.json({
      merchants,
      total: countResult.total,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    res.status(500).json({ error: '获取商户列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const merchant: any = db.prepare(`
      SELECT m.*, c.name as city_name
      FROM merchants m
      JOIN cities c ON m.city_id = c.id
      WHERE m.id = ?
    `).get(req.params.id);
    if (!merchant) {
      res.status(404).json({ error: '商户不存在' });
      return;
    }
    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ error: '获取商户详情失败' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { city_id, name, description, logo, license_number, category, address, phone } = req.body;
    if (!name) {
      res.status(400).json({ error: '商户名称不能为空' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO merchants (user_id, city_id, name, description, logo, license_number, category, address, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user!.id, city_id || 1, name, description, logo, license_number, category, address, phone);

    res.json({ id: result.lastInsertRowid, message: '商户入驻申请提交成功' });
  } catch (error) {
    res.status(500).json({ error: '商户入驻失败' });
  }
});

router.put('/:id/verify', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { is_verified } = req.body;
    db.prepare('UPDATE merchants SET is_verified = ? WHERE id = ?').run(is_verified ? 1 : 0, req.params.id);
    db.prepare('INSERT INTO audit_logs (action, admin_id) VALUES (?, ?)').run('merchant_verify', req.user!.id);
    res.json({ message: '审核成功' });
  } catch (error) {
    res.status(500).json({ error: '审核失败' });
  }
});

export default router;
