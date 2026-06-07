const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('./db');
const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brands');
const rankingRoutes = require('./routes/rankings');
const knowledgeRoutes = require('./routes/knowledge');
const adminRoutes = require('./routes/admin');
const collectionRoutes = require('./routes/collections');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59032;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49032';
const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    database: 'connected'
  });
});

app.get('/api/ide/v1/text_to_image', (req, res) => {
  const prompt = String(req.query.prompt || '品牌').replace(/[<>&]/g, '').trim();
  const label = (prompt.match(/[A-Za-z\u4e00-\u9fa5]+/g) || ['品牌']).join(' ').slice(0, 12);
  const hue = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="hsl(${hue},70%,46%)"/><stop offset="1" stop-color="hsl(${(hue + 45) % 360},70%,58%)"/></linearGradient></defs>
    <rect width="160" height="160" rx="24" fill="url(#g)"/>
    <circle cx="126" cy="34" r="18" fill="rgba(255,255,255,.24)"/>
    <text x="80" y="88" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#fff">${label}</text>
    <text x="80" y="114" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,.82)">Brand Logo</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

function demoUser() {
  const admin = db.prepare("SELECT id, username, role, created_at FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
  const user = admin || db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id LIMIT 1').get();
  return user || { id: 1, username: 'admin', role: 'admin', created_at: new Date().toISOString() };
}

function adminDashboardPayload() {
  const stats = {
    total_brands: db.prepare('SELECT COUNT(*) as count FROM brands WHERE status = ?').get('active').count,
    total_topics: db.prepare('SELECT COUNT(*) as count FROM knowledge_topics').get().count,
    total_rankings: db.prepare('SELECT COUNT(*) as count FROM rankings').get().count,
    total_reports: db.prepare('SELECT COUNT(*) as count FROM research_reports').get().count,
    pending_alerts: db.prepare('SELECT COUNT(*) as count FROM update_alerts WHERE is_processed = 0').get().count,
    pending_reviews: db.prepare('SELECT COUNT(*) as count FROM knowledge_topics WHERE needs_review = 1').get().count
  };

  return {
    stats,
    recent_brands: db.prepare('SELECT * FROM brands ORDER BY updated_at DESC LIMIT 5').all(),
    recent_topics: db.prepare('SELECT * FROM knowledge_topics ORDER BY updated_at DESC LIMIT 5').all(),
    recent_alerts: db.prepare('SELECT * FROM update_alerts ORDER BY created_at DESC LIMIT 5').all()
  };
}

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (req, res) => {
  const user = demoUser();
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.username,
      createdAt: user.created_at
    },
    message: '品牌智库演示账号资料'
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const brands = db.prepare(`
    SELECT id, name, english_name, industry, category, region, description, overall_score
    FROM brands
    WHERE status = 'active'
      AND (? = '' OR name LIKE ? OR english_name LIKE ? OR industry LIKE ? OR category LIKE ? OR region LIKE ?)
    ORDER BY overall_score DESC, updated_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like, like);
  const topics = db.prepare(`
    SELECT id, title, summary, category, tags
    FROM knowledge_topics
    WHERE ? = '' OR title LIKE ? OR summary LIKE ? OR category LIKE ? OR tags LIKE ?
    ORDER BY updated_at DESC
    LIMIT 10
  `).all(keyword, like, like, like, like);
  res.json({ keyword, brands, topics, total: brands.length + topics.length, message: '品牌与知识搜索结果' });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({ stats: adminDashboardPayload().stats });
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json(adminDashboardPayload());
});

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT id, name, english_name, category, industry, region, description, overall_score
    FROM brands
    WHERE status = 'active'
    ORDER BY overall_score DESC, updated_at DESC
    LIMIT 20
  `).all();
  res.json({ products, message: '品牌智库以品牌条目作为可查看与对比对象' });
});

app.get('/api/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT id, brand_ids, comparison_data, created_at
    FROM brand_comparisons
    ORDER BY created_at DESC
    LIMIT 50
  `).all();
  res.json({ orders, total: orders.length, message: '品牌对比记录' });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '品牌智库使用收藏与品牌对比流程，无购物车' });
});

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/collections', collectionRoutes);

app.get('/api/stats', (req, res) => {
  const stats = {
    brands: db.prepare('SELECT COUNT(*) as count FROM brands WHERE status = ?').get('active').count,
    topics: db.prepare('SELECT COUNT(*) as count FROM knowledge_topics').get().count,
    rankings: db.prepare('SELECT COUNT(*) as count FROM rankings').get().count,
    categories: db.prepare('SELECT COUNT(*) as count FROM ranking_categories WHERE is_active = 1').get().count,
    dataSources: 4
  };
  res.json({
    ...stats,
    brandCount: stats.brands,
    knowledgeCount: stats.topics,
    rankingCount: stats.categories,
    dataSourceCount: stats.dataSources
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Brand Knowledge Platform Backend running on http://127.0.0.1:${PORT}`);
  console.log(`📊 API Base: http://127.0.0.1:${PORT}/api`);
  console.log(`✅ Health Check: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
