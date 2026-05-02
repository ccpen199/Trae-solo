import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { packageConfigEngine } from '../engines/package-config-engine';
import { triageEngine } from '../engines/triage-engine';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId, packageId, reservationDate, timeSlot, patientInfo } = req.body;

    if (!packageId || !reservationDate || !timeSlot) {
      return res.status(400).json({ message: '请提供完整的预约信息' });
    }

    let finalPatientId = patientId;

    if (!finalPatientId && patientInfo) {
      const { name, gender, birthDate, idCard, phone, email, address } = patientInfo;

      if (!name || !gender || !birthDate || !idCard || !phone) {
        return res.status(400).json({ message: '请提供完整的患者信息' });
      }

      const existingPatient = await query(
        `SELECT id FROM patients WHERE id_card = $1`,
        [idCard]
      );

      if (existingPatient.rows.length > 0) {
        finalPatientId = existingPatient.rows[0].id;
      } else {
        const patientResult = await query(
          `INSERT INTO patients (id, name, gender, birth_date, id_card, phone, email, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [uuidv4(), name, gender, new Date(birthDate), idCard, phone, email, address]
        );
        finalPatientId = patientResult.rows[0].id;
      }
    }

    if (!finalPatientId) {
      return res.status(400).json({ message: '请提供患者ID或患者信息' });
    }

    const checkDate = new Date(reservationDate);
    const availability = await packageConfigEngine.validateReservationAvailability(
      packageId,
      checkDate,
      timeSlot
    );

    if (!availability.available) {
      return res.status(400).json({
        message: '预约失败',
        conflicts: availability.conflicts,
      });
    }

    const reservationCode = generateReservationCode();
    const orderNo = generateOrderNo();

    const pkg = await packageConfigEngine.getPackageById(packageId);
    if (!pkg) {
      return res.status(400).json({ message: '套餐不存在' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO examination_orders (id, order_no, patient_id, package_id, total_amount, paid_amount, status)
         VALUES ($1, $2, $3, $4, $5, 0, 'reserved')
         RETURNING *`,
        [uuidv4(), orderNo, finalPatientId, packageId, pkg.price]
      );

      const order = orderResult.rows[0];

      const reservationResult = await client.query(
        `INSERT INTO reservations (id, reservation_code, patient_id, package_id, order_id, reservation_date, time_slot, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'reserved')
         RETURNING *`,
        [uuidv4(), reservationCode, finalPatientId, packageId, order.id, checkDate, timeSlot]
      );

      const reservation = reservationResult.rows[0];

      for (const item of pkg.items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, package_item_id, item_name, department_id, item_type, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [uuidv4(), order.id, item.id, item.name, item.departmentId, item.itemType]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        reservationId: reservation.id,
        reservationCode,
        orderNo,
        status: 'reserved',
        message: '预约成功',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: '创建预约失败' });
  }
});

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId, status, date } = req.query;

    let queryText = `
      SELECT r.*, p.name as patient_name, p.phone as patient_phone,
             mp.name as package_name, mp.price,
             eo.order_no
      FROM reservations r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN medical_packages mp ON r.package_id = mp.id
      LEFT JOIN examination_orders eo ON r.order_id = eo.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (patientId) {
      queryText += ` AND r.patient_id = $${paramIndex++}`;
      params.push(patientId);
    }

    if (status) {
      queryText += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    if (date) {
      queryText += ` AND r.reservation_date = $${paramIndex++}`;
      params.push(new Date(date as string));
    }

    queryText += ` ORDER BY r.reservation_date DESC, r.created_at DESC`;

    const result = await query(queryText, params);

    const reservations = result.rows.map((row: any) => ({
      id: row.id,
      reservationCode: row.reservation_code,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      packageId: row.package_id,
      packageName: row.package_name,
      orderId: row.order_id,
      orderNo: row.order_no,
      price: parseFloat(row.price),
      reservationDate: row.reservation_date,
      timeSlot: row.time_slot,
      status: row.status,
      checkInTime: row.check_in_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: '获取预约列表失败' });
  }
});

router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const result = await query(
      `SELECT r.*, p.name as patient_name, p.phone as patient_phone, p.id_card as patient_id_card,
              mp.name as package_name, mp.price,
              eo.order_no, eo.status as order_status
       FROM reservations r
       LEFT JOIN patients p ON r.patient_id = p.id
       LEFT JOIN medical_packages mp ON r.package_id = mp.id
       LEFT JOIN examination_orders eo ON r.order_id = eo.id
       WHERE r.reservation_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '预约不存在' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      reservationCode: row.reservation_code,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      patientIdCard: row.patient_id_card,
      packageId: row.package_id,
      packageName: row.package_name,
      orderId: row.order_id,
      orderNo: row.order_no,
      price: parseFloat(row.price),
      reservationDate: row.reservation_date,
      timeSlot: row.time_slot,
      status: row.status,
      checkInTime: row.check_in_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get reservation by code error:', error);
    res.status(500).json({ message: '获取预约信息失败' });
  }
});

router.post('/:id/check-in', authenticateToken, requireRoles('admin', 'reception'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservationResult = await query(
      `SELECT r.*, p.name as patient_name
       FROM reservations r
       LEFT JOIN patients p ON r.patient_id = p.id
       WHERE r.id = $1`,
      [id]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ message: '预约不存在' });
    }

    const reservation = reservationResult.rows[0];

    if (reservation.status !== 'reserved') {
      return res.status(400).json({ message: '该预约不可签到' });
    }

    const checkInTime = new Date();

    await triageEngine.generateTriagePath(
      reservation.id,
      reservation.patient_id,
      reservation.package_id
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE reservations SET status = 'in_examination', check_in_time = $1, updated_at = NOW() WHERE id = $2`,
        [checkInTime, id]
      );

      await client.query(
        `UPDATE examination_orders SET status = 'in_examination', updated_at = NOW() WHERE id = $1`,
        [reservation.order_id]
      );

      const orderItemsResult = await client.query(
        `SELECT oi.*, p.name as patient_name, r.reservation_code
         FROM order_items oi
         LEFT JOIN patients p ON p.id = $1
         LEFT JOIN reservations r ON r.order_id = oi.order_id
         WHERE oi.order_id = $2
         ORDER BY oi.id`,
        [reservation.patient_id, reservation.order_id]
      );

      for (const item of orderItemsResult.rows) {
        await triageEngine.addToQueue(
          reservation.patient_id,
          reservation.patient_name,
          item.department_id,
          reservation.order_id,
          reservation.reservation_code
        );
      }

      await client.query('COMMIT');

      res.json({
        message: '签到成功',
        reservationId: id,
        checkInTime,
        status: 'in_examination',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: '签到失败' });
  }
});

router.post('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT status FROM reservations WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '预约不存在' });
    }

    const reservation = result.rows[0];

    if (reservation.status !== 'created' && reservation.status !== 'reserved') {
      return res.status(400).json({ message: '该预约不可取消' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE reservations SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      const orderResult = await client.query(
        `SELECT order_id FROM reservations WHERE id = $1`,
        [id]
      );

      if (orderResult.rows.length > 0) {
        await client.query(
          `UPDATE examination_orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
          [orderResult.rows[0].order_id]
        );
      }

      await client.query('COMMIT');

      res.json({ message: '预约已取消', status: 'cancelled' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ message: '取消预约失败' });
  }
});

function generateReservationCode(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RSV${year}${month}${day}${random}`;
}

function generateOrderNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${random}`;
}

import { pool } from '../database';
export default router;
