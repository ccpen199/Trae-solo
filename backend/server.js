import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 53413;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43413}`,
  credentials: true
}));
app.use(express.json());

const log = db.prepare('INSERT INTO admin_ops (operator, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  const totalSessions = db.prepare('SELECT COUNT(*) as cnt FROM live_sessions').get().cnt;
  const ongoingSessions = db.prepare("SELECT COUNT(*) as cnt FROM live_sessions WHERE status = 'ongoing'").get().cnt;
  const totalTxs = db.prepare('SELECT COUNT(*) as cnt FROM gift_transactions').get().cnt;
  const totalIncome = db.prepare('SELECT COALESCE(SUM(coin_amount),0) as total FROM gift_transactions WHERE status = ?').get('received').total;
  const frozen = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM frozen_funds WHERE status = 'frozen'").get().total;
  const penalties = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM penalty_records').get().total;
  const pendingRisk = db.prepare("SELECT COUNT(*) as cnt FROM risk_records WHERE status IN ('pending','investigating','monitoring')").get().cnt;
  res.json({ totalSessions, ongoingSessions, totalTxs, totalIncome, frozen, penalties, pendingRisk });
});

app.get('/api/streamers', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, u.name as union_name
    FROM streamers s LEFT JOIN unions u ON s.union_id = u.id
    ORDER BY s.id
  `).all();
  res.json(rows);
});

