import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authMiddleware, requireVerifiedEnterprise, type AuthRequest } from '../middleware.js';

const router = express.Router();

router.post('/', authMiddleware, requireVerifiedEnterprise, (req: AuthRequest, res) => {
  try {
    const { opportunity_id, initial_price, initial_quantity, message } = req.body;
    const db = getDb();

    const opp = db.prepare('SELECT * FROM business_opportunities WHERE id = ?').get(opportunity_id) as any;
    if (!opp) {
      res.status(404).json({ error: '商机不存在' });
      return;
    }
    if (opp.status !== 'active') {
      res.status(400).json({ error: '该商机已不可发起议价' });
      return;
    }
    if (opp.publisher_id === req.user!.id) {
      res.status(400).json({ error: '不能与自己发起议价' });
      return;
    }

    const existing = db.prepare(`
      SELECT id FROM negotiations 
      WHERE opportunity_id = ? AND initiator_id = ? AND responder_id = ? AND status = 'active'
    `).get(opportunity_id, req.user!.id, opp.publisher_id);
    
    if (existing) {
      res.status(200).json({ id: existing.id, message: '已有进行中的议价' });
      return;
    }

    const price = initial_price ?? ((opp.min_price + opp.max_price) / 2);
    const quantity = initial_quantity ?? opp.quantity;
    const id = uuidv4();

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO negotiations (id, opportunity_id, initiator_id, responder_id, current_price, current_quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, opportunity_id, req.user!.id, opp.publisher_id, price, quantity);

      db.prepare(`
        INSERT INTO negotiation_messages (id, negotiation_id, sender_id, price, quantity, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, req.user!.id, price, quantity, message || '发起议价邀请');

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, related_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), opp.publisher_id, 'negotiation',
        '收到新的议价邀请',
        `${req.userEnterprise!.company_name} 向您发起了议价：${opp.title}，报价 ${price} 元/吨`,
        id
      );
    });

    transaction();

    res.status(201).json({ id, message: '议价邀请已发送' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const negotiations = db.prepare(`
    SELECT n.*, 
           opp.title as opp_title, opp.category, opp.sub_category, opp.quantity as opp_quantity,
           opp.type as opp_type,
           ei.company_name as initiator_name,
           er.company_name as responder_name
    FROM negotiations n
    JOIN business_opportunities opp ON n.opportunity_id = opp.id
    JOIN enterprises ei ON n.initiator_id = ei.user_id
    JOIN enterprises er ON n.responder_id = er.user_id
    WHERE n.initiator_id = ? OR n.responder_id = ?
    ORDER BY n.updated_at DESC
  `).all(req.user!.id, req.user!.id);

  res.json(negotiations);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const neg = db.prepare(`
    SELECT n.*, 
           opp.*,
           ei.company_name as initiator_name, ei.id as initiator_enterprise_id,
           er.company_name as responder_name, er.id as responder_enterprise_id
    FROM negotiations n
    JOIN business_opportunities opp ON n.opportunity_id = opp.id
    JOIN enterprises ei ON n.initiator_id = ei.user_id
    JOIN enterprises er ON n.responder_id = er.user_id
    WHERE n.id = ?
  `).get(req.params.id) as any;

  if (!neg) {
    res.status(404).json({ error: '议价不存在' });
    return;
  }
  if (neg.initiator_id !== req.user!.id && neg.responder_id !== req.user!.id) {
    res.status(403).json({ error: '无权访问此议价' });
    return;
  }

  const messages = db.prepare(`
    SELECT nm.*, u.username, e.company_name
    FROM negotiation_messages nm
    JOIN users u ON nm.sender_id = u.id
    JOIN enterprises e ON u.id = e.user_id
    WHERE nm.negotiation_id = ?
    ORDER BY nm.created_at ASC
  `).all(req.params.id);

  res.json({ negotiation: neg, messages });
});

router.post('/:id/messages', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { price, quantity, message } = req.body;
    const db = getDb();

    const neg = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(req.params.id) as any;
    if (!neg) {
      res.status(404).json({ error: '议价不存在' });
      return;
    }
    if (neg.initiator_id !== req.user!.id && neg.responder_id !== req.user!.id) {
      res.status(403).json({ error: '无权参与此议价' });
      return;
    }
    if (neg.status !== 'active') {
      res.status(400).json({ error: '该议价已结束' });
      return;
    }

    db.prepare(`
      INSERT INTO negotiation_messages (id, negotiation_id, sender_id, price, quantity, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, req.user!.id, price || null, quantity || null, message || '');

    if (price || quantity) {
      db.prepare(`
        UPDATE negotiations 
        SET current_price = COALESCE(?, current_price),
            current_quantity = COALESCE(?, current_quantity),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(price || null, quantity || null, req.params.id);
    } else {
      db.prepare('UPDATE negotiations SET updated_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
    }

    const receiverId = neg.initiator_id === req.user!.id ? neg.responder_id : neg.initiator_id;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), receiverId, 'negotiation',
      '议价有新消息',
      `${req.userEnterprise?.company_name} 发来了新的议价消息${price ? `，最新报价 ${price} 元/吨` : ''}`,
      req.params.id
    );

    res.json({ message: '消息已发送' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/accept', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const neg = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(req.params.id) as any;
    if (!neg) {
      res.status(404).json({ error: '议价不存在' });
      return;
    }
    if (neg.responder_id !== req.user!.id) {
      res.status(403).json({ error: '只有被议价方可以接受' });
      return;
    }
    if (neg.status !== 'active') {
      res.status(400).json({ error: '该议价已结束' });
      return;
    }

    const opp = db.prepare('SELECT * FROM business_opportunities WHERE id = ?').get(neg.opportunity_id) as any;

    const contractId = uuidv4();
    const orderId = uuidv4();
    const depositAmount = Math.round(neg.current_price * neg.current_quantity * 0.2);
    const totalAmount = Math.round(neg.current_price * neg.current_quantity);

    const transaction = db.transaction(() => {
      db.prepare('UPDATE negotiations SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('accepted', req.params.id);
      db.prepare('UPDATE business_opportunities SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('matched', neg.opportunity_id);

      db.prepare(`
        INSERT INTO contracts (
          id, negotiation_id, opportunity_id, buyer_id, seller_id,
          category, sub_category, quantity, unit, unit_price, total_amount,
          deposit_ratio, deposit_amount, quality_standard, delivery_method,
          delivery_address, delivery_date, inspection_method, payment_terms, breach_clause
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        contractId, neg.id, neg.opportunity_id,
        neg.initiator_id, neg.responder_id,
        opp.category, opp.sub_category,
        neg.current_quantity, opp.unit, neg.current_price, totalAmount,
        0.2, depositAmount,
        '按国家行业标准执行，需符合CMA质检报告要求',
        opp.type === 'supply' ? '供方配送' : '需方自提',
        opp.type === 'supply' ? opp.region : req.userEnterprise!.region,
        new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        '委托CMA认证质检机构进行第三方检测',
        `1. 合同签署后24小时内买方支付${depositAmount}元定金（合同总金额20%）；2. 质检合格并验收后3个工作日内支付剩余尾款${totalAmount - depositAmount}元`,
        '1. 违约方需向守约方支付合同总金额10%的违约金；2. 因不可抗力导致的违约双方协商解决'
      );

      db.prepare(`
        INSERT INTO orders (id, contract_id, buyer_id, seller_id, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, contractId, neg.initiator_id, neg.responder_id, totalAmount, 'contracted');

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, related_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), neg.initiator_id, 'contract',
        '对方已接受议价，请签署合同',
        `合同已生成，金额 ${totalAmount} 元，请尽快签署电子合同。`,
        contractId
      );

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, related_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), neg.responder_id, 'contract',
        '请签署电子合同',
        `您已接受议价，合同金额 ${totalAmount} 元，请签署电子合同。`,
        contractId
      );
    });

    transaction();

    res.json({ contract_id: contractId, order_id: orderId, message: '已接受议价，合同已生成' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reject', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const db = getDb();
    const neg = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(req.params.id) as any;
    if (!neg) {
      res.status(404).json({ error: '议价不存在' });
      return;
    }
    if (neg.responder_id !== req.user!.id) {
      res.status(403).json({ error: '只有被议价方可以拒绝' });
      return;
    }
    if (neg.status !== 'active') {
      res.status(400).json({ error: '该议价已结束' });
      return;
    }

    db.prepare('UPDATE negotiations SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('rejected', req.params.id);

    db.prepare(`
      INSERT INTO negotiation_messages (id, negotiation_id, sender_id, message)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, req.user!.id, `拒绝议价。原因：${reason || '不接受当前条件'}`);

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), neg.initiator_id, 'negotiation',
      '议价被拒绝',
      `对方拒绝了您的议价邀请${reason ? `，原因：${reason}` : ''}。`,
      req.params.id
    );

    res.json({ message: '已拒绝议价' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
