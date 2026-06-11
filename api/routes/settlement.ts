import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = Router();

router.post('/bills/:id/pay', authMiddleware, roleMiddleware(['owner', 'fleet', 'operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as any;
  if (!bill) {
    return res.error('账单不存在', 404);
  }

  if (bill.status === 'paid') {
    return res.error('该账单已支付', 400);
  }

  db.prepare('UPDATE bills SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?').run('paid', id);

  res.success({ id, status: 'paid' }, '支付成功');
});

router.get('/fuel-cards', authMiddleware, (req: AuthRequest, res: Response) => {
  const { driverId, status, page = 1, pageSize = 10 } = req.query;

  let sql = `
    SELECT
      fc.*,
      d.name as driver_name,
      d.phone as driver_phone
    FROM fuel_cards fc
    LEFT JOIN drivers d ON fc.driver_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (driverId) {
    sql += ' AND fc.driver_id = ?';
    params.push(driverId);
  }
  if (status) {
    sql += ' AND fc.status = ?';
    params.push(status);
  }

  const countSql = sql.replace('SELECT fc.*, d.name as driver_name, d.phone as driver_phone', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY fc.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    cardNo: row.card_no,
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    balance: row.balance,
    status: row.status,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.get('/fuel-cards/:id/transactions', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, page = 1, pageSize = 10 } = req.query;

  const card = db.prepare('SELECT * FROM fuel_cards WHERE id = ?').get(id) as any;
  if (!card) {
    return res.error('油卡不存在', 404);
  }

  let sql = 'SELECT * FROM fuel_transactions WHERE card_id = ?';
  const params: any[] = [id];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    cardId: row.card_id,
    amount: row.amount,
    type: row.type,
    waybillId: row.waybill_id,
    stationName: row.station_name,
    timestamp: row.timestamp,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.post('/fuel-cards/:id/recharge', authMiddleware, roleMiddleware(['owner', 'fleet', 'operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.error('充值金额必须大于0', 400);
  }

  const card = db.prepare('SELECT * FROM fuel_cards WHERE id = ?').get(id) as any;
  if (!card) {
    return res.error('油卡不存在', 404);
  }

  if (card.status !== 'active') {
    return res.error('油卡状态异常，无法充值', 400);
  }

  const transactionId = uuidv4();

  const transaction = db.transaction(() => {
    db.prepare('UPDATE fuel_cards SET balance = balance + ? WHERE id = ?').run(amount, id);

    db.prepare(`
      INSERT INTO fuel_transactions (id, card_id, amount, type)
      VALUES (?, ?, ?, 'recharge')
    `).run(transactionId, id, amount);
  });

  transaction();

  res.success({
    id: transactionId,
    cardId: id,
    amount,
    type: 'recharge',
  }, '充值成功');
});

router.post('/fuel-cards/:id/consume', authMiddleware, roleMiddleware(['driver', 'owner', 'fleet', 'operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, waybillId, stationName } = req.body;

  if (!amount || amount <= 0) {
    return res.error('消费金额必须大于0', 400);
  }

  const card = db.prepare('SELECT * FROM fuel_cards WHERE id = ?').get(id) as any;
  if (!card) {
    return res.error('油卡不存在', 404);
  }

  if (card.status !== 'active') {
    return res.error('油卡状态异常，无法使用', 400);
  }

  if (card.balance < amount) {
    return res.error('油卡余额不足', 400);
  }

  if (req.user?.role === 'driver') {
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(req.user.id) as any;
    if (!driver || driver.id !== card.driver_id) {
      return res.error('无权限使用该油卡', 403);
    }
  }

  const transactionId = uuidv4();

  const transaction = db.transaction(() => {
    db.prepare('UPDATE fuel_cards SET balance = balance - ? WHERE id = ?').run(amount, id);

    db.prepare(`
      INSERT INTO fuel_transactions (id, card_id, amount, type, waybill_id, station_name)
      VALUES (?, ?, ?, 'consume', ?, ?)
    `).run(transactionId, id, amount, waybillId || null, stationName || null);
  });

  transaction();

  res.success({
    id: transactionId,
    cardId: id,
    amount,
    type: 'consume',
    remainingBalance: card.balance - amount,
  }, '核销成功');
});

export default router;
