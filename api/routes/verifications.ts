import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

router.post('/verify', (req: Request, res: Response) => {
  try {
    const { code, store_id, staff_id, service_id, appointment_id, notes } = req.body;

    const coupon = db.prepare(`
      SELECT 
        c.*,
        cp.name as package_name,
        cp.sale_price as price,
        cp.cost_price,
        cp.settlement_rule,
        cp.applicable_stores
      FROM coupons c
      JOIN coupon_packages cp ON c.package_id = cp.id
      WHERE c.coupon_code = ?
    `).get(code) as any;

    if (!coupon) {
      return res.status(404).json({ success: false, error: '券码不存在' });
    }

    if (coupon.status === 'used') {
      return res.status(400).json({ success: false, error: '券已全部使用完毕' });
    }
    if (coupon.status === 'refunded') {
      return res.status(400).json({ success: false, error: '券已退款' });
    }
    if (coupon.status === 'expired') {
      return res.status(400).json({ success: false, error: '券已过期' });
    }
    if (new Date(coupon.expire_date) < new Date()) {
      return res.status(400).json({ success: false, error: '券已过有效期' });
    }

    const remainingCount = coupon.total_uses - coupon.used_uses;
    if (remainingCount <= 0) {
      return res.status(400).json({ success: false, error: '剩余次数为0' });
    }

    let applicableStores: number[] = [];
    try {
      applicableStores = JSON.parse(coupon.applicable_stores || '[]');
    } catch {
      applicableStores = [];
    }

    if (applicableStores.length > 0 && !applicableStores.includes(store_id)) {
      return res.status(400).json({ success: false, error: '该券不适用当前门店' });
    }

    const todayVerification = db.prepare(`
      SELECT 1 FROM verifications 
      WHERE coupon_id = ? AND store_id = ? AND DATE(verification_time) = DATE('now')
    `).get(coupon.id, store_id);

    if (todayVerification && coupon.total_uses <= 1) {
      return res.status(400).json({ success: false, error: '该券今日已在本门店核销，防止重复核销' });
    }

    const newUsedCount = coupon.used_uses + 1;
    const newRemainingCount = coupon.total_uses - newUsedCount;
    const newStatus = newRemainingCount <= 0 ? 'used' : (coupon.status === 'active' ? 'active' : coupon.status);
    const perVerificationPrice = coupon.price / coupon.total_uses;
    const costAmount = coupon.cost_price / coupon.total_uses;
    const profitAmount = perVerificationPrice - costAmount;

    const verificationId = db.transaction(() => {
      const insertVerification = db.prepare(`
        INSERT INTO verifications (coupon_id, user_id, store_id, service_id, staff_id, appointment_id, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, 'success', ?)
      `);
      const result = insertVerification.run(
        coupon.id, 
        coupon.user_id, 
        store_id, 
        service_id || null, 
        staff_id || null, 
        appointment_id || null,
        notes || null
      );

      const vid = result.lastInsertRowid;

      db.prepare(`
        UPDATE coupons 
        SET used_uses = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newUsedCount, newStatus, coupon.id);

      db.prepare(`
        INSERT INTO settlements (store_id, redemption_id, coupon_id, amount, cost_amount, profit_amount, settlement_date, status)
        VALUES (?, ?, ?, ?, ?, ?, DATE('now'), 'pending')
      `).run(store_id, vid, coupon.id, perVerificationPrice, costAmount, profitAmount);

      if (appointment_id) {
        db.prepare(`
          UPDATE appointments 
          SET status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(appointment_id);
      }

      return vid;
    })();

    res.json({ 
      success: true, 
      data: {
        verification_id: verificationId,
        coupon_code: code,
        remaining_count: newRemainingCount,
        total_count: coupon.total_uses,
        is_completed: newRemainingCount <= 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/history', (req: Request, res: Response) => {
  try {
    const { store_id, start_date, end_date, page = 1, page_size = 20 } = req.query;
    
    let query = `
      SELECT 
        v.*,
        c.coupon_code,
        cp.name as package_name,
        u.name as user_name,
        u.phone as user_phone,
        s.name as service_name,
        st.name as store_name,
        stf.name as staff_name
      FROM verifications v
      JOIN coupons c ON v.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON v.user_id = u.id
      JOIN stores st ON v.store_id = st.id
      LEFT JOIN services s ON v.service_id = s.id
      LEFT JOIN users stf ON v.staff_id = stf.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (store_id) {
      query += ' AND v.store_id = ?';
      params.push(store_id);
    }
    if (start_date) {
      query += ' AND DATE(v.verification_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(v.verification_time) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY v.verification_time DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), (Number(page) - 1) * Number(page_size));

    const verifications = db.prepare(query).all(...params);

    res.json({ success: true, data: verifications });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const verification = db.prepare(`
      SELECT 
        v.*,
        c.coupon_code,
        cp.name as package_name,
        cp.description as package_description,
        u.name as user_name,
        u.phone as user_phone,
        st.name as store_name,
        s.name as service_name,
        stf.name as staff_name
      FROM verifications v
      JOIN coupons c ON v.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON v.user_id = u.id
      JOIN stores st ON v.store_id = st.id
      LEFT JOIN services s ON v.service_id = s.id
      LEFT JOIN users stf ON v.staff_id = stf.id
      WHERE v.id = ?
    `).get(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, error: 'Verification not found' });
    }

    res.json({ success: true, data: verification });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
