import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function generateOrderNo(): string {
  const date = new Date();
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0') +
    date.getHours().toString().padStart(2, '0') +
    date.getMinutes().toString().padStart(2, '0') +
    date.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RE${timestamp}${random}`;
}

function calculateTax(price: number, type: string, isFirstHouse: boolean = true): { deedTax: number; individualTax: number; vat: number; total: number } {
  let deedTax = 0;
  let individualTax = 0;
  let vat = 0;

  if (type === 'new') {
    deedTax = price * (isFirstHouse ? 0.015 : 0.03);
  } else if (type === 'secondhand') {
    deedTax = price * (isFirstHouse ? 0.015 : 0.03);
    individualTax = price * 0.01;
    vat = price * 0.053;
  }

  return {
    deedTax: Math.round(deedTax * 100) / 100,
    individualTax: Math.round(individualTax * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round((deedTax + individualTax + vat) * 100) / 100
  };
}

router.get('/tax/calculate', (req, res) => {
  const { price, type, isFirstHouse } = req.query;
  
  if (!price || !type) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  const result = calculateTax(Number(price), String(type), isFirstHouse !== 'false');
  res.json(result);
});

router.get('/public', (req, res) => {
  const { type, page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = '';
  let params: any[] = [];

  if (type && type !== 'all') {
    where = 'WHERE t.type = ?';
    params.push(type);
  }

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM transactions t ${where}`
  ).get(...params) as { count: number };

  const list = db.prepare(
    `SELECT t.id, t.order_no, t.type, t.price, t.status, t.created_at, t.contract_signed, t.fund_escrow, t.transfer_status,
            p.title as property_title, p.images as property_images, p.address as property_address, p.area as property_area, p.district,
            b.username as buyer_name, s.username as seller_name,
            a.real_name as agent_name
     FROM transactions t
     JOIN properties p ON t.property_id = p.id
     JOIN users b ON t.buyer_id = b.id
     JOIN users s ON t.seller_id = s.id
     LEFT JOIN agents a ON t.agent_id = a.id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);

  const listWithProgress = (list as any[]).map(t => {
    const progress = db.prepare(
      "SELECT step, status FROM transaction_progress WHERE transaction_id = ? ORDER BY id"
    ).all(t.id);
    const progressMap: Record<string, string> = {};
    progress.forEach((p: any) => { progressMap[p.step] = p.status; });
    return { ...t, progress: progressMap };
  });

  res.json({ list: listWithProgress, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/public/:id', (req, res) => {
  const transaction = db.prepare(
    `SELECT t.id, t.order_no, t.type, t.price, t.status, t.created_at, t.contract_signed, t.fund_escrow, t.fund_amount, t.transfer_status,
            p.title as property_title, p.images as property_images, p.address as property_address, p.area as property_area,
            b.username as buyer_name, s.username as seller_name,
            a.real_name as agent_name, a.agency as agent_agency
     FROM transactions t
     JOIN properties p ON t.property_id = p.id
     JOIN users b ON t.buyer_id = b.id
     JOIN users s ON t.seller_id = s.id
     LEFT JOIN agents a ON t.agent_id = a.id
     WHERE t.id = ?`
  ).get(req.params.id);

  if (!transaction) {
    res.status(404).json({ message: '交易不存在' });
    return;
  }

  const progress = db.prepare(
    'SELECT step, status, operator, created_at FROM transaction_progress WHERE transaction_id = ? ORDER BY id'
  ).all(req.params.id);

  const tax = calculateTax((transaction as any).price, (transaction as any).type);

  res.json({ ...transaction, progress, tax });
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, type, price, sellerId } = req.body;

  if (!propertyId || !type || !price) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
  if (!property) {
    res.status(404).json({ message: '房源不存在' });
    return;
  }

  const orderNo = generateOrderNo();
  const actualSellerId = sellerId || (property as any).owner_id;

  const result = db.prepare(
    `INSERT INTO transactions 
     (order_no, property_id, buyer_id, seller_id, agent_id, type, price)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orderNo, propertyId, req.user!.id, actualSellerId, 
    (property as any).agent_id, type, price
  );

  const steps = ['sign_contract', 'fund_escrow', 'tax_payment', 'property_transfer', 'delivery'];
  const insertStep = db.prepare(
    'INSERT INTO transaction_progress (transaction_id, step, status) VALUES (?, ?, ?)'
  );
  steps.forEach(step => {
    insertStep.run(result.lastInsertRowid, step, 'pending');
  });

  res.json({ id: result.lastInsertRowid, orderNo, message: '交易创建成功' });
});

