import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE q.user_id = ?';
    const params: any[] = [req.user!.id];

    if (status) {
      whereClause += ' AND q.status = ?';
      params.push(status);
    }

    const quotes = db.prepare(`
      SELECT q.*, d.title as demand_title, d.budget_min, d.budget_max, e.name as enterprise_name
      FROM quotes q
      LEFT JOIN demands d ON q.demand_id = d.id
      LEFT JOIN enterprises e ON q.enterprise_id = e.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM quotes q ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: quotes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取我的报价错误:', error);
    res.status(500).json({ success: false, error: '获取我的报价失败' });
  }
});

router.get('/received', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, demand_id, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE d.user_id = ?';
    const params: any[] = [req.user!.id];

    if (status) {
      whereClause += ' AND q.status = ?';
      params.push(status);
    }

    if (demand_id) {
      whereClause += ' AND q.demand_id = ?';
      params.push(demand_id);
    }

    const quotes = db.prepare(`
      SELECT q.*, d.title as demand_title, e.name as enterprise_name, u.real_name as contact_person
      FROM quotes q
      LEFT JOIN demands d ON q.demand_id = d.id
      LEFT JOIN enterprises e ON q.enterprise_id = e.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM quotes q
      LEFT JOIN demands d ON q.demand_id = d.id
      ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: quotes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取收到的报价错误:', error);
    res.status(500).json({ success: false, error: '获取收到的报价失败' });
  }
});

router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { demand_id, price, unit, delivery_days, description, remark, attachments } = req.body;

    if (!demand_id || !price) {
      res.status(400).json({ success: false, error: '需求ID和报价金额不能为空' });
      return;
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
    if (!enterprise) {
      res.status(400).json({ success: false, error: '请先创建企业信息' });
      return;
    }

    const demand = db.prepare('SELECT status FROM demands WHERE id = ?').get(demand_id) as any;
    if (!demand || demand.status !== 'published') {
      res.status(400).json({ success: false, error: '需求不存在或未发布' });
      return;
    }

    const existing = db.prepare('SELECT id FROM quotes WHERE demand_id = ? AND user_id = ?').get(demand_id, req.user!.id);
    if (existing) {
      res.status(400).json({ success: false, error: '已对此需求报价' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO quotes (demand_id, enterprise_id, user_id, price, unit, delivery_days, description, remark, attachments, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      demand_id,
      enterprise.id,
      req.user!.id,
      price,
      unit || null,
      delivery_days || null,
      description || null,
      remark || null,
      attachments ? JSON.stringify(attachments) : null
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '报价提交成功',
      },
    });
  } catch (error) {
    console.error('创建报价错误:', error);
    res.status(500).json({ success: false, error: '创建报价失败' });
  }
});

router.post('/:id/accept', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const quote = db.prepare(`
      SELECT q.*, d.user_id as demand_user_id, d.title as demand_title
      FROM quotes q
      LEFT JOIN demands d ON q.demand_id = d.id
      WHERE q.id = ?
    `).get(id) as any;

    if (!quote) {
      res.status(404).json({ success: false, error: '报价不存在' });
      return;
    }

    if (quote.demand_user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权操作此报价' });
      return;
    }

    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    db.prepare(`
      INSERT INTO orders (
        order_no, demand_id, quote_id, buyer_id, supplier_id, enterprise_id,
        title, amount, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')
    `).run(
      orderNo,
      quote.demand_id,
      quote.id,
      quote.demand_user_id,
      quote.user_id,
      quote.enterprise_id,
      quote.demand_title || '订单',
      quote.price
    );

    db.prepare('UPDATE quotes SET status = ?, is_accepted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('accepted', id);

    db.prepare('UPDATE demands SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('quoted', quote.demand_id);

    res.json({ success: true, message: '报价已接受，订单已创建' });
  } catch (error) {
    console.error('接受报价错误:', error);
    res.status(500).json({ success: false, error: '接受报价失败' });
  }
});

router.post('/:id/reject', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const quote = db.prepare(`
      SELECT q.*, d.user_id as demand_user_id
      FROM quotes q
      LEFT JOIN demands d ON q.demand_id = d.id
      WHERE q.id = ?
    `).get(id) as any;

    if (!quote) {
      res.status(404).json({ success: false, error: '报价不存在' });
      return;
    }

    if (quote.demand_user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权操作此报价' });
      return;
    }

    db.prepare('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', id);

    res.json({ success: true, message: '报价已拒绝' });
  } catch (error) {
    console.error('拒绝报价错误:', error);
    res.status(500).json({ success: false, error: '拒绝报价失败' });
  }
});

export default router;
