import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status, vehicle_id, user_id } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND v.status = ?';
      params.push(status);
    }
    if (vehicle_id) {
      whereClause += ' AND v.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (user_id) {
      whereClause += ' AND v.user_id = ?';
      params.push(user_id);
    }

    if (req.user?.role === 'customer') {
      whereClause += ' AND v.user_id = ?';
      params.push(req.user.id);
    }

    const violations = await allQuery(
      `SELECT v.*, u.real_name as user_name, veh.plate_number, veh.brand, veh.model 
       FROM violations v 
       LEFT JOIN users u ON v.user_id = u.id 
       LEFT JOIN vehicles veh ON v.vehicle_id = veh.id 
       ${whereClause} 
       ORDER BY v.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM violations v ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: violations,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/', authMiddleware, roleMiddleware(['operation', 'risk']), async (req: AuthRequest, res: Response) => {
  try {
    const { order_id, vehicle_id, user_id, violation_time, violation_location, violation_type, fine_amount, deduction_points, remark } = req.body;
    
    const result = await runQuery(
      `INSERT INTO violations (order_id, vehicle_id, user_id, violation_time, violation_location, violation_type, fine_amount, deduction_points, status, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id || null, vehicle_id, user_id, violation_time || null, violation_location || '', violation_type || '', fine_amount || 0, deduction_points || 0, 'pending', remark || '']
    );

    res.json({ code: 200, message: '添加成功', data: { id: result.lastID } });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/status', authMiddleware, roleMiddleware(['operation', 'risk']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, remark } = req.body;
    await runQuery(
      'UPDATE violations SET status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, remark || '', req.params.id]
    );
    res.json({ code: 200, message: '状态更新成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