router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  const { role, type, page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = '';
  let params: any[] = [];

  if (role === 'buyer') {
    where = 'WHERE t.buyer_id = ?';
    params.push(req.user!.id);
  } else if (role === 'seller') {
    where = 'WHERE t.seller_id = ?';
    params.push(req.user!.id);
  } else if (role === 'agent') {
    where = 'WHERE t.agent_id = ?';
    const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;
    params.push(agent?.id || 0);
  } else {
    where = 'WHERE t.buyer_id = ? OR t.seller_id = ?';
    params.push(req.user!.id, req.user!.id);
  }

  if (type && type !== 'all') {
    where += ' AND t.type = ?';
    params.push(type);
  }

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM transactions t ${where}`
  ).get(...params) as { count: number };

  const list = db.prepare(
    `SELECT t.*, p.title as property_title, p.images as property_images, p.address as property_address,
            b.username as buyer_name, s.username as seller_name,
            a.real_name as agent_name
     FROM transactions t
     JOIN properties p ON t.property_id = p.id
     JOIN users b ON t.buyer_id = b.id
     JOIN users s ON t.seller_id = s.id
     LEFT JOIN agents a ON t.agent_id = a.id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const transaction = db.prepare(
    `SELECT t.*, p.title as property_title, p.images as property_images, p.address as property_address, p.area as property_area,
            b.username as buyer_name, b.phone as buyer_phone,
            s.username as seller_name, s.phone as seller_phone,
            a.real_name as agent_name, a.phone as agent_phone, a.agency as agent_agency
     FROM transactions t
     JOIN properties p ON t.property_id = p.id
     JOIN users b ON t.buyer_id = b.id
     JOIN users s ON t.seller_id = s.id
     LEFT JOIN agents a ON t.agent_id = a.id
     WHERE t.id = ?`
  ).get(req.params.id);

  if (!transaction) {
    res.status(404).json({ message: '交易不存在' });
    return;
  }

  const progress = db.prepare(
    'SELECT * FROM transaction_progress WHERE transaction_id = ? ORDER BY id'
  ).all(req.params.id);

  const tax = calculateTax((transaction as any).price, (transaction as any).type);

  res.json({ ...transaction, progress, tax });
});

router.post('/:id/sign', authMiddleware, (req: AuthRequest, res) => {
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!transaction) {
    res.status(404).json({ message: '交易不存在' });
    return;
  }

  db.prepare(
    `UPDATE transactions SET contract_signed = 1, contract_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run('/contracts/' + req.params.id + '.pdf', req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'completed', operator = ?, created_at = CURRENT_TIMESTAMP WHERE transaction_id = ? AND step = 'sign_contract'`
  ).run(req.user!.username, req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'processing' WHERE transaction_id = ? AND step = 'fund_escrow'`
  ).run(req.params.id);

  db.prepare(
    `INSERT INTO regulatory_records (transaction_id, record_type, record_content, status)
     VALUES (?, 'contract_sign', '电子签约完成，已同步至住建监管平台', 'synced')`
  ).run(req.params.id);

  res.json({ message: '签约成功' });
});

router.post('/:id/escrow', authMiddleware, (req: AuthRequest, res) => {
  const { amount } = req.body;
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!transaction) {
    res.status(404).json({ message: '交易不存在' });
    return;
  }

  const escrowAmount = amount || (transaction as any).price * 0.3;

  db.prepare(
    `UPDATE transactions SET fund_escrow = 1, fund_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(escrowAmount, req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'completed', operator = ?, created_at = CURRENT_TIMESTAMP WHERE transaction_id = ? AND step = 'fund_escrow'`
  ).run(req.user!.username, req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'processing' WHERE transaction_id = ? AND step = 'tax_payment'`
  ).run(req.params.id);

  res.json({ message: '资金监管完成' });
});

router.post('/:id/transfer', authMiddleware, (req: AuthRequest, res) => {
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!transaction) {
    res.status(404).json({ message: '交易不存在' });
    return;
  }

  db.prepare(
    `UPDATE transactions SET transfer_status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'completed', operator = ?, created_at = CURRENT_TIMESTAMP WHERE transaction_id = ? AND step = 'tax_payment'`
  ).run(req.user!.username, req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'processing' WHERE transaction_id = ? AND step = 'property_transfer'`
  ).run(req.params.id);

  db.prepare(
    `INSERT INTO regulatory_records (transaction_id, record_type, record_content, status, platform_ref_no)
     VALUES (?, 'transfer_apply', '产权过户申请已提交，等待审核', 'pending', ?)`
  ).run(req.params.id, 'JG' + Date.now());

  res.json({ message: '过户申请已提交' });
});

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res) => {
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!transaction) {
    res.status(404).json({ message: '交易不存在' });
    return;
  }

  db.prepare(
    `UPDATE transactions SET status = 'completed', transfer_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(req.params.id);

  db.prepare(
    `UPDATE transaction_progress SET status = 'completed', operator = ?, created_at = CURRENT_TIMESTAMP WHERE transaction_id = ? AND step IN ('property_transfer', 'delivery')`
  ).run(req.user!.username, req.params.id);

  db.prepare(
    `INSERT INTO regulatory_records (transaction_id, record_type, record_content, status, platform_ref_no)
     VALUES (?, 'transfer_done', '产权过户完成，网签备案成功', 'synced', ?)`
  ).run(req.params.id, 'BW' + Date.now());

  res.json({ message: '交易完成' });
});

export default router;
