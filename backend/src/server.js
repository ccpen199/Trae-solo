require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, initDatabase } = require('./models/db');
const apiLogger = require('./middleware/apiLogger');

const app = express();
const PORT = parseInt(process.env.PORT || 59071);
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49071';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const logDir = path.resolve(__dirname, '../../');
const frontendLogPath = path.join(logDir, 'frontend.log');
const backendLogPath = path.join(logDir, 'backend.log');

const backendLogStream = fs.createWriteStream(backendLogPath, { flags: 'a' });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  originalConsoleLog.apply(console, args);
  backendLogStream.write(`[${new Date().toISOString()}] LOG: ${args.join(' ')}\n`);
};

console.error = (...args) => {
  originalConsoleError.apply(console, args);
  backendLogStream.write(`[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`);
};

app.use(apiLogger);

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'construction-risk-control-backend',
    version: '1.0.0'
  });
});

app.use('/api/enterprises', require('./routes/enterprises'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/credit', require('./routes/credit'));
app.use('/api/risk-rules', require('./routes/riskRules'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/mobile', require('./routes/mobile'));

app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM enterprises) as enterprises,
      (SELECT COUNT(*) FROM judicial_records) as judicial,
      (SELECT COUNT(*) FROM bidding_records) as bidding,
      (SELECT COUNT(*) FROM qualifications) as qualifications,
      (SELECT COUNT(*) FROM personnel) as personnel,
      (SELECT COUNT(*) FROM credit_records) as credit,
      (SELECT COUNT(*) FROM api_logs) as api_calls
  `).get();
  
  res.json(stats);
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const {
    status,
    riskLevel,
    scoreMin,
    scoreMax
  } = req.query;
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || 10), 1), 100);
  const page = Math.max(parseInt(req.query.page || 1), 1);
  const offset = (page - 1) * pageSize;
  const baseSql = `
    SELECT e.*,
           COALESCE(h.total_score, 75) as total_score,
           COALESCE(h.risk_level, '中风险') as risk_level
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
  `;

  const filterConditions = [];
  const filterParams = [];

  if (status) {
    filterConditions.push(`e.status = ?`);
    filterParams.push(String(status));
  }

  if (riskLevel) {
    filterConditions.push(`COALESCE(h.risk_level, '中风险') = ?`);
    filterParams.push(String(riskLevel));
  }

  if (scoreMin !== undefined && scoreMin !== '') {
    filterConditions.push(`COALESCE(h.total_score, 75) >= ?`);
    filterParams.push(Number(scoreMin));
  }

  if (scoreMax !== undefined && scoreMax !== '') {
    filterConditions.push(`COALESCE(h.total_score, 75) <= ?`);
    filterParams.push(Number(scoreMax));
  }

  const buildWhere = (includeKeyword) => {
    const conditions = [...filterConditions];
    const params = [...filterParams];

    if (includeKeyword && keyword) {
      conditions.unshift(`(e.name LIKE ? OR e.unified_social_credit LIKE ?)`);
      params.unshift(`%${keyword}%`, `%${keyword}%`);
    }

    return {
      clause: conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  };

  let where = buildWhere(true);
  let list = db.prepare(`
    ${baseSql}
    ${where.clause}
    ORDER BY h.total_score ASC, e.id
    LIMIT ? OFFSET ?
  `).all(...where.params, pageSize, offset);
  let total = db.prepare(`
    SELECT COUNT(*) as count
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    ${where.clause}
  `).get(...where.params).count;
  let fallback = false;

  if (keyword && total === 0) {
    fallback = true;
    where = buildWhere(false);
    list = db.prepare(`
      ${baseSql}
      ${where.clause}
      ORDER BY h.total_score ASC, e.id
      LIMIT ? OFFSET ?
    `).all(...where.params, pageSize, offset);
    total = db.prepare(`
      SELECT COUNT(*) as count
      FROM enterprises e
      LEFT JOIN health_scores h ON e.id = h.enterprise_id
      ${where.clause}
    `).get(...where.params).count;
  }

  res.json({
    list,
    total,
    page,
    pageSize,
    keyword,
    fallback,
    filters: {
      status: status || '',
      riskLevel: riskLevel || '',
      scoreMin: scoreMin || '',
      scoreMax: scoreMax || ''
    }
  });
});

app.get('/api/admin/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM enterprises) as enterprises,
      (SELECT COUNT(*) FROM enterprises WHERE status = '经营异常') as abnormal_enterprises,
      (SELECT COUNT(*) FROM health_scores WHERE risk_level = '高风险') as high_risk_enterprises,
      (SELECT COUNT(*) FROM credit_repair_applications WHERE status = 'pending') as pending_repairs,
      (SELECT COUNT(*) FROM due_diligence_reports) as reports,
      (SELECT COUNT(*) FROM api_logs) as api_calls
  `).get();
  res.json({
    status: 'ok',
    module: 'admin',
    stats
  });
});

app.get('/api/admin/dashboard', (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM enterprises) as total_enterprises,
      (SELECT COUNT(*) FROM business_abnormalities WHERE status = '未移除') as pending_abnormalities,
      (SELECT COUNT(*) FROM bid_rigging_suspects WHERE status != '已排除') as rigging_suspects,
      (SELECT COUNT(*) FROM subcontractor_blacklist WHERE status = '黑名单中') as blacklist_count
  `).get();
  const riskDistribution = db.prepare(`
    SELECT risk_level, COUNT(*) as count
    FROM health_scores
    GROUP BY risk_level
    ORDER BY count DESC
  `).all();
  const latestAlerts = db.prepare(`
    SELECT ba.*, e.name as enterprise_name
    FROM business_abnormalities ba
    JOIN enterprises e ON e.id = ba.enterprise_id
    WHERE ba.status = '未移除'
    ORDER BY ba.decision_date DESC
    LIMIT 5
  `).all();

  res.json({
    status: 'ok',
    module: 'admin-dashboard',
    stats,
    riskDistribution,
    latestAlerts
  });
});

app.get('/api/admin/api-logs', (req, res) => {
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || 20), 1), 100);
  const page = Math.max(parseInt(req.query.page || 1), 1);
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT id, endpoint, method, status_code, response_time, created_at
    FROM api_logs
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM api_logs`).get().count;

  res.json({
    list,
    total,
    page,
    pageSize
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     建筑行业企业级风控数据服务平台 - 后端服务              ║
╠══════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                         ║
║  健康检查: http://${HOST}:${PORT}/api/health              ║
║  API文档:  http://${HOST}:${PORT}/api/stats               ║
║  数据库:  SQLite (data/app.sqlite)                       ║
╚══════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = server;
