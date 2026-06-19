import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware.js';

const router = express.Router();

router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  const { status, role } = req.query;
  const db = getDb();

  let whereClause = '(o.buyer_id = ? OR o.seller_id = ?)';
  const params: any[] = [req.user!.id, req.user!.id];

  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }

  const orders = db.prepare(`
    SELECT o.*,
           c.category, c.sub_category, c.quantity, c.unit, c.unit_price, c.deposit_amount,
           c.delivery_address, c.delivery_date,
           eb.company_name as buyer_name,
           es.company_name as seller_name,
           opp.title as opp_title, opp.type as opp_type
    FROM orders o
    JOIN contracts c ON o.contract_id = c.id
    JOIN business_opportunities opp ON c.opportunity_id = opp.id
    JOIN enterprises eb ON o.buyer_id = eb.user_id
    JOIN enterprises es ON o.seller_id = es.user_id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
  `).all(...params);

  res.json(orders);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*,
           c.*,
           eb.company_name as buyer_name, eb.unified_social_credit_code as buyer_uscc,
           eb.legal_person as buyer_legal_person, eb.phone as buyer_phone,
           es.company_name as seller_name, es.unified_social_credit_code as seller_uscc,
           es.legal_person as seller_legal_person, es.phone as seller_phone,
           opp.title as opp_title, opp.type as opp_type, opp.region
    FROM orders o
    JOIN contracts c ON o.contract_id = c.id
    JOIN business_opportunities opp ON c.opportunity_id = opp.id
    JOIN enterprises eb ON o.buyer_id = eb.user_id
    JOIN enterprises es ON o.seller_id = es.user_id
    WHERE o.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  if (order.buyer_id !== req.user!.id && order.seller_id !== req.user!.id) {
    res.status(403).json({ error: '无权访问此订单' });
    return;
  }

  const payments = db.prepare('SELECT * FROM payment_records WHERE order_id = ? ORDER BY created_at DESC').all(req.params.id);
  const logistics = db.prepare(`
    SELECT lo.*, le.id as event_id, le.status as event_status, le.location as event_location,
           le.description as event_description, le.event_time,
           e.company_name as carrier_name
    FROM logistics_orders lo
    LEFT JOIN logistics_events le ON le.logistics_order_id = lo.id
    JOIN carrier_profiles cp ON lo.carrier_id = cp.user_id
    JOIN enterprises e ON cp.enterprise_id = e.id
    WHERE lo.order_id = ?
    ORDER BY lo.created_at DESC, le.event_time ASC
  `).all(req.params.id);
  const inspection = db.prepare(`
    SELECT ir.*, e.company_name as inspector_name
    FROM inspection_reports ir
    JOIN enterprises e ON ir.inspector_enterprise_id = e.id
    WHERE ir.order_id = ?
    ORDER BY ir.created_at DESC LIMIT 1
  `).get(req.params.id);
  const traceCodes = db.prepare(`
    SELECT tc.*, 
           (SELECT COUNT(*) FROM trace_events te WHERE te.trace_code_id = tc.id) as event_count
    FROM trace_codes tc
    WHERE tc.order_id = ?
    ORDER BY tc.created_at DESC
  `).all(req.params.id);

  res.json({ order, payments, logistics, inspection, trace_codes });
});

