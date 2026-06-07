require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env'), override: true });
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59035', 10);

app.use(cors({ origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT}`, `http://localhost:${process.env.FRONTEND_PORT}`], credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/rescue', require('./routes/rescue'));
app.use('/api/mentor', require('./routes/mentor'));
app.use('/api/community', require('./routes/community'));
app.use('/api/fault-codes', require('./routes/faultCodes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/parts', require('./routes/parts'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function demoProfilePayload() {
  const user = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get() || db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
  return {
    user: user || {
      id: 1,
      username: 'admin',
      role: 'admin',
      name: '演示管理员'
    }
  };
}

app.get('/api/users/profile', (req, res) => {
  res.json(demoProfilePayload());
});

app.get('/api/user/profile', (req, res) => {
  res.json(demoProfilePayload());
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.search || '').trim();
  const like = `%${keyword}%`;
  try {
    const parts = db.prepare(`
      SELECT id, name, part_number, category, price, stock_quantity
      FROM parts
      WHERE ? = '' OR name LIKE ? OR part_number LIKE ? OR category LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(keyword, like, like, like, like);
    const courses = db.prepare(`
      SELECT id, title, category, difficulty, duration_minutes
      FROM courses
      WHERE ? = '' OR title LIKE ? OR description LIKE ? OR category LIKE ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(keyword, like, like, like);
    const faultCodes = db.prepare(`
      SELECT id, code, description, vehicle_model as category, severity
      FROM fault_codes
      WHERE ? = '' OR code LIKE ? OR description LIKE ? OR vehicle_model LIKE ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(keyword, like, like, like);
    res.json({
      keyword,
      parts,
      courses,
      faultCodes,
      total: parts.length + courses.length + faultCodes.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, p.name as part_name, p.part_number
      FROM parts_orders o
      LEFT JOIN parts p ON o.part_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all();
    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT id, name, part_number as sku, category, price, stock_quantity, description
      FROM parts
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
    res.json({ products, message: '卡车后市场平台以配件BOM作为可购买产品对象' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '卡车后市场平台使用配件订单流程，无独立购物车' });
});

app.get('/api/teachers', (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT
        t.id,
        u.name,
        t.skill_tags as specialties,
        t.vehicle_specialties,
        t.credit_score,
        t.availability_status
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.credit_score DESC
      LIMIT 20
    `).all();
    res.json({ teachers, total: teachers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT e.*, c.title as course_title
      FROM enrollments e
      LEFT JOIN courses c ON e.course_id = c.id
      ORDER BY e.enrolled_at DESC
      LIMIT 50
    `).all();
    res.json({ bookings, total: bookings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend running at http://127.0.0.1:${PORT}`);
});
