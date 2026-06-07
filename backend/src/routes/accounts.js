import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || '';
    const userId = req.query.userId || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }
    if (userId) {
      where += ' AND a.user_id = ?';
      params.push(userId);
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM etc_accounts a ${where}`).get(...params).count;
    const list = db.prepare(`
      SELECT a.*, u.username, u.real_name, o.device_sn
      FROM etc_accounts a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN obu_devices o ON a.obu_id = o.id
      ${where}
      ORDER BY a.id DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ list, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const account = db.prepare(`
      SELECT a.*, u.username, u.real_name, u.phone, o.device_sn, o.model, o.activation_status
      FROM etc_accounts a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN obu_devices o ON a.obu_id = o.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { account_no, user_id, obu_id, card_no, balance } = req.body;

    if (!account_no || !user_id) {
      return res.status(400).json({ error: '账户号和用户ID不能为空' });
    }

    const existing = db.prepare('SELECT id FROM etc_accounts WHERE account_no = ?').get(account_no);
    if (existing) {
      return res.status(409).json({ error: '账户号已存在' });
    }

    const result = db.prepare(`
      INSERT INTO etc_accounts (account_no, user_id, obu_id, card_no, balance)
      VALUES (?, ?, ?, ?, ?)
    `).run(account_no, user_id, obu_id || null, card_no || null, balance || 0);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_account', 'etc_account', result.lastInsertRowid, JSON.stringify({ account_no, user_id }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '账户创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const { obu_id, card_no, status } = req.body;
    db.prepare(`
      UPDATE etc_accounts SET obu_id = ?, card_no = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      obu_id !== undefined ? obu_id : account.obu_id,
      card_no !== undefined ? card_no : account.card_no,
      status !== undefined ? status : account.status,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_account', 'etc_account', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '账户更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/recharge', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '充值金额必须大于0' });
    }

    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }
    if (account.status !== 'normal') {
      return res.status(400).json({ error: '账户状态异常，无法充值' });
    }

    db.prepare('UPDATE etc_accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(amount, req.params.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'recharge', 'etc_account', parseInt(req.params.id), JSON.stringify({ amount, old_balance: account.balance }), req.ip);

    const updated = db.prepare('SELECT balance FROM etc_accounts WHERE id = ?').get(req.params.id);
    res.json({ message: '充值成功', balance: updated.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/freeze', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const newStatus = account.status === 'normal' ? 'frozen' : 'normal';
    db.prepare('UPDATE etc_accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, req.params.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'freeze_account', 'etc_account', parseInt(req.params.id), JSON.stringify({ old_status: account.status, new_status: newStatus }), req.ip);

    res.json({ message: newStatus === 'frozen' ? '账户已冻结' : '账户已解冻', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/statement', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: '请提供年份和月份' });
    }

    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const records = db.prepare(`
      SELECT * FROM toll_records
      WHERE account_id = ? AND exit_time >= ? AND exit_time <= ?
      ORDER BY exit_time ASC
    `).all(req.params.id, startDate, endDate);

    const totalFee = records.reduce((sum, r) => sum + r.fee, 0);
    const count = records.length;

    res.json({
      account_no: account.account_no,
      balance: account.balance,
      period: `${year}-${String(month).padStart(2, '0')}`,
      total_fee: totalFee,
      record_count: count,
      records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
