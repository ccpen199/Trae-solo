import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authMiddleware, type AuthRequest } from '../middleware.js';

const router = express.Router();

router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const contracts = db.prepare(`
    SELECT c.*,
           opp.title as opp_title, opp.type as opp_type,
           eb.company_name as buyer_name,
           es.company_name as seller_name
    FROM contracts c
    JOIN business_opportunities opp ON c.opportunity_id = opp.id
    JOIN enterprises eb ON c.buyer_id = eb.user_id
    JOIN enterprises es ON c.seller_id = es.user_id
    WHERE c.buyer_id = ? OR c.seller_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user!.id, req.user!.id);

  res.json(contracts);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const contract = db.prepare(`
    SELECT c.*,
           opp.title as opp_title, opp.type as opp_type, opp.region as opp_region,
           opp.available_date, opp.expiry_date, opp.quality_grade,
           eb.company_name as buyer_name, eb.unified_social_credit_code as buyer_uscc,
           eb.legal_person as buyer_legal, eb.registered_address as buyer_address,
           es.company_name as seller_name, es.unified_social_credit_code as seller_uscc,
           es.legal_person as seller_legal, es.registered_address as seller_address,
           n.id as negotiation_id, n.current_price, n.current_quantity
    FROM contracts c
    JOIN business_opportunities opp ON c.opportunity_id = opp.id
    JOIN enterprises eb ON c.buyer_id = eb.user_id
    JOIN enterprises es ON c.seller_id = es.user_id
    LEFT JOIN negotiations n ON c.negotiation_id = n.id
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }
  if (contract.buyer_id !== req.user!.id && contract.seller_id !== req.user!.id) {
    res.status(403).json({ error: '无权访问此合同' });
    return;
  }

  const order = db.prepare('SELECT * FROM orders WHERE contract_id = ?').get(contract.id) as any;
  const payments = db.prepare('SELECT * FROM payment_records WHERE order_id = ?').all(order?.id || '');

  res.json({ contract, order, payments });
});

router.post('/:id/sign', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { signature_url } = req.body;
    const db = getDb();
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
    if (!contract) {
      res.status(404).json({ error: '合同不存在' });
      return;
    }

    const isBuyer = contract.buyer_id === req.user!.id;
    const isSeller = contract.seller_id === req.user!.id;
    
    if (!isBuyer && !isSeller) {
      res.status(403).json({ error: '无权签署此合同' });
      return;
    }

    if (isBuyer && contract.buyer_signed_at) {
      res.status(400).json({ error: '买方已签署合同' });
      return;
    }
    if (isSeller && contract.seller_signed_at) {
      res.status(400).json({ error: '卖方已签署合同' });
      return;
    }

    let newStatus = contract.status;
    if (isBuyer) {
      newStatus = contract.seller_signed_at ? 'fully_signed' : 'signed_buyer';
      db.prepare(`
        UPDATE contracts 
        SET buyer_signature_url = ?, buyer_signed_at = datetime('now'), status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(signature_url || `https://sig.example.com/${uuidv4()}.png`, newStatus, req.params.id);
    } else {
      newStatus = contract.buyer_signed_at ? 'fully_signed' : 'signed_seller';
      db.prepare(`
        UPDATE contracts 
        SET seller_signature_url = ?, seller_signed_at = datetime('now'), status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(signature_url || `https://sig.example.com/${uuidv4()}.png`, newStatus, req.params.id);
    }

    const otherPartyId = isBuyer ? contract.seller_id : contract.buyer_id;
    const myRole = isBuyer ? '买方' : '卖方';

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), otherPartyId, 'contract',
      `${myRole}已签署合同`,
      `合同号 ${contract.id.substring(0, 8).toUpperCase()}... ${myRole}已完成签署，请您尽快签署。`,
      req.params.id
    );

    if (newStatus === 'fully_signed') {
      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE contract_id = ?').run('deposit_paid', req.params.id);

      const order = db.prepare('SELECT * FROM orders WHERE contract_id = ?').get(req.params.id) as any;
      if (order) {
        db.prepare(`
          INSERT INTO payment_records (id, order_id, type, amount, status, frozen_at)
          VALUES (?, ?, ?, ?, 'deposit_frozen', datetime('now'))
        `).run(uuidv4(), order.id, 'deposit', contract.deposit_amount);

        [contract.buyer_id, contract.seller_id].forEach(uid => {
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, content, related_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(), uid, 'contract',
            '合同已完全签署生效',
            `合同号 ${contract.id.substring(0, 8).toUpperCase()}... 双方已签署完成，合同正式生效。定金 ${contract.deposit_amount} 元已冻结，请按约定履行。`,
            req.params.id
          );
        });
      }
    }

    res.json({ status: newStatus, message: '合同签署成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/terminate', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const db = getDb();
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
    if (!contract) {
      res.status(404).json({ error: '合同不存在' });
      return;
    }
    if (contract.buyer_id !== req.user!.id && contract.seller_id !== req.user!.id) {
      res.status(403).json({ error: '无权操作此合同' });
      return;
    }
    if (contract.status === 'fully_signed') {
      res.status(400).json({ error: '已完全签署的合同需通过争议流程解除' });
      return;
    }

    db.prepare(`UPDATE contracts SET status = 'terminated', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE contract_id = ?`).run(req.params.id);

    const otherId = contract.buyer_id === req.user!.id ? contract.seller_id : contract.buyer_id;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), otherId, 'contract',
      '合同已终止',
      `合同号 ${contract.id.substring(0, 8).toUpperCase()}... 已被对方终止${reason ? `，原因：${reason}` : ''}。`,
      req.params.id
    );

    res.json({ message: '合同已终止' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
