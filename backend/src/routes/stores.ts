import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 100, status, city } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (city) {
      whereClause += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }

    const stores = await allQuery(
      `SELECT * FROM stores ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM stores ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: stores,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    const stores = await allQuery('SELECT id, name, city, address FROM stores WHERE status = 1 ORDER BY city, name');
    res.json({ code: 200, message: 'success', data: stores });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const store = await getQuery('SELECT * FROM stores WHERE id = ?', [req.params.id]);
    if (!store) {
      return res.json({ code: 404, message: '门店不存在' });
    }
    res.json({ code: 200, message: 'success', data: store });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/', authMiddleware, roleMiddleware(['operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, province, city, district, contact_person, contact_phone, business_hours, description } = req.body;
    
    const result = await runQuery(
      `INSERT INTO stores (name, address, province, city, district, contact_person, contact_phone, business_hours, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, address || '', province || '', city || '', district || '', contact_person || '', contact_phone || '', business_hours || '', description || '']
    );

    res.json({ code: 200, message: '添加成功', data: { id: result.lastID } });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, province, city, district, contact_person, contact_phone, business_hours, description, status } = req.body;
    
    await runQuery(
      `UPDATE stores SET name=?, address=?, province=?, city=?, district=?, contact_person=?, contact_phone=?, business_hours=?, description=?, status=?, updated_at=CURRENT_TIMESTAMP 
       WHERE id=?`,
      [name, address || '', province || '', city || '', district || '', contact_person || '', contact_phone || '', business_hours || '', description || '', status, id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
