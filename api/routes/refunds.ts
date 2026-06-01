import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, page_size = 20 } = req.query;
    
    let query = `
      SELECT 
        r.*,
        r.refund_type as type,
        r.refund_amount as amount,
        c.coupon_code,
        cp.name as package_name,
        cp.sale_price as package_price,
        u.name as user_name,
        u.phone as user_phone
      FROM refunds r
      JOIN coupons c ON r.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND r.refund_type = ?';
      params.push(type);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), (Number(page) - 1) * Number(page_size));

    const refunds = db.prepare(query).all(...params);

    refunds.forEach((r: any) => {
      r.operator_name = r.operator;
      r.type = r.refund_type === 'full' ? 'unused' : 
               r.refund_type === 'platform_compensation' ? 'platform' : 
               r.refund_type;
    });

    res.json({ success: true, data: refunds });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { coupon_id, user_id, type, reason } = req.body;

    const coupon = db.prepare(`
      SELECT c.*, cp.sale_price as price, cp.total_uses
      FROM coupons c
      JOIN coupon_packages cp ON c.package_id = cp.id
      WHERE c.id = ?
    `).get(coupon_id) as any;

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    let amount = 0;
    const remainingCount = coupon.total_uses - coupon.used_uses;
    const perPrice = coupon.price / coupon.total_uses;
    let refundType = type;

    switch (type) {
      case 'unused':
        if (coupon.used_uses > 0) {
          return res.status(400).json({ success: false, error: '该券已使用过，不能申请未使用退款' });
        }
        amount = coupon.price;
        refundType = 'full';
        break;
      case 'partial':
        if (coupon.used_uses === 0) {
          return res.status(400).json({ success: false, error: '该券未使用，请申请未使用退款' });
        }
        amount = perPrice * remainingCount;
        break;
      case 'expired':
        amount = perPrice * remainingCount * 0.5;
        break;
      case 'platform':
        amount = coupon.price;
        refundType = 'platform_compensation';
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid refund type' });
    }

    const result = db.prepare(`
      INSERT INTO refunds (coupon_id, user_id, refund_type, refund_amount, status, reason)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(coupon_id, user_id, refundType, amount, reason || null);

    res.json({ success: true, data: { id: result.lastInsertRowid, amount } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id/approve', (req: Request, res: Response) => {
  try {
    const { operator_id } = req.body;

    const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(req.params.id) as any;
    if (!refund) {
      return res.status(404).json({ success: false, error: 'Refund not found' });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({ success: false, error: '该退款已处理' });
    }

    let operatorName = '';
    if (operator_id) {
      const operator = db.prepare('SELECT name FROM users WHERE id = ?').get(operator_id) as any;
      operatorName = operator?.name || '';
    }

    db.prepare(`
      UPDATE refunds 
      SET status = 'approved', operator = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operatorName || '系统', req.params.id);

    db.prepare(`
      UPDATE coupons 
      SET status = 'refunded', used_uses = total_uses, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(refund.coupon_id);

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id/reject', (req: Request, res: Response) => {
  try {
    const { operator_id, reason } = req.body;

    const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(req.params.id) as any;
    if (!refund) {
      return res.status(404).json({ success: false, error: 'Refund not found' });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({ success: false, error: '该退款已处理' });
    }

    let operatorName = '';
    if (operator_id) {
      const operator = db.prepare('SELECT name FROM users WHERE id = ?').get(operator_id) as any;
      operatorName = operator?.name || '';
    }

    db.prepare(`
      UPDATE refunds 
      SET status = 'rejected', operator = ?, reason = COALESCE(?, reason), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operatorName || '系统', reason || null, req.params.id);

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
