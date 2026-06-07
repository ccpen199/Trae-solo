require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database/init');
const { authenticateToken } = require('./middleware/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const requirementRoutes = require('./routes/requirements');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 59039;

function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null));
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
  });
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49039}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#2563eb"/><path d="M18 34h28v6H18zM22 22h20v6H22z" fill="#fff"/></svg>');
});

async function demoUserPayload() {
  const user = await getOne(`
    SELECT id, username, email, role, phone, avatar, real_name, is_verified,
           rating, rating_count, location, balance, credit_score, created_at
    FROM users
    ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'provider' THEN 1 ELSE 2 END, id
    LIMIT 1
  `);
  return user || {
    id: 1,
    username: 'admin',
    role: 'admin',
    real_name: '演示管理员',
    location: '北京市'
  };
}

async function adminSummaryPayload() {
  const users = await getOne('SELECT COUNT(*) as count FROM users');
  const providers = await getOne('SELECT COUNT(*) as count FROM users WHERE role = "provider"');
  const requirements = await getOne('SELECT COUNT(*) as count FROM service_requirements');
  const orders = await getOne('SELECT COUNT(*) as count FROM orders');
  const completed = await getOne('SELECT COUNT(*) as count FROM orders WHERE status = "completed"');
  const revenue = await getOne('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = "completed"');
  const goodReviews = await getOne('SELECT COUNT(*) as count FROM reviews WHERE rating >= 4');
  const totalReviews = await getOne('SELECT COUNT(*) as count FROM reviews');
  const goodRate = totalReviews.count > 0 ? Math.round((goodReviews.count / totalReviews.count) * 100) : 95;
  
  const categoryDistribution = await getAll(`
    SELECT st.category, COUNT(DISTINCT ps.user_id) as count
    FROM skill_tags st
    LEFT JOIN provider_skills ps ON st.id = ps.skill_tag_id
    GROUP BY st.category
    ORDER BY count DESC
    LIMIT 10
  `);
  
  const orderTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const orderCount = await getOne(
      'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?',
      [dateStr]
    );
    orderTrend.push({ date: dateStr, count: orderCount.count || 0 });
  }
  
  return {
    total_users: users.count,
    total_providers: providers.count,
    total_requirements: requirements.count,
    total_orders: orders.count,
    completed_orders: completed.count,
    total_revenue: revenue.total || 0,
    good_rate: goodRate,
    category_distribution: categoryDistribution,
    order_trend: orderTrend
  };
}