app.post('/api/streamers', (req, res) => {
  const { name, union_id, account, phone } = req.body;
  const info = db.prepare('INSERT INTO streamers (name, union_id, account, phone) VALUES (?, ?, ?, ?)').run(name, union_id || null, account, phone || null);
  log.run('admin', 'create_streamer', 'streamer', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/streamers/:id', (req, res) => {
  const { name, union_id, phone, status } = req.body;
  db.prepare('UPDATE streamers SET name=?, union_id=?, phone=?, status=? WHERE id=?').run(name, union_id || null, phone || null, status, req.params.id);
  log.run('admin', 'update_streamer', 'streamer', req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.get('/api/unions', (req, res) => {
  res.json(db.prepare('SELECT * FROM unions ORDER BY id').all());
});

app.post('/api/unions', (req, res) => {
  const { name, contact, phone } = req.body;
  const info = db.prepare('INSERT INTO unions (name, contact, phone) VALUES (?, ?, ?)').run(name, contact || null, phone || null);
  log.run('admin', 'create_union', 'union', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/unions/:id', (req, res) => {
  const { name, contact, phone, status } = req.body;
  db.prepare('UPDATE unions SET name=?, contact=?, phone=?, status=? WHERE id=?').run(name, contact || null, phone || null, status, req.params.id);
  log.run('admin', 'update_union', 'union', req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.get('/api/users', (req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY id').all());
});

app.get('/api/gifts', (req, res) => {
  res.json(db.prepare('SELECT * FROM gifts ORDER BY coin_value').all());
});

app.post('/api/gifts', (req, res) => {
  const { name, coin_value, icon, category } = req.body;
  const info = db.prepare('INSERT INTO gifts (name, coin_value, icon, category) VALUES (?, ?, ?, ?)').run(name, coin_value, icon || null, category || null);
  res.json({ id: info.lastInsertRowid });
});

app.get('/api/rooms', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, s.name as streamer_name
    FROM rooms r LEFT JOIN streamers s ON r.streamer_id = s.id
    ORDER BY r.id
  `).all();
  res.json(rows);
});

app.get('/api/live-sessions', (req, res) => {
  const { status, streamer_id } = req.query;
  let sql = `
    SELECT ls.*, s.name as streamer_name, r.name as room_name, u.name as union_name
    FROM live_sessions ls
    LEFT JOIN streamers s ON ls.streamer_id = s.id
    LEFT JOIN rooms r ON ls.room_id = r.id
    LEFT JOIN unions u ON s.union_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND ls.status = ?'; params.push(status); }
  if (streamer_id) { sql += ' AND ls.streamer_id = ?'; params.push(streamer_id); }
  sql += ' ORDER BY ls.id DESC';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/live-sessions/:id', (req, res) => {
  const row = db.prepare(`
    SELECT ls.*, s.name as streamer_name, r.name as room_name
    FROM live_sessions ls
    LEFT JOIN streamers s ON ls.streamer_id = s.id
    LEFT JOIN rooms r ON ls.room_id = r.id
    WHERE ls.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/live-sessions', (req, res) => {
  const { streamer_id, room_id, start_time } = req.body;
  const info = db.prepare('INSERT INTO live_sessions (streamer_id, room_id, start_time) VALUES (?, ?, ?)').run(streamer_id, room_id, start_time);
  db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run('live', room_id);
  log.run('admin', 'start_session', 'session', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/live-sessions/:id/end', (req, res) => {
  const { end_time } = req.body;
  const session = db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  const txSum = db.prepare('SELECT COALESCE(SUM(coin_amount),0) as total FROM gift_transactions WHERE session_id = ? AND status = ?').get(req.params.id, 'received').total;
  db.prepare('UPDATE live_sessions SET end_time=?, gift_coin_income=?, status=? WHERE id=?').run(end_time, txSum, 'ended', req.params.id);
  db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run('offline', session.room_id);
  log.run('admin', 'end_session', 'session', req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.put('/api/live-sessions/:id/flag', (req, res) => {
  const { exception_reason } = req.body;
  db.prepare('UPDATE live_sessions SET exception_flag=1, exception_reason=? WHERE id=?').run(exception_reason || '', req.params.id);
  log.run('admin', 'flag_session', 'session', req.params.id, exception_reason || '');
  res.json({ ok: true });
});

app.get('/api/gift-transactions', (req, res) => {
  const { status, session_id, user_id, order_no } = req.query;
  let sql = `
    SELECT gt.*, u.nickname as user_name, g.name as gift_name, g.icon as gift_icon,
      s.name as streamer_name, ls.start_time as session_time
    FROM gift_transactions gt
    LEFT JOIN users u ON gt.user_id = u.id
    LEFT JOIN gifts g ON gt.gift_id = g.id
    LEFT JOIN live_sessions ls ON gt.session_id = ls.id
    LEFT JOIN streamers s ON ls.streamer_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND gt.status = ?'; params.push(status); }
  if (session_id) { sql += ' AND gt.session_id = ?'; params.push(session_id); }
  if (user_id) { sql += ' AND gt.user_id = ?'; params.push(user_id); }
  if (order_no) { sql += ' AND gt.order_no LIKE ?'; params.push(`%${order_no}%`); }
  sql += ' ORDER BY gt.id DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/gift-transactions/:id', (req, res) => {
  const row = db.prepare(`
    SELECT gt.*, u.nickname as user_name, g.name as gift_name, g.icon as gift_icon,
      s.name as streamer_name, ls.start_time as session_time
    FROM gift_transactions gt
    LEFT JOIN users u ON gt.user_id = u.id
    LEFT JOIN gifts g ON gt.gift_id = g.id
    LEFT JOIN live_sessions ls ON gt.session_id = ls.id
    LEFT JOIN streamers s ON ls.streamer_id = s.id
    WHERE gt.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/gift-transactions', (req, res) => {
  const { user_id, gift_id, quantity, payment_channel, session_id } = req.body;
  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(gift_id);
  if (!gift) return res.status(400).json({ error: 'Gift not found' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const coin_amount = gift.coin_value * quantity;
  if (user.balance < coin_amount) return res.status(400).json({ error: 'Insufficient balance' });
  const orderNo = 'TX' + Date.now() + Math.floor(Math.random() * 1000);
  const info = db.prepare(`
    INSERT INTO gift_transactions (order_no, user_id, gift_id, quantity, coin_amount, payment_channel, session_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'received')
  `).run(orderNo, user_id, gift_id, quantity, coin_amount, payment_channel || 'balance', session_id || null);
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(coin_amount, user_id);
  if (session_id) {
    db.prepare('UPDATE live_sessions SET gift_coin_income = gift_coin_income + ? WHERE id = ?').run(coin_amount, session_id);
  }
  res.json({ id: info.lastInsertRowid, order_no: orderNo });
});

app.put('/api/gift-transactions/:id/refund', (req, res) => {
  const tx = db.prepare('SELECT * FROM gift_transactions WHERE id = ?').get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  if (tx.refunded) return res.status(400).json({ error: 'Already refunded' });
  db.prepare('UPDATE gift_transactions SET refunded=1, status=? WHERE id=?').run('refunded', req.params.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(tx.coin_amount, tx.user_id);
  if (tx.session_id) {
    db.prepare('UPDATE live_sessions SET refund_amount = refund_amount + ?, gift_coin_income = gift_coin_income - ? WHERE id = ?').run(tx.coin_amount, tx.coin_amount, tx.session_id);
  }
  log.run('finance', 'refund_tx', 'transaction', req.params.id, JSON.stringify({ amount: tx.coin_amount }));
  res.json({ ok: true });
});

app.get('/api/sharing-rules', (req, res) => {
  const rows = db.prepare('SELECT * FROM sharing_rules ORDER BY version DESC').all();
  res.json(rows.map(r => ({
    ...r,
    streamer_rate: Math.round(r.streamer_ratio * 100),
    union_rate: Math.round(r.union_ratio * 100),
    platform_rate: Math.round(r.platform_ratio * 100),
    activity_rate: Math.round(r.activity_ratio * 100),
    tax_rate: Math.round(r.tax_ratio * 100),
    status: r.is_active ? 'active' : 'archived',
    effective_date: r.effective_from,
    created_by: '管理员',
  })));
});

app.post('/api/sharing-rules', (req, res) => {
  const { name, description, streamer_rate, union_rate, platform_rate, activity_rate, tax_rate, effective_date } = req.body;
  const maxVersion = db.prepare('SELECT MAX(version) as v FROM sharing_rules').get().v || 0;
  db.prepare('UPDATE sharing_rules SET is_active = 0 WHERE is_active = 1').run();
  const info = db.prepare(`
    INSERT INTO sharing_rules (version, name, description, streamer_ratio, union_ratio, platform_ratio, activity_ratio, tax_ratio, effective_from, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(maxVersion + 1, name, description || '', streamer_rate / 100, union_rate / 100, platform_rate / 100, (activity_rate || 0) / 100, tax_rate / 100, effective_date);
  log.run('admin', 'create_rule', 'sharing_rule', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid, version: maxVersion + 1 });
});

app.get('/api/sharing-rules/active', (req, res) => {
  const rule = db.prepare('SELECT * FROM sharing_rules WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get();
  res.json(rule || null);
});

app.put('/api/sharing-rules/:id', (req, res) => {
  const { status } = req.body;
  if (status === 'active') {
    db.prepare('UPDATE sharing_rules SET is_active = 0 WHERE is_active = 1').run();
    db.prepare('UPDATE sharing_rules SET is_active = 1 WHERE id = ?').run(req.params.id);
    log.run('admin', 'activate_rule', 'sharing_rule', req.params.id, 'activated');
  } else if (status === 'archived') {
    db.prepare('UPDATE sharing_rules SET is_active = 0 WHERE id = ?').run(req.params.id);
    log.run('admin', 'archive_rule', 'sharing_rule', req.params.id, 'archived');
  }
  res.json({ ok: true });
});

app.get('/api/risk-records', (req, res) => {
  const { status, type } = req.query;
  let sql = 'SELECT * FROM risk_records WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({
    ...r,
    risk_type: r.type,
    risk_amount: r.amount,
    description: r.reason,
    action: null,
    resolved_by: null,
    resolution_note: null,
    session_id: r.transaction_id,
  })));
});

app.post('/api/risk-records', (req, res) => {
  const { risk_type, target_type, target_id, risk_amount, description, session_id } = req.body;
  const info = db.prepare(`
    INSERT INTO risk_records (type, target_type, target_id, transaction_id, amount, reason, status, operator)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', '风控员')
  `).run(risk_type, target_type, target_id, session_id || null, risk_amount || 0, description || '');
  log.run('风控员', 'create_risk', 'risk_record', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/risk-records/:id', (req, res) => {
  const { status, action, resolved_by, resolution_note } = req.body;
  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (action) { updates.push("operator = ?"); params.push(action); }
  if (updates.length > 0) {
    db.prepare(`UPDATE risk_records SET ${updates.join(', ')} WHERE id = ?`).run(...params, req.params.id);
  }
  log.run(resolved_by || 'admin', 'update_risk', 'risk_record', req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.get('/api/frozen-funds', (req, res) => {
  const rows = db.prepare(`
    SELECT ff.*, s.name as streamer_name, u.name as union_name, rr.type as risk_type, rr.reason as risk_reason
    FROM frozen_funds ff
    LEFT JOIN streamers s ON ff.streamer_id = s.id
    LEFT JOIN unions u ON ff.union_id = u.id
    LEFT JOIN risk_records rr ON ff.risk_record_id = rr.id
    ORDER BY ff.id DESC
  `).all();
  res.json(rows.map(r => ({
    ...r,
    target_type: r.streamer_id ? 'streamer' : r.union_id ? 'union' : 'unknown',
    target_id: r.streamer_id || r.union_id || 0,
    source_type: r.risk_record_id ? 'risk_record' : null,
    source_id: r.risk_record_id,
    operator: '风控员',
  })));
});

app.post('/api/frozen-funds', (req, res) => {
  const { target_type, target_id, amount, reason, source_type, source_id } = req.body;
  const streamer_id = target_type === 'streamer' ? target_id : null;
  const union_id = target_type === 'union' ? target_id : null;
  const risk_record_id = source_type === 'risk_record' ? source_id : null;
  const info = db.prepare(`
    INSERT INTO frozen_funds (streamer_id, union_id, risk_record_id, amount, reason, status)
    VALUES (?, ?, ?, ?, ?, 'frozen')
  `).run(streamer_id, union_id, risk_record_id || null, amount, reason || '');
  log.run('风控员', 'freeze', 'frozen_fund', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/frozen-funds/:id', (req, res) => {
  const { status, unfreeze_by, unfreeze_reason } = req.body;
  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (unfreeze_reason) { updates.push('unfreeze_reason = ?'); params.push(unfreeze_reason); }
  if (status && status !== 'frozen') { updates.push("unfrozen_at = datetime('now','localtime')"); }
  if (updates.length > 0) {
    db.prepare(`UPDATE frozen_funds SET ${updates.join(', ')} WHERE id = ?`).run(...params, req.params.id);
  }
  log.run(unfreeze_by || 'admin', status === 'unfrozen' ? 'unfreeze' : status === 'deducted' ? 'penalty' : 'update_frozen', 'frozen_fund', req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.get('/api/penalty-records', (req, res) => {
  const rows = db.prepare(`
    SELECT pr.*, s.name as streamer_name, u.name as union_name
    FROM penalty_records pr
    LEFT JOIN streamers s ON pr.streamer_id = s.id
    LEFT JOIN unions u ON pr.union_id = u.id
    ORDER BY pr.id DESC
  `).all();
  res.json(rows.map(r => ({
    ...r,
    target_type: r.streamer_id ? 'streamer' : r.union_id ? 'union' : 'unknown',
    target_id: r.streamer_id || r.union_id || 0,
    source_id: r.risk_record_id,
  })));
});

app.post('/api/penalty-records', (req, res) => {
  const { target_type, target_id, amount, reason, source_id } = req.body;
  const streamer_id = target_type === 'streamer' ? target_id : null;
  const union_id = target_type === 'union' ? target_id : null;
  const info = db.prepare(`
    INSERT INTO penalty_records (streamer_id, union_id, risk_record_id, amount, reason, operator)
    VALUES (?, ?, ?, ?, ?, '风控员')
  `).run(streamer_id, union_id, source_id || null, amount, reason || '');
  log.run('风控员', 'penalty', 'penalty_record', info.lastInsertRowid, JSON.stringify(req.body));
  res.json({ id: info.lastInsertRowid });
});

app.get('/api/settlements', (req, res) => {
  const { period, target_type, status } = req.query;
  let sql = `
    SELECT s.*,
      CASE WHEN s.target_type='streamer' THEN st.name ELSE u.name END as target_name
    FROM settlements s
    LEFT JOIN streamers st ON s.target_type='streamer' AND s.target_id = st.id
    LEFT JOIN unions u ON s.target_type='union' AND s.target_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (period) { sql += ' AND s.period = ?'; params.push(period); }
  if (target_type) { sql += ' AND s.target_type = ?'; params.push(target_type); }
  if (status) { sql += ' AND s.status = ?'; params.push(status); }
  sql += ' ORDER BY s.id DESC';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/settlements/export', (req, res) => {
  const { period, target_type } = req.query;
  let sql = `
    SELECT s.*,
      CASE WHEN s.target_type='streamer' THEN st.name ELSE u.name END as target_name,
      CASE WHEN s.target_type='streamer' THEN st.account ELSE '' END as target_account
    FROM settlements s
    LEFT JOIN streamers st ON s.target_type='streamer' AND s.target_id = st.id
    LEFT JOIN unions u ON s.target_type='union' AND s.target_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (period) { sql += ' AND s.period = ?'; params.push(period); }
  if (target_type) { sql += ' AND s.target_type = ?'; params.push(target_type); }
  sql += ' ORDER BY s.target_type, s.target_id';
  const rows = db.prepare(sql).all(...params);

  const statusMap = { pending: '待确认', confirmed: '已确认', paid: '已支付', rejected: '已驳回' };
  const headers = ['期间', '结算单号', '对象类型', '对象名称', '对象账号', '应结金额(币)', '冻结金额(币)', '扣罚金额(币)', '已付金额(币)', '净额(币)', '差异原因', '分账规则版本', '状态', '操作人', '创建时间'];
  const csvRows = [headers];
  for (const r of rows) {
    csvRows.push([
      r.period,
      r.id,
      r.target_type === 'streamer' ? '主播' : '工会',
      r.target_name || '',
      r.target_account || '',
      r.total_income,
      r.frozen_amount,
      r.penalty_amount,
      r.paid_amount,
      r.net_amount,
      r.difference_reason || '',
      r.sharing_rule_version || '',
      statusMap[r.status] || r.status,
      r.operator || '',
      r.created_at,
    ]);
  }
  const csv = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="settlements_${period || 'all'}.csv"`);
  res.send('\uFEFF' + csv);
});

app.get('/api/settlements/:id/export', (req, res) => {
  const s = db.prepare(`
    SELECT s.*,
      CASE WHEN s.target_type='streamer' THEN st.name ELSE u.name END as target_name,
      CASE WHEN s.target_type='streamer' THEN st.account ELSE '' END as target_account
    FROM settlements s
    LEFT JOIN streamers st ON s.target_type='streamer' AND s.target_id = st.id
    LEFT JOIN unions u ON s.target_type='union' AND s.target_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });

  const details = db.prepare(`
    SELECT sd.*, sd.rule_version as sharing_rule_version, gt.order_no, gt.user_id, gt.quantity, gt.coin_amount, gt.payment_channel,
      gt.status as tx_status, gt.refunded, gt.created_at as tx_time,
      u.nickname as user_name, g.name as gift_name, g.icon as gift_icon
    FROM settlement_details sd
    LEFT JOIN gift_transactions gt ON sd.transaction_id = gt.id
    LEFT JOIN users u ON gt.user_id = u.id
    LEFT JOIN gifts g ON gt.gift_id = g.id
    WHERE sd.settlement_id = ?
    ORDER BY sd.id
  `).all(req.params.id);

  const relatedFrozen = db.prepare(`
    SELECT ff.*, rr.type as risk_type, rr.reason as risk_reason
    FROM frozen_funds ff
    LEFT JOIN risk_records rr ON ff.risk_record_id = rr.id
    WHERE ff.streamer_id = ? OR ff.union_id = ?
    ORDER BY ff.id
  `).all(s.target_id, s.target_id);

  const relatedPenalties = db.prepare(`
    SELECT pr.*, rr.type as risk_type, rr.reason as risk_reason
    FROM penalty_records pr
    LEFT JOIN risk_records rr ON pr.risk_record_id = rr.id
    WHERE pr.streamer_id = ? OR pr.union_id = ?
    ORDER BY pr.id
  `).all(s.target_id, s.target_id);

  const statusMap = { pending: '待确认', confirmed: '已确认', paid: '已支付', rejected: '已驳回' };
  const csvRows = [];

  csvRows.push(['=== 结算单基本信息 ===']);
  csvRows.push(['期间', s.period]);
  csvRows.push(['结算单号', s.id]);
  csvRows.push(['对象类型', s.target_type === 'streamer' ? '主播' : '工会']);
  csvRows.push(['对象名称', s.target_name || '']);
  csvRows.push(['对象账号', s.target_account || '']);
  csvRows.push(['应结金额(币)', s.total_income]);
  csvRows.push(['冻结金额(币)', s.frozen_amount]);
  csvRows.push(['扣罚金额(币)', s.penalty_amount]);
  csvRows.push(['已付金额(币)', s.paid_amount]);
  csvRows.push(['净额(币)', s.net_amount]);
  csvRows.push(['差异原因', s.difference_reason || '']);
  csvRows.push(['分账规则版本', s.sharing_rule_version || '']);
  csvRows.push(['状态', statusMap[s.status] || s.status]);
  csvRows.push(['操作人', s.operator || '']);
  csvRows.push(['创建时间', s.created_at]);
  csvRows.push([]);

  csvRows.push(['=== 对账计算公式 ===']);
  csvRows.push(['净额 = 应结 - 冻结 - 扣罚 - 已付']);
  csvRows.push([`${s.net_amount} = ${s.total_income} - ${s.frozen_amount} - ${s.penalty_amount} - ${s.paid_amount}`]);
  csvRows.push([]);

  csvRows.push(['=== 账单明细(打赏流水) ===']);
  csvRows.push(['序号', '订单号', '用户', '礼物', '数量', '金币金额', '支付渠道', '分账金额', '分账版本', '交易状态', '是否退款', '交易时间']);
  details.forEach((d, i) => {
    csvRows.push([
      i + 1,
      d.order_no || '',
      d.user_name || '',
      (d.gift_icon || '') + (d.gift_name || ''),
      d.quantity || 0,
      d.coin_amount || 0,
      d.payment_channel || '',
      d.sharing_amount || 0,
      d.sharing_rule_version || '',
      d.tx_status || '',
      d.refunded ? '是' : '否',
      d.tx_time || '',
    ]);
  });
  csvRows.push([]);

  csvRows.push(['=== 关联冻结记录 ===']);
  csvRows.push(['序号', '冻结单号', '类型', '金额(币)', '原因', '状态', '创建时间', '关联风控类型', '关联风控原因']);
  relatedFrozen.forEach((f, i) => {
    csvRows.push([
      i + 1,
      f.id,
      f.type || '',
      f.amount || 0,
      f.reason || '',
      f.status || '',
      f.created_at || '',
      f.risk_type || '',
      f.risk_reason || '',
    ]);
  });
  csvRows.push([]);

  csvRows.push(['=== 关联扣罚记录 ===']);
  csvRows.push(['序号', '扣罚单号', '类型', '金额(币)', '原因', '状态', '创建时间', '关联风控类型', '关联风控原因']);
  relatedPenalties.forEach((p, i) => {
    csvRows.push([
      i + 1,
      p.id,
      p.type || '',
      p.amount || 0,
      p.reason || '',
      p.status || '',
      p.created_at || '',
      p.risk_type || '',
      p.risk_reason || '',
    ]);
  });

  const csv = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="settlement_${s.id}_${s.period}_detail.csv"`);
  res.send('\uFEFF' + csv);
});

app.get('/api/settlements/:id', (req, res) => {
  const s = db.prepare(`
    SELECT s.*,
      CASE WHEN s.target_type='streamer' THEN st.name ELSE u.name END as target_name,
      CASE WHEN s.target_type='streamer' THEN st.account ELSE '' END as target_account
    FROM settlements s
    LEFT JOIN streamers st ON s.target_type='streamer' AND s.target_id = st.id
    LEFT JOIN unions u ON s.target_type='union' AND s.target_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });

  const details = db.prepare(`
    SELECT sd.*, sd.rule_version as sharing_rule_version, gt.order_no, gt.user_id, gt.gift_id, gt.quantity, gt.coin_amount, gt.payment_channel,
      gt.session_id, gt.status as tx_status, gt.refunded, gt.created_at as tx_time,
      u.nickname as user_name, g.name as gift_name, g.icon as gift_icon,
      ls.streamer_id, ls.room_id, ls.start_time as session_time
    FROM settlement_details sd
    LEFT JOIN gift_transactions gt ON sd.transaction_id = gt.id
    LEFT JOIN users u ON gt.user_id = u.id
    LEFT JOIN gifts g ON gt.gift_id = g.id
    LEFT JOIN live_sessions ls ON gt.session_id = ls.id
    WHERE sd.settlement_id = ?
    ORDER BY sd.id DESC
  `).all(req.params.id);

  const rule = db.prepare('SELECT * FROM sharing_rules WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get();

  const relatedFrozen = db.prepare(`
    SELECT ff.*, rr.type as risk_type, rr.reason as risk_reason
    FROM frozen_funds ff
    LEFT JOIN risk_records rr ON ff.risk_record_id = rr.id
    WHERE (ff.streamer_id = ? OR ff.union_id = ?) AND ff.status = 'frozen'
    ORDER BY ff.id DESC
  `).all(s.target_id, s.target_id);

  const relatedPenalties = db.prepare(`
    SELECT pr.*, rr.type as risk_type, rr.reason as risk_reason
    FROM penalty_records pr
    LEFT JOIN risk_records rr ON pr.risk_record_id = rr.id
    WHERE pr.streamer_id = ? OR pr.union_id = ?
    ORDER BY pr.id DESC
  `).all(s.target_id, s.target_id);

  const relatedRisks = db.prepare(`
    SELECT * FROM risk_records
    WHERE target_type = ? AND target_id = ?
    ORDER BY id DESC
  `).all(s.target_type, s.target_id);

  const ops = db.prepare(`
    SELECT * FROM admin_ops
    WHERE target_type = 'settlement' AND target_id = ?
    ORDER BY id DESC
  `).all(req.params.id);

  res.json({
    settlement: s,
    details,
    sharing_rule: rule,
    related_frozen: relatedFrozen,
    related_penalties: relatedPenalties,
    related_risks: relatedRisks,
    operations: ops,
  });
});

app.put('/api/settlements/:id/difference', (req, res) => {
  const { difference_reason, operator } = req.body;
  db.prepare('UPDATE settlements SET difference_reason = ? WHERE id = ?').run(difference_reason || '', req.params.id);
  log.run(operator || 'finance', 'update_difference', 'settlement', req.params.id, difference_reason || '');
  res.json({ ok: true });
});

app.post('/api/settlements/generate', (req, res) => {
  const { period, target_type, target_id } = req.body;
  const rule = db.prepare('SELECT * FROM sharing_rules WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get();
  if (!rule) return res.status(400).json({ error: 'No active sharing rule' });

  let targetIds = [];
  if (target_id) {
    targetIds = [target_id];
  } else if (target_type === 'streamer') {
    targetIds = db.prepare('SELECT id FROM streamers').all().map(r => r.id);
  } else if (target_type === 'union') {
    targetIds = db.prepare('SELECT id FROM unions').all().map(r => r.id);
  }

  const results = [];
  const insertSettlement = db.prepare(`
    INSERT INTO settlements (period, target_type, target_id, total_income, frozen_amount, penalty_amount, paid_amount, net_amount, status, sharing_rule_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `);
  const insertDetail = db.prepare(`
    INSERT INTO settlement_details (settlement_id, transaction_id, session_id, coin_amount, sharing_amount, rule_version)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const tid of targetIds) {
    let transactions = [];
    if (target_type === 'streamer') {
      transactions = db.prepare(`
        SELECT gt.* FROM gift_transactions gt
        JOIN live_sessions ls ON gt.session_id = ls.id
        WHERE ls.streamer_id = ? AND gt.status = 'received' AND gt.refunded = 0
          AND gt.created_at >= ? AND gt.created_at <= ?
        ORDER BY gt.id DESC
      `).all(tid, period + '-01 00:00:00', period + '-31 23:59:59');
    } else if (target_type === 'union') {
      transactions = db.prepare(`
        SELECT gt.* FROM gift_transactions gt
        JOIN live_sessions ls ON gt.session_id = ls.id
        JOIN streamers s ON ls.streamer_id = s.id
        WHERE s.union_id = ? AND gt.status = 'received' AND gt.refunded = 0
          AND gt.created_at >= ? AND gt.created_at <= ?
        ORDER BY gt.id DESC
      `).all(tid, period + '-01 00:00:00', period + '-31 23:59:59');
    }

    const totalCoin = transactions.reduce((s, t) => s + (t.coin_amount || 0), 0);
    const ratio = target_type === 'streamer' ? rule.streamer_ratio : rule.union_ratio;
    const totalIncome = Math.floor(totalCoin * ratio);
    const frozenAmount = target_type === 'streamer'
      ? db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM frozen_funds WHERE streamer_id=? AND status='frozen'").get(tid).total
      : db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM frozen_funds WHERE union_id=? AND status='frozen'").get(tid).total;
    const penaltyAmount = target_type === 'streamer'
      ? db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM penalty_records WHERE streamer_id=?').get(tid).total
      : db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM penalty_records WHERE union_id=?').get(tid).total;

    const netAmount = totalIncome - frozenAmount - penaltyAmount;

    const info = insertSettlement.run(period, target_type, tid, totalIncome, frozenAmount, penaltyAmount, 0, netAmount, rule.version);
    const settlementId = info.lastInsertRowid;

    for (const tx of transactions) {
      const sharingAmount = Math.floor(tx.coin_amount * ratio);
      insertDetail.run(settlementId, tx.id, tx.session_id, tx.coin_amount, sharingAmount, String(rule.version));
    }

    results.push({ id: settlementId, target_id: tid, total_income: totalIncome, net_amount: netAmount, tx_count: transactions.length });
  }

  log.run('finance', 'generate_settlements', 'settlement', null, JSON.stringify({ period, target_type, count: results.length }));
  res.json({ count: results.length, results });
});

app.put('/api/settlements/:id/confirm', (req, res) => {
  const { operator } = req.body;
  db.prepare('UPDATE settlements SET status=?, operator=? WHERE id=?').run('confirmed', operator || 'finance', req.params.id);
  log.run(operator || 'finance', 'confirm_settlement', 'settlement', req.params.id, '');
  res.json({ ok: true });
});

app.put('/api/settlements/:id/pay', (req, res) => {
  const { paid_amount, operator } = req.body;
  const s = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const newPaid = (s.paid_amount || 0) + (paid_amount || s.net_amount);
  db.prepare('UPDATE settlements SET paid_amount=?, status=? WHERE id=?').run(newPaid, 'paid', req.params.id);
  log.run(operator || 'finance', 'pay_settlement', 'settlement', req.params.id, JSON.stringify({ paid: paid_amount || s.net_amount }));
  res.json({ ok: true });
});

app.get('/api/complaints', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, u.nickname as user_name, s.name as streamer_name
    FROM complaints c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN streamers s ON c.streamer_id = s.id
    ORDER BY c.id DESC
  `).all();
  res.json(rows);
});

app.post('/api/complaints', (req, res) => {
  const { user_id, streamer_id, session_id, type, content } = req.body;
  const info = db.prepare('INSERT INTO complaints (user_id, streamer_id, session_id, type, content) VALUES (?, ?, ?, ?, ?)').run(user_id || null, streamer_id || null, session_id || null, type || 'general', content || '');
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/complaints/:id', (req, res) => {
  const { status, handler } = req.body;
  db.prepare('UPDATE complaints SET status=?, handler=? WHERE id=?').run(status, handler || 'admin', req.params.id);
  log.run(handler || 'admin', 'handle_complaint', 'complaint', req.params.id, status);
  res.json({ ok: true });
});

app.get('/api/admin-ops', (req, res) => {
  const { target_type, target_id } = req.query;
  let sql = 'SELECT * FROM admin_ops WHERE 1=1';
  const params = [];
  if (target_type) { sql += ' AND target_type = ?'; params.push(target_type); }
  if (target_id) { sql += ' AND target_id = ?'; params.push(target_id); }
  sql += ' ORDER BY id DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({ ...r, description: r.detail })));
});

app.get('/api/payment-channels', (req, res) => {
  res.json(db.prepare('SELECT * FROM payment_channels').all());
});

app.get('/api/sessions/:id/transactions', (req, res) => {
  const rows = db.prepare(`
    SELECT gt.*, u.nickname as user_name, g.name as gift_name, g.icon as gift_icon
    FROM gift_transactions gt
    LEFT JOIN users u ON gt.user_id = u.id
    LEFT JOIN gifts g ON gt.gift_id = g.id
    WHERE gt.session_id = ?
    ORDER BY gt.id DESC
  `).all(req.params.id);
  res.json(rows);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
