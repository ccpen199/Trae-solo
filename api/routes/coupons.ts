import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/packages', (req: Request, res: Response) => {
  try {
    const packages = db.prepare(`
      SELECT 
        cp.*,
        cp.sale_price as price,
        cp.total_uses as total_count
      FROM coupon_packages cp
      WHERE cp.status = 'active'
      ORDER BY cp.created_at DESC
    `).all();

    packages.forEach((pkg: any) => {
      try {
        const storeIds = JSON.parse(pkg.applicable_stores || '[]');
        if (storeIds.length > 0) {
          const storeNames = db.prepare(
            `SELECT id, name FROM stores WHERE id IN (${storeIds.map(() => '?').join(',')})`
          ).all(...storeIds) as any[];
          pkg.applicable_stores = storeNames;
          pkg.store_count = storeNames.length;
        } else {
          pkg.applicable_stores = [];
          pkg.store_count = 0;
        }
      } catch {
        pkg.applicable_stores = [];
        pkg.store_count = 0;
      }
    });

    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/packages/:id', (req: Request, res: Response) => {
  try {
    const pkg = db.prepare(`
      SELECT cp.*, cp.sale_price as price, cp.total_uses as total_count
      FROM coupon_packages cp WHERE cp.id = ?
    `).get(req.params.id) as any;

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    try {
      pkg.applicable_stores = JSON.parse(pkg.applicable_stores || '[]');
    } catch {
      pkg.applicable_stores = [];
    }

    const stores = db.prepare(`
      SELECT s.* FROM stores s
      WHERE s.id IN (${pkg.applicable_stores.map(() => '?').join(',') || '0'})
    `).all(...pkg.applicable_stores);

    const services = db.prepare(`
      SELECT s.* FROM services s
      WHERE s.store_id IN (${pkg.applicable_stores.map(() => '?').join(',') || '0'})
    `).all(...pkg.applicable_stores);

    res.json({ success: true, data: { ...pkg, stores, services } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/packages', (req: Request, res: Response) => {
  try {
    const { name, description, total_count, price, cost_price, valid_days, purchase_limit, requires_appointment, commission_rate, store_ids, service_ids } = req.body;

    const validTo = new Date();
    validTo.setDate(validTo.getDate() + (valid_days || 30));

    const result = db.prepare(`
      INSERT INTO coupon_packages 
      (name, description, service_content, applicable_stores, valid_from, valid_to, purchase_limit, appointment_required, cost_price, sale_price, total_uses, settlement_rule)
      VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, 
      description, 
      service_ids ? JSON.stringify(service_ids) : '[]',
      JSON.stringify(store_ids || []),
      validTo.toISOString().split('T')[0],
      purchase_limit || 1,
      requires_appointment ? 1 : 0,
      cost_price || 0,
      price || 0,
      total_count || 1,
      `门店${Math.round((1 - (commission_rate || 0.1)) * 100)}%,平台${Math.round((commission_rate || 0.1) * 100)}%`
    );

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/my', (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id || 1;
    const coupons = db.prepare(`
      SELECT 
        c.id,
        c.coupon_code as code,
        c.package_id,
        c.user_id,
        c.total_uses as total_count,
        (c.total_uses - c.used_uses) as remaining_count,
        c.used_uses,
        c.status,
        c.expire_date as expire_at,
        c.purchase_time as purchased_at,
        c.created_at,
        cp.name as package_name,
        cp.description as package_description,
        cp.sale_price as price,
        u.name as user_name,
        u.phone as user_phone
      FROM coupons c
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:code', (req: Request, res: Response) => {
  try {
    const coupon = db.prepare(`
      SELECT 
        c.id,
        c.coupon_code as code,
        c.package_id,
        c.user_id,
        c.total_uses as total_count,
        (c.total_uses - c.used_uses) as remaining_count,
        c.used_uses,
        c.status,
        c.expire_date as expire_at,
        cp.name as package_name,
        cp.description as package_description,
        cp.service_content,
        cp.applicable_stores,
        cp.appointment_required as requires_appointment,
        cp.sale_price as price,
        cp.cost_price,
        u.name as user_name,
        u.phone as user_phone
      FROM coupons c
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON c.user_id = u.id
      WHERE c.coupon_code = ?
    `).get(req.params.code) as any;

    if (!coupon) {
      return res.status(404).json({ success: false, error: '券码不存在' });
    }

    try {
      coupon.applicable_stores = JSON.parse(coupon.applicable_stores || '[]');
    } catch {
      coupon.applicable_stores = [];
    }

    const reasons: string[] = [];

    if (coupon.status === 'used') {
      reasons.push('券已全部使用完毕');
    }
    if (coupon.status === 'refunded') {
      reasons.push('券已退款');
    }
    if (coupon.status === 'expired') {
      reasons.push('券已过期');
    }
    if (new Date(coupon.expire_at) < new Date()) {
      reasons.push('券已过有效期');
    }
    if (coupon.remaining_count <= 0) {
      reasons.push('剩余次数为0');
    }

    const applicableStores = db.prepare(`
      SELECT s.* FROM stores s
      WHERE s.id IN (${coupon.applicable_stores.map(() => '?').join(',') || '0'})
    `).all(...coupon.applicable_stores);

    const applicableServices = db.prepare(`
      SELECT s.* FROM services s
      WHERE s.store_id IN (${coupon.applicable_stores.map(() => '?').join(',') || '0'})
    `).all(...coupon.applicable_stores);

    const history = db.prepare(`
      SELECT v.*, st.name as store_name, s.name as service_name, u.name as staff_name
      FROM verifications v
      LEFT JOIN stores st ON v.store_id = st.id
      LEFT JOIN services s ON v.service_id = s.id
      LEFT JOIN users u ON v.staff_id = u.id
      WHERE v.coupon_id = ?
      ORDER BY v.verification_time DESC
    `).all(coupon.id);

    res.json({ 
      success: true, 
      data: {
        ...coupon,
        can_verify: reasons.length === 0,
        cannot_verify_reason: reasons.length > 0 ? reasons[0] : '',
        cannot_verify_reasons: reasons,
        applicable_stores: applicableStores,
        applicable_services: applicableServices,
        verification_history: history
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/purchase', (req: Request, res: Response) => {
  try {
    const { package_id, user_id, store_id } = req.body;

    const pkg = db.prepare('SELECT * FROM coupon_packages WHERE id = ?').get(package_id) as any;
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    const maxCode = db.prepare("SELECT MAX(CAST(SUBSTR(coupon_code, 4) AS INTEGER)) as max_code FROM coupons WHERE coupon_code LIKE 'CPN%'").get() as { max_code: number };
    const nextNum = String((maxCode.max_code || 0) + 1).padStart(6, '0');
    const code = `CPN${nextNum}`;

    const result = db.prepare(`
      INSERT INTO coupons (coupon_code, package_id, user_id, total_uses, used_uses, status, expire_date, purchase_time)
      VALUES (?, ?, ?, ?, 0, 'active', ?, datetime('now'))
    `).run(code, package_id, user_id, pkg.total_uses, pkg.valid_to);

    res.json({ success: true, data: { id: result.lastInsertRowid, code } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/stores/all', (req: Request, res: Response) => {
  try {
    const stores = db.prepare('SELECT * FROM stores ORDER BY name').all();
    res.json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/services/all', (req: Request, res: Response) => {
  try {
    const services = db.prepare(`
      SELECT s.*, st.name as store_name 
      FROM services s 
      LEFT JOIN stores st ON s.store_id = st.id 
      ORDER BY s.name
    `).all();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