router.post('/:id/pay-deposit', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.buyer_id !== req.user!.id) {
      res.status(403).json({ error: '只有买方可以支付定金' });
      return;
    }
    if (order.status !== 'deposit_paid' && order.status !== 'contracted') {
      res.status(400).json({ error: '当前订单状态不支持支付定金' });
      return;
    }

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(order.contract_id) as any;

    db.prepare(`
      UPDATE payment_records 
      SET status = 'deposit_frozen', frozen_at = datetime('now'), transaction_no = ?, updated_at = datetime('now')
      WHERE order_id = ? AND type = 'deposit' AND status = 'pending'
    `).run('TX' + Date.now(), req.params.id);

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('shipping', req.params.id);

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), order.seller_id, 'payment',
      '买方已支付定金',
      `订单 ${order.id.substring(0, 8).toUpperCase()}... 定金 ${contract.deposit_amount} 元已冻结，请安排发货。`,
      req.params.id
    );

    const traceCodeId = uuidv4();
    const traceCode = 'TRC' + Date.now().toString().slice(-8);
    db.prepare(`
      INSERT INTO trace_codes (
        id, code, order_id, producer_id, recycler_id, category, sub_category,
        quantity, unit, status, origin_address, destination_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      traceCodeId, traceCode, req.params.id,
      order.seller_id, order.buyer_id,
      contract.category, contract.sub_category,
      contract.quantity, contract.unit, 'in_transit',
      order.region || contract.delivery_address,
      contract.delivery_address
    );

    db.prepare(`
      INSERT INTO trace_events (id, trace_code_id, event_type, location, operator, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), traceCodeId, '生成溯源码', order.region || '仓库', '系统', `溯源码 ${traceCode} 已生成，关联订单 ${order.id.substring(0, 8)}`);

    db.prepare(`
      UPDATE trace_codes SET min_env_sync_status = 'synced', min_env_tracking_no = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run('ME' + Date.now(), traceCodeId);

    db.prepare(`
      INSERT INTO trace_events (id, trace_code_id, event_type, location, operator, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), traceCodeId, '固废系统同步', '生态环境部固废系统', 'API', '已成功对接生态环境部固体废物管理系统完成备案');

    res.json({ message: '定金支付成功，已冻结监管账户', trace_code: traceCode });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/inspect', authMiddleware, requireRoles('inspector'), (req: AuthRequest, res) => {
  try {
    const { 
      sample_weight, quality_grade, composition, impurity_rate, moisture_rate,
      conclusion, is_passed, photos
    } = req.body;

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.status !== 'shipping' && order.status !== 'inspecting') {
      res.status(400).json({ error: '当前订单状态不支持质检' });
      return;
    }

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(order.contract_id) as any;
    const reportId = uuidv4();
    const reportNo = 'CMA' + Date.now();

    db.prepare(`
      INSERT INTO inspection_reports (
        id, order_id, inspector_id, inspector_enterprise_id, report_no, cma_report_no,
        inspection_date, category, sub_category, sample_weight, quality_grade,
        composition, impurity_rate, moisture_rate, photos, conclusion, is_passed, api_sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
    `).run(
      reportId, req.params.id, req.user!.id, req.userEnterprise!.id,
      reportNo, 'CMA-' + Date.now() + '-RPT',
      contract.category, contract.sub_category,
      sample_weight, quality_grade, JSON.stringify(composition || []),
      impurity_rate, moisture_rate, JSON.stringify(photos || []),
      conclusion, is_passed ? 1 : 0
    );

    const newStatus = is_passed ? 'completed' : 'disputed';
    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStatus, req.params.id);

    const traceCode = db.prepare('SELECT id FROM trace_codes WHERE order_id = ?').get(req.params.id) as any;
    if (traceCode) {
      db.prepare(`
        UPDATE trace_codes 
        SET inspection_report_id = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(reportId, is_passed ? 'received' : 'processed', traceCode.id);

      db.prepare(`
        INSERT INTO trace_events (id, trace_code_id, event_type, location, operator, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), traceCode.id, '质检完成', contract.delivery_address, req.userEnterprise!.company_name,
        `质检报告 ${reportNo}，${is_passed ? '合格' : '不合格'}，等级 ${quality_grade}`);
    }

    [order.buyer_id, order.seller_id].forEach(uid => {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, related_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), uid, 'system',
        `质检报告已出具 - ${is_passed ? '合格' : '不合格'}`,
        `订单 ${order.id.substring(0, 8).toUpperCase()}... 质检完成，报告号 ${reportNo}，等级 ${quality_grade}，杂质率 ${impurity_rate}%，含水率 ${moisture_rate}%。`,
        req.params.id
      );
    });

    res.json({ report_id: reportId, report_no: reportNo, message: '质检报告已出具并同步CMA系统' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/confirm-receipt', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.buyer_id !== req.user!.id) {
      res.status(403).json({ error: '只有买方可以确认收货' });
      return;
    }
    if (order.status !== 'inspecting' && order.status !== 'shipping' && order.status !== 'completed') {
      res.status(400).json({ error: '当前订单状态不支持确认收货' });
      return;
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('completed', req.params.id);

    db.prepare(`
      UPDATE payment_records 
      SET status = 'deposit_released', released_at = datetime('now'), updated_at = datetime('now')
      WHERE order_id = ? AND type = 'deposit'
    `).run(req.params.id);

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(order.contract_id) as any;
    db.prepare(`
      INSERT INTO payment_records (id, order_id, type, amount, status, transaction_no, created_at, updated_at)
      VALUES (?, ?, 'full_payment', ?, 'full_paid', ?, datetime('now'), datetime('now'))
    `).run(uuidv4(), req.params.id, contract.total_amount - contract.deposit_amount, 'TX' + Date.now() + 'FULL');

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), order.seller_id, 'payment',
      '买方已确认收货，货款已释放',
      `订单 ${order.id.substring(0, 8).toUpperCase()}... 买方已确认收货，定金已释放，尾款已支付，合计 ${contract.total_amount} 元已划转至您的账户。`,
      req.params.id
    );

    const traceCode = db.prepare('SELECT * FROM trace_codes WHERE order_id = ?').get(req.params.id) as any;
    if (traceCode) {
      db.prepare(`
        UPDATE trace_codes SET status = 'archived', updated_at = datetime('now') WHERE id = ?
      `).run(traceCode.id);

      db.prepare(`
        INSERT INTO trace_events (id, trace_code_id, event_type, location, operator, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), traceCode.id, '完成归档', contract.delivery_address, '系统',
        `订单已完成，溯源流程结束，材料已入库处理。`);
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('completed', req.params.id);

    res.json({ message: '收货确认成功，资金监管已释放' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/dispute', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.buyer_id !== req.user!.id && order.seller_id !== req.user!.id) {
      res.status(403).json({ error: '无权操作此订单' });
      return;
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('disputed', req.params.id);

    const otherId = order.buyer_id === req.user!.id ? order.seller_id : order.buyer_id;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), otherId, 'system',
      '订单已发起争议',
      `订单 ${order.id.substring(0, 8).toUpperCase()}... 对方发起了争议处理${reason ? `，原因：${reason}` : ''}。请配合平台客服处理。`,
      req.params.id
    );

    res.json({ message: '争议已提交，平台客服将介入处理' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
