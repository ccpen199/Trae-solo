import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';
import { Device, Reservation, ReservationStatus } from '../types';
import { pageResult, parsePage, serializeReservation } from '../serializers';

const router = Router();

function listUserReservations(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { page, pageSize } = parsePage(req);
  const db = getDb();
  const reservations = (db.prepare(`
    SELECT r.*, d.name as deviceName, d.type as deviceType
    FROM reservations r
    LEFT JOIN devices d ON r.deviceId = d.id
    WHERE r.userId = ?
    ORDER BY r.startTime DESC
    LIMIT 50
  `).all(req.user.userId) as Reservation[]).map(serializeReservation);

  res.json(pageResult(reservations, page, pageSize, reservations.length));
}

router.get('/', authMiddleware, listUserReservations);
router.get('/my', authMiddleware, listUserReservations);

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { deviceId, startTime, endTime, amount } = req.body;

  if (!deviceId || !startTime || !endTime) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const db = getDb();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Device | undefined;

  if (!device) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  const conflict = db.prepare(`
    SELECT * FROM reservations
    WHERE deviceId = ?
      AND status IN ('pending', 'active')
      AND NOT (endTime <= ? OR startTime >= ?)
  `).get(deviceId, startTime, endTime) as Reservation | undefined;

  if (conflict) {
    res.status(400).json({ error: '该时间段已被预约' });
    return;
  }

  const id = uuidv4();
  const status: ReservationStatus = 'pending';
  const finalAmount = amount || device.pricing;

  db.prepare(`
    INSERT INTO reservations (id, userId, deviceId, startTime, endTime, status, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.userId, deviceId, startTime, endTime, status, finalAmount);

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as Reservation;
  res.status(201).json(serializeReservation(reservation));
});

function cancelReservation(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id) as Reservation | undefined;

  if (!reservation) {
    res.status(404).json({ error: '预约不存在' });
    return;
  }

  if (reservation.userId !== req.user.userId) {
    res.status(403).json({ error: '无权操作此预约' });
    return;
  }

  if (reservation.status === 'completed' || reservation.status === 'cancelled') {
    res.status(400).json({ error: '预约状态不正确' });
    return;
  }

  db.prepare(`
    UPDATE reservations SET status = 'cancelled' WHERE id = ?
  `).run(req.params.id);

  const updated = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id) as Reservation;
  res.json(serializeReservation(updated));
}

router.put('/:id/cancel', authMiddleware, cancelReservation);
router.post('/:id/cancel', authMiddleware, cancelReservation);

export default router;
