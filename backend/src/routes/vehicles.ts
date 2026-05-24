import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status, brand, store_id, keyword } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND v.status = ?';
      params.push(status);
    }
    if (brand) {
      whereClause += ' AND v.brand = ?';
      params.push(brand);
    }
    if (store_id) {
      whereClause += ' AND v.store_id = ?';
      params.push(store_id);
    }
    if (keyword) {
      whereClause += ' AND (v.plate_number LIKE ? OR v.brand LIKE ? OR v.model LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const vehicles = await allQuery(
      `SELECT v.*, s.name as store_name FROM vehicles v 
       LEFT JOIN stores s ON v.store_id = s.id 
       ${whereClause} 
       ORDER BY v.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM vehicles v ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: vehicles,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/available', async (req: AuthRequest, res: Response) => {
  try {
    const { store_id, pickup_time, return_time } = req.query;
    
    let whereClause = 'WHERE v.status = ?';
    const params: any[] = ['available'];
    
    if (store_id) {
      whereClause += ' AND v.store_id = ?';
      params.push(store_id);
    }

    const vehicles = await allQuery(
      `SELECT v.*, s.name as store_name FROM vehicles v 
       LEFT JOIN stores s ON v.store_id = s.id 
       ${whereClause} 
       ORDER BY v.daily_rate ASC`,
      params
    );

    res.json({
      code: 200,
      message: 'success',
      data: vehicles
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await getQuery(
      `SELECT v.*, s.name as store_name FROM vehicles v 
       LEFT JOIN stores s ON v.store_id = s.id 
       WHERE v.id = ?`,
      [req.params.id]
    );
    if (!vehicle) {
      return res.json({ code: 404, message: '车辆不存在' });
    }
    res.json({ code: 200, message: 'success', data: vehicle });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/', authMiddleware, roleMiddleware(['operation', 'store']), async (req: AuthRequest, res: Response) => {
  try {
    const { plate_number, brand, model, color, year, fuel_type, transmission, seats, daily_rate, deposit_amount, insurance_fee, store_id, status, description, features } = req.body;
    
    const existing = await getQuery('SELECT id FROM vehicles WHERE plate_number = ?', [plate_number]);
    if (existing) {
      return res.json({ code: 400, message: '车牌号已存在' });
    }

    const result = await runQuery(
      `INSERT INTO vehicles (plate_number, brand, model, color, year, mileage, fuel_type, transmission, seats, daily_rate, deposit_amount, insurance_fee, store_id, status, description, features) 
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [plate_number, brand, model, color, year, fuel_type, transmission, seats, daily_rate, deposit_amount, insurance_fee, store_id, status || 'available', description || '', features || '']
    );

    res.json({ code: 200, message: '添加成功', data: { id: result.lastID } });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['operation', 'store']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { plate_number, brand, model, color, year, fuel_type, transmission, seats, daily_rate, deposit_amount, insurance_fee, store_id, status, description, features } = req.body;
    
    const existing = await getQuery('SELECT id FROM vehicles WHERE plate_number = ? AND id != ?', [plate_number, id]);
    if (existing) {
      return res.json({ code: 400, message: '车牌号已存在' });
    }

    await runQuery(
      `UPDATE vehicles SET plate_number=?, brand=?, model=?, color=?, year=?, fuel_type=?, transmission=?, seats=?, daily_rate=?, deposit_amount=?, insurance_fee=?, store_id=?, status=?, description=?, features=?, updated_at=CURRENT_TIMESTAMP 
       WHERE id=?`,
      [plate_number, brand, model, color, year, fuel_type, transmission, seats, daily_rate, deposit_amount, insurance_fee, store_id, status, description || '', features || '', id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/status', authMiddleware, roleMiddleware(['operation', 'store']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    await runQuery('UPDATE vehicles SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, req.params.id]);
    res.json({ code: 200, message: '状态更新成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
