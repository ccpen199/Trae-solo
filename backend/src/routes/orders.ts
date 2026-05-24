import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

const generateOrderNo = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD${dateStr}${random}`;
};

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status, user_id, vehicle_id, keyword } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    if (user_id) {
      whereClause += ' AND o.user_id = ?';
      params.push(user_id);
    }
    if (vehicle_id) {
      whereClause += ' AND o.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (keyword) {
      whereClause += ' AND (o.order_no LIKE ? OR u.real_name LIKE ? OR v.plate_number LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (req.user?.role === 'customer') {
      whereClause += ' AND o.user_id = ?';
      params.push(req.user.id);
    }

    const orders = await allQuery(
      `SELECT o.*, u.real_name as user_name, u.phone as user_phone, 
              v.plate_number, v.brand, v.model, 
              s1.name as pickup_store_name, s2.name as return_store_name 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       LEFT JOIN vehicles v ON o.vehicle_id = v.id 
       LEFT JOIN stores s1 ON o.pickup_store_id = s1.id 
       LEFT JOIN stores s2 ON o.return_store_id = s2.id 
       ${whereClause} 
       ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM orders o ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: orders,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await getQuery(
      `SELECT o.*, u.real_name as user_name, u.phone as user_phone, u.id_card, u.license_number,
              v.plate_number, v.brand, v.model, v.color, v.fuel_type, v.seats,
              s1.name as pickup_store_name, s1.address as pickup_store_address, s1.contact_phone as pickup_store_phone,
              s2.name as return_store_name, s2.address as return_store_address
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       LEFT JOIN vehicles v ON o.vehicle_id = v.id 
       LEFT JOIN stores s1 ON o.pickup_store_id = s1.id 
       LEFT JOIN stores s2 ON o.return_store_id = s2.id 
       WHERE o.id = ?`,
      [req.params.id]
    );
    
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }

    if (req.user?.role === 'customer' && order.user_id !== req.user.id) {
      return res.json({ code: 403, message: '无权查看' });
    }

    const inspections = await allQuery('SELECT * FROM inspections WHERE order_id = ? ORDER BY id', [req.params.id]);
    const deposit = await getQuery('SELECT * FROM deposits WHERE order_id = ?', [req.params.id]);
    const violations = await allQuery('SELECT * FROM violations WHERE order_id = ?', [req.params.id]);
    const settlement = await getQuery('SELECT * FROM settlements WHERE order_id = ?', [req.params.id]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...order,
        inspections,
        deposit,
        violations,
        settlement
      }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, pickup_store_id, return_store_id, pickup_time, return_time } = req.body;
    
    const vehicle = await getQuery('SELECT * FROM vehicles WHERE id = ? AND status = ?', [vehicle_id, 'available']);
    if (!vehicle) {
      return res.json({ code: 400, message: '车辆不可用' });
    }

    if (req.user?.role === 'customer') {
      const user = await getQuery('SELECT license_verified FROM users WHERE id = ?', [req.user.id]);
      if (!user || user.license_verified !== 1) {
        return res.json({ code: 400, message: '驾照未审核通过，无法下单' });
      }
    }

    const pickupDate = new Date(pickup_time);
    const returnDate = new Date(return_time);
    const total_days = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (total_days < 1) {
      return res.json({ code: 400, message: '租期至少1天' });
    }

    const base_amount = vehicle.daily_rate * total_days;
    const insurance_fee = vehicle.insurance_fee * total_days;
    const total_amount = base_amount + insurance_fee;
    const deposit_amount = vehicle.deposit_amount;

    const order_no = generateOrderNo();
    const userId = req.user?.role === 'customer' ? req.user.id : (req.body.user_id || 6);

    const result = await runQuery(
      `INSERT INTO orders (order_no, user_id, vehicle_id, pickup_store_id, return_store_id, pickup_time, return_time, daily_rate, total_days, base_amount, insurance_fee, total_amount, deposit_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_no, userId, vehicle_id, pickup_store_id, return_store_id, pickup_time, return_time, vehicle.daily_rate, total_days, base_amount, insurance_fee, total_amount, deposit_amount, 'pending']
    );

    await runQuery('UPDATE vehicles SET status = ? WHERE id = ?', ['reserved', vehicle_id]);

    res.json({
      code: 200,
      message: '下单成功',
      data: {
        id: result.lastID,
        order_no,
        total_amount,
        deposit_amount
      }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/pay', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.status !== 'pending') {
      return res.json({ code: 400, message: '订单状态不允许支付' });
    }

    await runQuery('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['paid', req.params.id]);
    
    await runQuery(
      `INSERT INTO deposits (order_id, user_id, amount, status, paid_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [order.id, order.user_id, order.deposit_amount, 'paid']
    );

    await runQuery('UPDATE vehicles SET status = ? WHERE id = ?', ['rented', order.vehicle_id]);

    res.json({ code: 200, message: '支付成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/pickup', authMiddleware, roleMiddleware(['store', 'operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { pickup_mileage, pickup_fuel_level, operator_id, operator_name, remark } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.status !== 'paid') {
      return res.json({ code: 400, message: '订单状态不允许取车' });
    }

    const now = new Date().toISOString();
    await runQuery(
      `UPDATE orders SET status = ?, actual_pickup_time = ?, pickup_mileage = ?, pickup_fuel_level = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      ['in_use', now, pickup_mileage, pickup_fuel_level, req.params.id]
    );

    await runQuery(
      `INSERT INTO inspections (order_id, vehicle_id, type, mileage, fuel_level, operator_id, operator_name, remark, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.vehicle_id, 'pickup', pickup_mileage, pickup_fuel_level, operator_id, operator_name, remark || '', now]
    );

    await runQuery('UPDATE deposits SET status = ? WHERE order_id = ?', ['frozen', req.params.id]);

    res.json({ code: 200, message: '取车确认成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/return', authMiddleware, roleMiddleware(['store', 'operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { return_mileage, return_fuel_level, exterior_damages, interior_damages, operator_id, operator_name, remark } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.status !== 'in_use') {
      return res.json({ code: 400, message: '订单状态不允许还车' });
    }

    const now = new Date().toISOString();
    await runQuery(
      `UPDATE orders SET status = ?, actual_return_time = ?, return_mileage = ?, return_fuel_level = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      ['returned', now, return_mileage, return_fuel_level, req.params.id]
    );

    await runQuery(
      `INSERT INTO inspections (order_id, vehicle_id, type, mileage, fuel_level, exterior_damages, interior_damages, operator_id, operator_name, remark, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.vehicle_id, 'return', return_mileage, return_fuel_level, exterior_damages || '', interior_damages || '', operator_id, operator_name, remark || '', now]
    );

    await runQuery('UPDATE vehicles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['available', order.vehicle_id]);

    res.json({ code: 200, message: '还车确认成功' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/settle', authMiddleware, roleMiddleware(['finance', 'operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { extra_mileage_fee, fuel_fee, violation_fee, damage_fee, overdue_fee, other_fee, deposit_refund, remark } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.status !== 'returned') {
      return res.json({ code: 400, message: '订单状态不允许结算' });
    }

    const total_settlement = order.base_amount + order.insurance_fee + 
      (Number(extra_mileage_fee) || 0) + (Number(fuel_fee) || 0) + 
      (Number(violation_fee) || 0) + (Number(damage_fee) || 0) + 
      (Number(overdue_fee) || 0) + (Number(other_fee) || 0);

    const now = new Date().toISOString();
    await runQuery(
      `INSERT INTO settlements (order_id, user_id, vehicle_id, base_amount, extra_mileage_fee, fuel_fee, violation_fee, damage_fee, overdue_fee, other_fee, total_settlement, deposit_refund, status, settlement_time, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.user_id, order.vehicle_id, order.base_amount, 
       Number(extra_mileage_fee) || 0, Number(fuel_fee) || 0, 
       Number(violation_fee) || 0, Number(damage_fee) || 0, 
       Number(overdue_fee) || 0, Number(other_fee) || 0, 
       total_settlement, Number(deposit_refund) || 0, 'completed', now, remark || '']
    );

    const refundAmount = Number(deposit_refund) || 0;
    const deductionAmount = order.deposit_amount - refundAmount;
    
    if (deductionAmount > 0) {
      await runQuery(
        `UPDATE deposits SET status = ?, refund_amount = ?, deduction_amount = ?, refund_at = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE order_id = ?`,
        ['partial_refunded', refundAmount, deductionAmount, now, req.params.id]
      );
    } else {
      await runQuery(
        `UPDATE deposits SET status = ?, refund_amount = ?, refund_at = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE order_id = ?`,
        ['refunded', order.deposit_amount, now, req.params.id]
      );
    }

    await runQuery('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['completed', req.params.id]);

    res.json({ code: 200, message: '结算完成' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (!['pending', 'paid'].includes(order.status)) {
      return res.json({ code: 400, message: '订单状态不允许取消' });
    }

    await runQuery('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['cancelled', req.params.id]);
    await runQuery('UPDATE vehicles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['available', order.vehicle_id]);
    
    if (order.status === 'paid') {
      await runQuery('UPDATE deposits SET status = ?, refund_amount = ?, refund_at = CURRENT_TIMESTAMP WHERE order_id = ?', ['refunded', order.deposit_amount, req.params.id]);
    }

    res.json({ code: 200, message: '订单已取消' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
