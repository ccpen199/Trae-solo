import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, order_id, vehicle_id, type } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (order_id) {
      whereClause += ' AND i.order_id = ?';
      params.push(order_id);
    }
    if (vehicle_id) {
      whereClause += ' AND i.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (type) {
      whereClause += ' AND i.type = ?';
      params.push(type);
    }

    const inspections = await allQuery(
      `SELECT i.*, o.order_no, v.plate_number, v.brand, v.model 
       FROM inspections i 
       LEFT JOIN orders o ON i.order_id = o.id 
       LEFT JOIN vehicles v ON i.vehicle_id = v.id 
       ${whereClause} 
       ORDER BY i.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM inspections i ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: inspections,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
