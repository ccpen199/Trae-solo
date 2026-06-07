import { Router } from 'express';
import { getDb } from '../db/index.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = 'WHERE s.rider_id = ?';
    const params = [req.rider.id];

    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM settlements s ${whereClause}`).get(...params).cnt;
    const settlements = db.prepare(`
      SELECT s.*, o.order_no FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      ${whereClause} ORDER BY s.id DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: settlements, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/balance', auth, (req, res) => {
  try {
    const db = getDb();
    const rider = db.prepare('SELECT balance, frozen_balance FROM riders WHERE id = ?').get(req.rider.id);
    res.json({ code: 0, data: rider, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/withdraw', auth, (req, res) => {
  try {
    const { amount, bank_account, bank_name } = req.body;
    if (!amount || !bank_account || !bank_name) {
      return res.json({ code: 1, message: '缺少必要字段' });
    }

    const db = getDb();
    const rider = db.prepare('SELECT balance, frozen_balance FROM riders WHERE id = ?').get(req.rider.id);

    if (amount > rider.balance) {
      return res.json({ code: 1, message: '余额不足' });
    }

    const now = new Date().toISOString();

    const withdrawTx = db.transaction(() => {
      db.prepare('UPDATE riders SET balance = balance - ?, frozen_balance = frozen_balance + ?, updated_at = ? WHERE id = ?')
        .run(amount, amount, now, req.rider.id);

      db.prepare('INSERT INTO withdrawals (rider_id, amount, status, bank_account, bank_name, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.rider.id, amount, 'pending', bank_account, bank_name, now);
    });

    withdrawTx();
    res.json({ code: 0, data: null, message: '提现申请已提交' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/withdrawals', auth, (req, res) => {
  try {
    const db = getDb();
    const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE rider_id = ? ORDER BY id DESC').all(req.rider.id);
    res.json({ code: 0, data: withdrawals, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/detail/:orderId', auth, (req, res) => {
  try {
    const db = getDb();
    const settlement = db.prepare(`
      SELECT s.*, o.order_no FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      WHERE s.order_id = ?
    `).get(req.params.orderId);
    if (!settlement) {
      return res.json({ code: 1, message: '结算记录不存在' });
    }
    res.json({ code: 0, data: settlement, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/admin/list', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const total = db.prepare('SELECT COUNT(*) as cnt FROM settlements').get().cnt;
    const settlements = db.prepare(`
      SELECT s.*, o.order_no, r.name as rider_name FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN riders r ON s.rider_id = r.id
      ORDER BY s.id DESC LIMIT ? OFFSET ?
    `).all(parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: settlements, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/admin/withdrawals/:id', auth, adminOnly, (req, res) => {
  try {
    const { status: actionStatus } = req.body;
    if (!['approved', 'rejected'].includes(actionStatus)) {
      return res.json({ code: 1, message: '无效的操作' });
    }

    const db = getDb();
    const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(req.params.id);
    if (!withdrawal) {
      return res.json({ code: 1, message: '提现记录不存在' });
    }

    const now = new Date().toISOString();

    const processTx = db.transaction(() => {
      if (actionStatus === 'approved') {
        db.prepare('UPDATE riders SET frozen_balance = frozen_balance - ?, updated_at = ? WHERE id = ?')
          .run(withdrawal.amount, now, withdrawal.rider_id);
      } else {
        db.prepare('UPDATE riders SET balance = balance + ?, frozen_balance = frozen_balance - ?, updated_at = ? WHERE id = ?')
          .run(withdrawal.amount, withdrawal.amount, now, withdrawal.rider_id);
      }

      db.prepare('UPDATE withdrawals SET status = ?, completed_at = ? WHERE id = ?')
        .run(actionStatus === 'approved' ? 'completed' : 'rejected', now, req.params.id);
    });

    processTx();
    res.json({ code: 0, data: null, message: actionStatus === 'approved' ? '提现已批准' : '提现已驳回' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

export default router;
