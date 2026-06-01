import { Router, Request, Response } from 'express';
import db from '../db';
import { authenticate } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

router.post('/reserve', authenticate, async (req: Request, res: Response) => {
  const { station_id, gun_id, vehicle_plate, reserve_minutes = 30 } = req.body;

  if (!station_id || !gun_id) {
    return res.status(400).json({ error: '站点和枪ID不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user.vehicle_info && !vehicle_plate) {
    return res.status(400).json({ error: '请先完善车辆信息或指定车牌号' });
  }

  if (user.balance < 10) {
    return res.status(400).json({ error: '账户余额不足10元，请先充值' });
  }

  const gun = db.prepare('SELECT * FROM guns WHERE id = ? AND station_id = ?').get(gun_id, station_id) as any;
  if (!gun) {
    return res.status(404).json({ error: '充电枪不存在' });
  }
  if (gun.status !== 'idle') {
    return res.status(400).json({ error: '该充电枪当前不可用' });
  }

  const activeReservation = db.prepare(`
    SELECT * FROM reservations 
    WHERE gun_id = ? AND status IN ('pending', 'active')
  `).get(gun_id);
  if (activeReservation) {
    return res.status(400).json({ error: '该充电枪已被预约' });
  }

  const userActiveReserve = db.prepare(`
    SELECT * FROM reservations 
    WHERE user_id = ? AND status IN ('pending', 'active')
  `).get(req.user!.id);
  if (userActiveReserve) {
    return res.status(400).json({ error: '您已有一个进行中的预约' });
  }

  const now = dayjs();
  const expireTime = now.add(reserve_minutes, 'minute');

  const result = db.prepare(`
    INSERT INTO reservations (user_id, station_id, gun_id, vehicle_plate, reserve_time, expire_time, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(
    req.user!.id, station_id, gun_id,
    vehicle_plate || user.vehicle_info,
    now.format('YYYY-MM-DD HH:mm:ss'),
    expireTime.format('YYYY-MM-DD HH:mm:ss')
  );

  db.prepare("UPDATE guns SET status = 'reserved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gun_id);

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ reservation });
});

router.post('/reserve/:id/cancel', authenticate, (req: Request, res: Response) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id) as any;
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (reservation.user_id !== req.user!.id) {
    return res.status(403).json({ error: '无权限取消此预约' });
  }
  if (!['pending', 'active'].includes(reservation.status)) {
    return res.status(400).json({ error: '该预约无法取消' });
  }

  db.prepare(`
    UPDATE reservations SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    UPDATE guns SET status = 'idle', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND status = 'reserved'
  `).run(reservation.gun_id);

  res.json({ message: '预约已取消' });
});

router.post('/start', authenticate, (req: Request, res: Response) => {
  const { station_id, gun_id, start_soc } = req.body;

  if (!station_id || !gun_id) {
    return res.status(400).json({ error: '站点和枪ID不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user.vehicle_info) {
    return res.status(400).json({ error: '请先完善车辆信息' });
  }
  if (user.balance < 20) {
    return res.status(400).json({ error: '账户余额不足20元，请先充值' });
  }

  const gun = db.prepare('SELECT * FROM guns WHERE id = ? AND station_id = ?').get(gun_id, station_id) as any;
  if (!gun) {
    return res.status(404).json({ error: '充电枪不存在' });
  }

  if (gun.status === 'charging') {
    return res.status(400).json({ error: '该充电枪正在充电中' });
  }
  if (gun.status === 'fault') {
    return res.status(400).json({ error: '该充电枪故障，请选择其他枪' });
  }
  if (gun.status === 'reserved') {
    const reservation = db.prepare(`
      SELECT * FROM reservations 
      WHERE gun_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `).get(gun_id) as any;
    if (reservation && reservation.user_id !== req.user!.id) {
      return res.status(400).json({ error: '该充电枪已被其他用户预约' });
    }
    if (reservation) {
      db.prepare("UPDATE reservations SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(reservation.id);
    }
  }

  const orderNo = `ORD${dayjs().format('YYYYMMDDHHmmss')}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const transaction = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO charging_orders (
        order_no, user_id, station_id, gun_id, start_time, start_soc,
        charging_status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'charging', 'unpaid')
    `).run(orderNo, req.user!.id, station_id, gun_id, now, start_soc || 20);

    const orderId = orderResult.lastInsertRowid as number;

    db.prepare(`
      UPDATE guns SET status = 'charging', current_order_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(orderId, gun_id);

    db.prepare(`
      UPDATE chargers SET status = 'charging', last_heartbeat = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(gun.charger_id);

    return orderId;
  });

  try {
    const orderId = transaction();
    const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(orderId);
    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ error: '启动充电失败' });
  }
});

router.post('/:id/stop', authenticate, (req: Request, res: Response) => {
  const { stop_reason = 'user_stop' } = req.body;

  const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(req.params.id) as any;
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  if (order.user_id !== req.user!.id && req.user!.role === 'owner') {
    return res.status(403).json({ error: '无权限停止此订单' });
  }
  if (order.charging_status !== 'charging') {
    return res.status(400).json({ error: '该订单未在充电中' });
  }

  const now = dayjs();
  const startTime = dayjs(order.start_time);
  const durationMinutes = now.diff(startTime, 'minute');
  const chargingDuration = Math.max(durationMinutes, 1);

  const totalKwh = +(Math.random() * 30 + 5).toFixed(2);
  const isPeak = now.hour() >= 8 && now.hour() < 22;
  const peakKwh = isPeak ? totalKwh : totalKwh * 0.3;
  const valleyKwh = totalKwh - peakKwh;

  const station = db.prepare('SELECT price_per_kwh FROM stations WHERE id = ?').get(order.station_id) as any;
  const pricePerKwh = station?.price_per_kwh || 1.5;
  const electricityFee = +(totalKwh * pricePerKwh).toFixed(2);
  const serviceFee = +(totalKwh * 0.5).toFixed(2);
  const parkingFee = +(Math.floor(chargingDuration / 30) * (station?.parking_fee || 5)).toFixed(2);
  const totalAmount = +(electricityFee + serviceFee + parkingFee).toFixed(2);

  const avgPower = +(totalKwh / (chargingDuration / 60)).toFixed(2);

  const powerCurve = Array.from({ length: Math.min(chargingDuration, 60) }, (_, i) => ({
    time: startTime.add(i, 'minute').format('HH:mm'),
    power: +(Math.random() * 40 + 80).toFixed(1),
    soc: Math.min(100, (order.start_soc || 20) + (i / chargingDuration) * 60),
  }));

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE charging_orders SET
        end_time = ?,
        end_soc = ?,
        total_kwh = ?,
        peak_kwh = ?,
        valley_kwh = ?,
        avg_power = ?,
        total_amount = ?,
        electricity_fee = ?,
        service_fee = ?,
        parking_fee = ?,
        charging_status = 'completed',
        stop_reason = ?,
        power_curve = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      now.format('YYYY-MM-DD HH:mm:ss'),
      Math.min(100, (order.start_soc || 20) + 60),
      totalKwh, peakKwh, valleyKwh, avgPower,
      totalAmount, electricityFee, serviceFee, parkingFee,
      stop_reason,
      JSON.stringify(powerCurve),
      req.params.id
    );

    db.prepare(`
      UPDATE guns SET status = 'idle', current_order_id = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(order.gun_id);

    const stillCharging = db.prepare(`
      SELECT COUNT(*) as cnt FROM guns 
      WHERE charger_id = (SELECT charger_id FROM guns WHERE id = ?) AND status = 'charging'
    `).get(order.gun_id) as { cnt: number };
    
    if (stillCharging.cnt === 0) {
      db.prepare(`
        UPDATE chargers SET status = 'online', last_heartbeat = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = (SELECT charger_id FROM guns WHERE id = ?)
      `).run(order.gun_id);
    }
  });

  try {
    transaction();
    const updatedOrder = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(req.params.id);
    res.json({ order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: '停止充电失败' });
  }
});

router.post('/:id/pay', authenticate, (req: Request, res: Response) => {
  const { payment_method = 'balance' } = req.body;

  const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(req.params.id) as any;
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  if (order.user_id !== req.user!.id) {
    return res.status(403).json({ error: '无权限支付此订单' });
  }
  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: '该订单已支付' });
  }
  if (order.charging_status === 'charging') {
    return res.status(400).json({ error: '充电未结束，请先停止充电' });
  }

  const transaction = db.transaction(() => {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user!.id) as { balance: number };
    
    if (payment_method === 'balance') {
      if (user.balance < order.total_amount) {
        throw new Error('余额不足');
      }
      const newBalance = +(user.balance - order.total_amount).toFixed(2);
      
      db.prepare('UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newBalance, req.user!.id);
      
      db.prepare(`
        UPDATE charging_orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(req.params.id);

      const txNo = `TX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      db.prepare(`
        INSERT INTO transactions (transaction_no, user_id, order_id, type, amount, balance_before, balance_after, payment_method, status)
        VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, 'success')
      `).run(txNo, req.user!.id, req.params.id, order.total_amount, user.balance, newBalance, payment_method);
    } else {
      db.prepare(`
        UPDATE charging_orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(req.params.id);

      const txNo = `TX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      db.prepare(`
        INSERT INTO transactions (transaction_no, user_id, order_id, type, amount, balance_before, balance_after, payment_method, status)
        VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, 'success')
      `).run(txNo, req.user!.id, req.params.id, order.total_amount, user.balance, user.balance, payment_method);
    }
  });

  try {
    transaction();
    const updatedOrder = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(req.params.id);
    res.json({ order: updatedOrder, message: '支付成功' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '支付失败' });
  }
});

router.get('/orders', authenticate, (req: Request, res: Response) => {
  const { status, page = 1, page_size = 20 } = req.query;
  
  let sql = `
    SELECT o.*, s.name as station_name, s.address as station_address,
      g.gun_no, g.connector_type,
      u.nickname as user_name, u.phone as user_phone
    FROM charging_orders o
    JOIN stations s ON o.station_id = s.id
    JOIN guns g ON o.gun_id = g.id
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    sql += ' AND o.user_id = ?';
    params.push(req.user!.id);
  }

  if (status) {
    sql += ' AND o.charging_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY o.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));

  const orders = db.prepare(sql).all(...params);
  
  const countSql = `SELECT COUNT(*) as total FROM charging_orders o WHERE 1=1 ${req.user!.role === 'owner' ? 'AND o.user_id = ?' : ''} ${status ? 'AND o.charging_status = ?' : ''}`;
  const countParams = req.user!.role === 'owner' ? [req.user!.id] : [];
  if (status) countParams.push(status);
  const { total } = db.prepare(countSql).get(...countParams) as { total: number };

  res.json({ orders, total, page: parseInt(page as string), page_size: parseInt(page_size as string) });
});

router.get('/orders/:id', authenticate, (req: Request, res: Response) => {
  const order = db.prepare(`
    SELECT o.*, s.name as station_name, s.address as station_address, s.price_per_kwh,
      g.gun_no, g.connector_type, g.max_power,
      c.serial_number as charger_sn, c.model as charger_model,
      u.nickname as user_name, u.phone as user_phone, u.vehicle_info
    FROM charging_orders o
    JOIN stations s ON o.station_id = s.id
    JOIN guns g ON o.gun_id = g.id
    JOIN chargers c ON g.charger_id = c.id
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (req.user!.role === 'owner' && order.user_id !== req.user!.id) {
    return res.status(403).json({ error: '无权限查看此订单' });
  }

  if (order.power_curve) {
    try {
      order.power_curve = JSON.parse(order.power_curve);
    } catch (e) {}
  }

  res.json({ order });
});

router.get('/reservations', authenticate, (req: Request, res: Response) => {
  const reservations = db.prepare(`
    SELECT r.*, s.name as station_name, s.address as station_address,
      g.gun_no, g.connector_type
    FROM reservations r
    JOIN stations s ON r.station_id = s.id
    JOIN guns g ON r.gun_id = g.id
    WHERE r.user_id = ?
    ORDER BY r.id DESC
    LIMIT 20
  `).all(req.user!.id);

  res.json({ reservations });
});

router.get('/transactions', authenticate, (req: Request, res: Response) => {
  const transactions = db.prepare(`
    SELECT t.*, o.order_no
    FROM transactions t
    LEFT JOIN charging_orders o ON t.order_id = o.id
    WHERE t.user_id = ?
    ORDER BY t.id DESC
    LIMIT 30
  `).all(req.user!.id);

  res.json({ transactions });
});

export default router;
