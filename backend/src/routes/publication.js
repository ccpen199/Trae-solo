const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/ranking', (req, res) => {
  const { period = 'month', limit = 20 } = req.query;

  let dateCondition = '';
  const params = [];

  if (period === 'week') {
    dateCondition = "AND t.created_at >= datetime('now', '-7 days')";
  } else if (period === 'month') {
    dateCondition = "AND t.created_at >= datetime('now', '-30 days')";
  } else if (period === 'year') {
    dateCondition = "AND t.created_at >= datetime('now', '-365 days')";
  }

  const ranking = db.prepare(`
    SELECT r.id, r.name, r.building, r.unit, r.room_number,
           r.is_party_member, r.is_volunteer,
           COALESCE(SUM(CASE WHEN t.type = 'earn' THEN t.points ELSE 0 END), 0) as earned_points,
           pa.total_points, pa.available_points
    FROM residents r
    JOIN point_accounts pa ON r.id = pa.resident_id
    LEFT JOIN point_transactions t ON r.id = t.resident_id ${dateCondition}
    WHERE r.status = 1
    GROUP BY r.id
    ORDER BY earned_points DESC
    LIMIT ?
  `).all(parseInt(limit), ...params);

  res.json(ranking);
});

router.get('/appeals', (req, res) => {
  const { page = 1, pageSize = 20, resident_id, status } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT a.*, r.name as resident_name, r.phone as resident_phone
    FROM appeals a
    JOIN residents r ON a.resident_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (resident_id) {
    sql += ' AND a.resident_id = ?';
    params.push(resident_id);
  }

  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const appeals = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM appeals WHERE 1=1';
  const countParams = [];
  if (resident_id) {
    countSql += ' AND resident_id = ?';
    countParams.push(resident_id);
  }
  if (status) {
    countSql += ' AND status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ data: appeals, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/appeals', (req, res) => {
  const { resident_id, transaction_id, type, title, content } = req.body;

  if (!resident_id || !type || !title || !content) {
    return res.status(400).json({ error: '参数不完整' });
  }

  const result = db.prepare(`
    INSERT INTO appeals (resident_id, transaction_id, type, title, content, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(resident_id, transaction_id || null, type, title, content);

  const appeal = db.prepare(`
    SELECT a.*, r.name as resident_name
    FROM appeals a
    JOIN residents r ON a.resident_id = r.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.json(appeal);
});

router.post('/appeals/:id/handle', (req, res) => {
  const { status, handle_result, handler } = req.body;

  const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(req.params.id);
  if (!appeal) {
    return res.status(404).json({ error: '申诉不存在' });
  }

  db.prepare(`
    UPDATE appeals
    SET status = ?, handle_result = ?, handler = ?, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status || 'resolved', handle_result || null, handler || 'admin', req.params.id);

  const updated = db.prepare(`
    SELECT a.*, r.name as resident_name
    FROM appeals a
    JOIN residents r ON a.resident_id = r.id
    WHERE a.id = ?
  `).get(req.params.id);

  res.json(updated);
});

router.post('/points/revoke', (req, res) => {
  const { transaction_id, reason, operator } = req.body;

  const transaction = db.prepare('SELECT * FROM point_transactions WHERE id = ?').get(transaction_id);
  if (!transaction) {
    return res.status(404).json({ error: '交易记录不存在' });
  }

  if (transaction.is_revoked) {
    return res.status(400).json({ error: '该交易已撤销' });
  }

  const account = db.prepare('SELECT * FROM point_accounts WHERE resident_id = ?').get(transaction.resident_id);
  if (!account) {
    return res.status(404).json({ error: '积分账户不存在' });
  }

  const transaction2 = db.transaction(() => {
    const newBalance = account.available_points - transaction.points;

    db.prepare(`
      UPDATE point_accounts
      SET total_points = total_points - ?,
          available_points = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE resident_id = ?
    `).run(transaction.points > 0 ? transaction.points : 0, newBalance, transaction.resident_id);

    db.prepare(`
      UPDATE point_transactions
      SET is_revoked = 1, revoked_by = ?, revoke_reason = ?, revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operator || 'admin', reason || '撤销积分', transaction_id);

    db.prepare(`
      INSERT INTO point_transactions (resident_id, account_id, type, points, balance_before, balance_after, reason, source_type, source_id, operator)
      VALUES (?, ?, 'revoke', -?, ?, ?, ?, 'revoke', ?, ?)
    `).run(transaction.resident_id, account.id, transaction.points, account.available_points, newBalance, `撤销积分: ${transaction.reason}`, transaction_id, operator || 'admin');
  });

  transaction2();

  res.json({ success: true });
});

router.get('/publications', (req, res) => {
  const { type, limit = 10 } = req.query;

  let sql = 'SELECT * FROM point_publications WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(parseInt(limit));

  const publications = db.prepare(sql).all(...params);
  res.json(publications.map(p => ({ ...p, data: JSON.parse(p.data) })));
});

router.post('/publications', (req, res) => {
  const { period, type, data, published_by } = req.body;

  const result = db.prepare(`
    INSERT INTO point_publications (period, type, data, published_by)
    VALUES (?, ?, ?, ?)
  `).run(period, type, JSON.stringify(data), published_by || 'admin');

  res.json({ success: true, id: result.lastInsertRowid });
});

router.get('/stats', (req, res) => {
  const residentCount = db.prepare('SELECT COUNT(*) as count FROM residents WHERE status = 1').get().count;
  const totalPoints = db.prepare('SELECT SUM(total_points) as sum FROM point_accounts').get().sum || 0;
  const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get().count;
  const exchangeCount = db.prepare('SELECT COUNT(*) as count FROM exchanges').get().count;
  const pendingAppeals = db.prepare("SELECT COUNT(*) as count FROM appeals WHERE status = 'pending'").get().count;

  res.json({
    residentCount,
    totalPoints,
    activityCount,
    exchangeCount,
    pendingAppeals
  });
});

module.exports = router;
