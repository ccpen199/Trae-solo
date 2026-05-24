import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status, order_id } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND d.status = ?';
      params.push(status);
    }
    if (order_id) {
      whereClause += ' AND d.order_id = ?';
      params.push(order_id);
    }

    if (req.user?.role === 'customer') {
      whereClause += ' AND d.user_id = ?';
      params.push(req.user.id);
    }

    const deposits = await allQuery(
      `SELECT d.*, o.order_no, u.real_name as user_name, v.plate_number 
       FROM deposits d 
       LEFT JOIN orders o ON d.order_id = o.id 
       LEFT JOIN users u ON d.user_id = u.id 
       LEFT JOIN vehicles v ON o.vehicle_id = v.id 
       ${whereClause} 
       ORDER BY d.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM deposits d ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: deposits,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