async function fraudAlertsPayload() {
  const rows = await getAll(`
    SELECT o.id as order_id, o.title, o.total_amount, o.status, o.created_at,
           c.id as client_id, c.username as client_name, c.credit_score as client_credit,
           p.id as provider_id, p.username as provider_name, p.credit_score as provider_credit,
           julianday(COALESCE(o.updated_at, CURRENT_TIMESTAMP)) - julianday(o.created_at) as age_days
    FROM orders o
    JOIN users c ON o.client_id = c.id
    JOIN users p ON o.provider_id = p.id
    ORDER BY o.created_at DESC
    LIMIT 30
  `);

  const alerts = rows
    .map((row) => {
      if (row.client_id === row.provider_id) {
        return {
          id: `identity-${row.order_id}`,
          type: '身份异常',
          order_id: row.order_id,
          description: `订单「${row.title}」需求方与服务者账号相同，需要人工复核`,
          level: 'high',
          created_at: row.created_at
        };
      }
      if (row.total_amount >= 5000 && (row.client_credit < 80 || row.provider_credit < 80)) {
        return {
          id: `price-${row.order_id}`,
          type: '异常价格',
          order_id: row.order_id,
          description: `订单「${row.title}」金额 ¥${row.total_amount} 且交易双方存在信用分偏低情况`,
          level: 'high',
          created_at: row.created_at
        };
      }
      if (row.status === 'cancelled') {
        return {
          id: `cancel-${row.order_id}`,
          type: '频繁取消',
          order_id: row.order_id,
          description: `订单「${row.title}」已取消，建议结合用户近30天取消率复核`,
          level: 'medium',
          created_at: row.created_at
        };
      }
      if (row.status === 'completed' && row.age_days <= 0.05) {
        return {
          id: `fast-${row.order_id}`,
          type: '快速完单',
          order_id: row.order_id,
          description: `订单「${row.title}」创建后快速完成，建议核验服务凭证`,
          level: 'medium',
          created_at: row.created_at
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 12);

  if (alerts.length > 0) return alerts;

  const [orders, lowCreditUsers, disputes] = await Promise.all([
    getOne('SELECT COUNT(*) as count FROM orders'),
    getOne('SELECT COUNT(*) as count FROM users WHERE credit_score < 80'),
    getOne('SELECT COUNT(*) as count FROM disputes WHERE status = "pending"')
  ]);

  return [
    {
      id: 'monitor-credit',
      type: '信用预警',
      description: `平台当前有 ${lowCreditUsers.count || 0} 个低信用账号、${orders.count || 0} 笔订单纳入巡检`,
      level: (lowCreditUsers.count || 0) > 0 ? 'medium' : 'low',
      created_at: new Date().toISOString()
    },
    {
      id: 'monitor-dispute',
      type: '纠纷跟踪',
      description: `待处理纠纷 ${disputes.count || 0} 条，系统持续跟踪异常评价与退款行为`,
      level: (disputes.count || 0) > 0 ? 'high' : 'low',
      created_at: new Date().toISOString()
    }
  ];
}

async function skillTrendsPayload() {
  const rows = await getAll(`
    SELECT st.category,
           COUNT(DISTINCT sr.id) as requirement_count,
           COUNT(DISTINCT ps.user_id) as provider_count
    FROM skill_tags st
    LEFT JOIN service_requirements sr ON sr.category = st.category
    LEFT JOIN provider_skills ps ON ps.skill_tag_id = st.id
    WHERE st.is_active = 1
    GROUP BY st.category
    ORDER BY requirement_count DESC, provider_count DESC, st.category
    LIMIT 12
  `);

  return rows.map((row) => {
    const demand = Math.min(98, 45 + row.requirement_count * 8 + row.provider_count * 2);
    const supply = Math.min(98, 35 + row.provider_count * 8);
    const growthValue = Math.max(3, Math.min(24, Math.round(((row.requirement_count + 1) / (row.provider_count + 1)) * 8)));
    return {
      category: row.category,
      demand,
      supply,
      growth: `+${growthValue}%`,
      requirement_count: row.requirement_count,
      provider_count: row.provider_count
    };
  });
}

app.get('/api/auth/me', authenticateToken, asyncRoute(async (req, res) => {
  const user = await getOne('SELECT id, username, email, role, phone, avatar, real_name, is_verified, rating, rating_count, location, response_time, service_radius, balance, credit_score, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/admin/stats', asyncRoute(async (req, res) => {
  res.json({ stats: await adminSummaryPayload() });
}));

app.get('/api/admin/dashboard', asyncRoute(async (req, res) => {
  res.json(await adminSummaryPayload());
}));

app.get('/api/admin/fraud-alerts', asyncRoute(async (req, res) => {
  res.json(await fraudAlertsPayload());
}));

app.get('/api/admin/skill-trends', asyncRoute(async (req, res) => {
  res.json(await skillTrendsPayload());
}));

app.get('/api/search', asyncRoute(async (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const providers = await getAll(`
    SELECT DISTINCT u.id, u.username, u.rating, u.rating_count, u.location,
           GROUP_CONCAT(DISTINCT st.name) as skills
    FROM users u
    LEFT JOIN provider_skills ps ON u.id = ps.user_id
    LEFT JOIN skill_tags st ON ps.skill_tag_id = st.id
    WHERE u.role = 'provider'
      AND (? = '' OR u.username LIKE ? OR u.location LIKE ? OR st.name LIKE ? OR st.category LIKE ?)
    GROUP BY u.id
    ORDER BY u.rating DESC
    LIMIT 20
  `, [keyword, like, like, like, like]);
  const requirements = await getAll(`
    SELECT id, title, description, category, budget_type, budget_fixed, location, status
    FROM service_requirements
    WHERE ? = '' OR title LIKE ? OR description LIKE ? OR category LIKE ? OR location LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `, [keyword, like, like, like, like]);
  res.json({ keyword, providers, requirements, total: providers.length + requirements.length });
}));

app.get('/api/teachers', asyncRoute(async (req, res) => {
  const teachers = await getAll(`
    SELECT DISTINCT u.id, u.username as name, u.avatar, u.rating, u.rating_count,
           u.location, u.response_time, u.service_radius, u.is_verified,
           GROUP_CONCAT(DISTINCT st.name) as specialties
    FROM users u
    LEFT JOIN provider_skills ps ON u.id = ps.user_id
    LEFT JOIN skill_tags st ON ps.skill_tag_id = st.id
    WHERE u.role = 'provider'
    GROUP BY u.id
    ORDER BY u.rating DESC
    LIMIT 30
  `);
  res.json({ teachers, total: teachers.length });
}));

app.get('/api/courses', asyncRoute(async (req, res) => {
  const rows = await getAll(`
    SELECT category, COUNT(*) as skill_count
    FROM skill_tags
    WHERE is_active = 1
    GROUP BY category
    ORDER BY category
  `);
  const courses = rows.map((row, index) => ({
    id: index + 1,
    title: `${row.category}技能提升课`,
    category: row.category,
    difficulty: '入门到进阶',
    lessons: row.skill_count,
    description: `围绕${row.category}服务场景的技能训练与接单规范`
  }));
  res.json({ courses, total: courses.length });
}));

app.get('/api/bookings', asyncRoute(async (req, res) => {
  const bookings = await getAll(`
    SELECT id, requirement_id, client_id, provider_id, title, status,
           total_amount, service_address, service_date, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 50
  `);
  res.json({ bookings, total: bookings.length });
}));

app.get('/api/products', asyncRoute(async (req, res) => {
  const products = await getAll(`
    SELECT id, title as name, description, category, budget_fixed as price, location
    FROM service_requirements
    ORDER BY created_at DESC
    LIMIT 30
  `);
  res.json({ products, message: '技能零工平台以服务需求作为可交易对象' });
}));

app.get('/api/orders', asyncRoute(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const orders = await getAll(`
    SELECT o.*,
           (SELECT username FROM users WHERE id = o.client_id) as client_name,
           (SELECT username FROM users WHERE id = o.provider_id) as provider_name
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 30
  `);
  res.json(orders);
}));

app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, users) => {
    db.get('SELECT COUNT(*) as count FROM service_requirements', (err, requirements) => {
      db.get('SELECT COUNT(*) as count FROM orders WHERE status = "completed"', (err, completedOrders) => {
        db.get('SELECT COUNT(*) as count FROM reviews WHERE rating >= 4', (err, goodReviews) => {
          db.get('SELECT COUNT(*) as count FROM reviews', (err, totalReviews) => {
            const goodRate = totalReviews.count > 0 ? Math.round((goodReviews.count / totalReviews.count) * 100) : 95;
            res.json({
              users: users.count,
              requirements: requirements.count,
              orders: completedOrders.count,
              goodRate: goodRate
            });
          });
        });
      });
    });
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务器运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
