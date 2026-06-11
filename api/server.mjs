import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb, initDatabase } from './database.mjs';

initDatabase();

const app = express();
app.use(cors({ origin: [/^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/localhost:\d+$/] }));
app.use(express.json({ limit: '2mb' }));

function rows(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

function row(sql, params = []) {
  return getDb().prepare(sql).get(...params);
}

function parseAccount(account) {
  return account ? {
    ...account,
    equipment_snapshot: JSON.parse(account.equipment_snapshot || '[]'),
  } : account;
}

function publicUser(user) {
  return user ? {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
    status: user.status,
  } : null;
}

function makeToken(user) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    issuedAt: Date.now(),
  })).toString('base64url');
}

function userFromToken(req) {
  const raw = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!raw) return null;
  try {
    const token = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    const user = row('SELECT * FROM users WHERE id = ? AND status = ?', [token.id, 'active']);
    return publicUser(user);
  } catch {
    return null;
  }
}

function logAuth(username, action, result) {
  getDb().prepare('INSERT INTO auth_events (username, action, result) VALUES (?, ?, ?)').run(username, action, result);
}

app.get('/api/health', (req, res) => {
  const stats = row(`
    SELECT
      (SELECT COUNT(*) FROM accounts) as accounts,
      (SELECT COUNT(*) FROM transactions) as transactions,
      (SELECT COUNT(*) FROM risk_alerts) as riskAlerts
  `);
  res.json({
    success: true,
    message: 'ok',
    project: 'may-89123',
    database: 'sqlite',
    stats,
  });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const user = row('SELECT * FROM users WHERE username = ?', [username]);

  if (!user || user.password !== password || user.status !== 'active') {
    logAuth(username || 'anonymous', 'login', 'failed');
    res.status(401).json({ success: false, error: '账号或密码错误' });
    return;
  }

  logAuth(username, 'login', 'success');
  res.json({ success: true, data: { token: makeToken(user), user: publicUser(user) } });
});

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '').trim();
  const displayName = String(req.body?.displayName || username || '新用户').trim();

  if (!username || password.length < 6) {
    res.status(400).json({ success: false, error: '用户名不能为空，密码至少 6 位' });
    return;
  }

  const exists = row('SELECT id FROM users WHERE username = ?', [username]);
  if (exists) {
    res.status(409).json({ success: false, error: '账号已存在' });
    return;
  }

  const id = `user-${Date.now()}`;
  getDb().prepare(`
    INSERT INTO users (id, username, password, role, display_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, username, password, 'buyer', displayName, 'active', new Date().toISOString());
  const user = row('SELECT * FROM users WHERE id = ?', [id]);
  logAuth(username, 'register', 'success');
  res.json({ success: true, data: { token: makeToken(user), user: publicUser(user) } });
});

app.get('/api/auth/me', (req, res) => {
  const user = userFromToken(req);
  if (!user) {
    res.json({ success: false, authenticated: false, error: '未登录', data: null });
    return;
  }
  res.json({ success: true, data: user });
});

app.get(['/api/user/profile', '/api/users/profile'], (req, res) => {
  const user = userFromToken(req) || {
    id: 'guest',
    username: 'guest',
    role: 'buyer',
    displayName: '游客用户',
    status: 'anonymous',
  };
  res.json({
    success: true,
    data: {
      ...user,
      profileSections: ['个人中心', '我的订单', '账号安全'],
    },
  });
});

app.get(['/api/admin/summary', '/api/admin/stats', '/api/admin/dashboard'], (req, res) => {
  const summary = row(`
    SELECT
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM auth_events) as authEvents,
      (SELECT COUNT(*) FROM risk_alerts WHERE severity IN ('high', 'critical')) as highRiskAlerts,
      COALESCE((SELECT SUM(amount) FROM transactions), 0) as grossMerchandiseValue
  `);
  const authEvents = rows('SELECT * FROM auth_events ORDER BY id DESC LIMIT 12');
  res.json({ success: true, data: { summary, authEvents } });
});

app.get('/api/products', (req, res) => {
  const products = rows(`
    SELECT id, game_name as name, game_uid, server, region, level, price, rent_daily, status, valuation
    FROM accounts
    ORDER BY created_at DESC
  `).map(parseAccount);
  res.json({ success: true, data: { items: products, total: products.length } });
});

app.get('/api/orders', (req, res) => {
  const orders = rows(`
    SELECT t.*, a.game_name, a.game_uid
    FROM transactions t
    LEFT JOIN accounts a ON a.id = t.account_id
    ORDER BY t.created_at DESC
  `);
  res.json({ success: true, data: { items: orders, total: orders.length } });
});

app.get('/api/cart', (req, res) => {
  const items = rows(`
    SELECT id, game_name as name, price, rent_daily, status
    FROM accounts
    WHERE status IN ('available', 'selling')
    ORDER BY created_at DESC
    LIMIT 6
  `);
  const totalAmount = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  res.json({ success: true, data: { items, total: items.length, totalAmount } });
});

app.get('/api/overview', (req, res) => {
  const overview = row(`
    SELECT
      COALESCE((SELECT SUM(amount) FROM transactions), 0) as totalTradingAmount,
      (SELECT COUNT(*) FROM accounts WHERE status IN ('available', 'selling', 'rented')) as onlineAccounts,
      (SELECT COUNT(*) FROM rental_risk) as securityEvents,
      COALESCE((SELECT SUM(amount) FROM transactions WHERE escrow_status LIKE '%frozen%'), 0) as escrowAmount,
      (SELECT COUNT(*) FROM insurance_claims WHERE claim_status IN ('pending', 'approved')) as claimQueue,
      (SELECT COUNT(*) FROM risk_alerts WHERE severity IN ('high', 'critical')) as highRiskAlerts
  `);
  res.json({ success: true, data: overview });
});

app.get('/api/accounts', (req, res) => {
  const accounts = rows('SELECT * FROM accounts ORDER BY created_at DESC').map(parseAccount);
  res.json({ success: true, data: { items: accounts, total: accounts.length } });
});

app.get('/api/accounts/:id', (req, res) => {
  const account = parseAccount(row('SELECT * FROM accounts WHERE id = ?', [req.params.id]));
  if (!account) {
    res.status(404).json({ success: false, error: 'account not found' });
    return;
  }
  const rentalRisk = row('SELECT * FROM rental_risk WHERE account_id = ?', [req.params.id]);
  const bids = rows('SELECT * FROM recycle_bids WHERE account_id = ? ORDER BY weight_score DESC', [req.params.id]);
  res.json({ success: true, data: { ...account, rentalRisk, bids } });
});

app.get('/api/transactions', (req, res) => {
  const transactions = rows(`
    SELECT t.*, a.game_name, a.game_uid
    FROM transactions t
    LEFT JOIN accounts a ON a.id = t.account_id
    ORDER BY t.created_at DESC
  `);
  res.json({ success: true, data: { items: transactions, total: transactions.length } });
});

app.get('/api/risk/alerts', (req, res) => {
  const alerts = rows(`
    SELECT r.*, a.game_uid, a.game_name
    FROM risk_alerts r
    LEFT JOIN accounts a ON a.id = r.account_id
    ORDER BY r.created_at DESC
  `);
  res.json({ success: true, data: { items: alerts, total: alerts.length } });
});

app.get('/api/audit/triple-flow', (req, res) => {
  const flow = rows('SELECT * FROM audit_flow ORDER BY created_at ASC');
  res.json({ success: true, data: { items: flow, total: flow.length } });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59123);
const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
