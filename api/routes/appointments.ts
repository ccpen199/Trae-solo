import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { store_id, user_id, status, date, page = 1, page_size = 20 } = req.query;
    
    let query = `
      SELECT DISTINCT
        a.*,
        c.coupon_code,
        cp.name as package_name,
        u.name as user_name,
        u.phone as user_phone,
        st.name as store_name,
        s.name as service_name,
        stf.name as staff_name
      FROM appointments a
      JOIN coupons c ON a.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON a.user_id = u.id
      JOIN stores st ON a.store_id = st.id
      LEFT JOIN services s ON a.service_item = s.name AND a.store_id = s.store_id
      LEFT JOIN users stf ON a.staff_id = stf.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (store_id) {
      query += ' AND a.store_id = ?';
      params.push(store_id);
    }
    if (user_id) {
      query += ' AND a.user_id = ?';
      params.push(user_id);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (date) {
      query += ' AND DATE(a.appointment_time) = ?';
      params.push(date);
    }

    query += ' ORDER BY a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), (Number(page) - 1) * Number(page_size));

    const appointments = db.prepare(query).all(...params);

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { coupon_id, user_id, store_id, service_id, staff_id, appointment_time, notes } = req.body;

    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(coupon_id) as any;
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    if (coupon.status !== 'active' && coupon.status !== 'partial') {
      return res.status(400).json({ success: false, error: '券状态不可预约' });
    }

    const remainingCount = coupon.total_uses - coupon.used_uses;
    if (remainingCount <= 0) {
      return res.status(400).json({ success: false, error: '券已无可用次数' });
    }

    const existing = db.prepare(`
      SELECT 1 FROM appointments 
      WHERE coupon_id = ? AND status = 'pending' AND appointment_time > CURRENT_TIMESTAMP
    `).get(coupon_id);

    if (existing) {
      return res.status(400).json({ success: false, error: '该券已有待完成的预约' });
    }

    let serviceName = '';
    if (service_id) {
      const service = db.prepare('SELECT name FROM services WHERE id = ?').get(service_id) as any;
      serviceName = service?.name || '';
    }

    const result = db.prepare(`
      INSERT INTO appointments (coupon_id, user_id, store_id, staff_id, service_item, appointment_time, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(coupon_id, user_id, store_id, staff_id || null, serviceName || null, appointment_time, notes || null);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { service_id, staff_id, appointment_time, notes, status } = req.body;

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    let serviceName = appointment.service_item;
    if (service_id) {
      const service = db.prepare('SELECT name FROM services WHERE id = ?').get(service_id) as any;
      serviceName = service?.name || serviceName;
    }

    db.prepare(`
      UPDATE appointments 
      SET staff_id = COALESCE(?, staff_id),
          service_item = COALESCE(?, service_item),
          appointment_time = COALESCE(?, appointment_time),
          remark = COALESCE(?, remark),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(staff_id || null, serviceName || null, appointment_time || null, notes || null, status || null, req.params.id);

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', req.params.id);

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/staff', (req: Request, res: Response) => {
  try {
    const { store_id } = req.query;
    let query = 'SELECT * FROM users WHERE role = ?';
    const params: any[] = ['staff'];

    if (store_id) {
      query += ' AND store_id = ?';
      params.push(store_id);
    }

    const staff = db.prepare(query).all(...params);
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
