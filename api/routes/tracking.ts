import { Router, type Response } from 'express';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/active', authMiddleware, (req: AuthRequest, res: Response) => {
  const sql = `
    SELECT
      w.id,
      w.waybill_no,
      w.status,
      w.current_location,
      w.start_time,
      c.cargo_name,
      c.start_city,
      c.end_city,
      d.id as driver_id,
      d.name as driver_name,
      d.phone as driver_phone,
      v.id as vehicle_id,
      v.plate_no,
      v.vehicle_type
    FROM waybills w
    LEFT JOIN cargo c ON w.cargo_id = c.id
    LEFT JOIN drivers d ON w.driver_id = d.id
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    WHERE w.status IN ('loading', 'in_transit', 'unloading')
    ORDER BY w.updated_at DESC
  `;

  const rows = db.prepare(sql).all() as any[];

  const list = rows.map(row => {
    let location = null;
    try {
      if (row.current_location) {
        location = JSON.parse(row.current_location);
      }
    } catch (e) {
      location = null;
    }

    return {
      waybillId: row.id,
      waybillNo: row.waybill_no,
      status: row.status,
      location,
      startTime: row.start_time,
      cargo: {
        name: row.cargo_name,
        startCity: row.start_city,
        endCity: row.end_city,
      },
      driver: {
        id: row.driver_id,
        name: row.driver_name,
        phone: row.driver_phone,
      },
      vehicle: {
        id: row.vehicle_id,
        plateNo: row.plate_no,
        vehicleType: row.vehicle_type,
      },
    };
  });

  res.success(list, '获取成功');
});

export default router;
