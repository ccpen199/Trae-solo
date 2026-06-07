const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const { initDB } = require('./db/init');
const { seedDB } = require('./db/seed');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const courierRoutes = require('./routes/couriers');
const dispatchRoutes = require('./routes/dispatch');
const adminRoutes = require('./routes/admin');
const enterpriseRoutes = require('./routes/enterprise');
const notificationRoutes = require('./routes/notifications');
const { verifyToken } = require('./middleware/auth');

const app = express();
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49048;

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  }
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/api/auth', authRoutes);

app.get('/api/users/profile', verifyToken, (req, res) => {
  const db = require('./db/init').getDB();
  const user = db.prepare('SELECT id, phone, name, role, credit_score, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.get('/api/user/profile', verifyToken, (req, res) => {
  const db = require('./db/init').getDB();
  const user = db.prepare('SELECT id, phone, name, role, credit_score, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.get('/api/search', (req, res) => {
  const db = require('./db/init').getDB();
  const q = String(req.query.q || '').trim();
  const like = `%${q}%`;
  const orders = db.prepare(`
    SELECT id, order_no, type, status, title, pickup_address, delivery_address, fee, reward, created_at
    FROM orders
    WHERE ? = '' OR order_no LIKE ? OR title LIKE ? OR pickup_address LIKE ? OR delivery_address LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(q, like, like, like, like);
  const couriers = db.prepare(`
    SELECT u.id, u.name, u.phone, cp.status, cp.is_online, cp.avg_rating
    FROM users u
    LEFT JOIN courier_profiles cp ON cp.user_id = u.id
    WHERE u.role = 'courier' AND (? = '' OR u.name LIKE ? OR u.phone LIKE ?)
    ORDER BY cp.is_online DESC, u.name ASC
    LIMIT 10
  `).all(q, like, like);
  res.json({ query: q, total: orders.length + couriers.length, results: { orders, couriers } });
});

app.get('/api/admin/stats', (req, res) => {
  const db = require('./db/init').getDB();
  res.json({
    totalOrders: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
    pendingOrders: db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending','dispatched','accepted','in_progress')").get().count,
    activeCouriers: db.prepare("SELECT COUNT(*) AS count FROM courier_profiles WHERE is_online = 1 AND status = 'approved'").get().count,
    requesterCount: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'requester'").get().count,
    courierCount: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'courier'").get().count,
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    products: [
      { id: 'pickup_delivery', name: '取送件服务', price: 15, stock: 999, category: '同城跑腿' },
      { id: 'purchase', name: '代购服务', price: 20, stock: 999, category: '代买代送' },
      { id: 'queue', name: '排队代办', price: 30, stock: 999, category: '排队办事' },
      { id: 'allpurpose', name: '万能帮办', price: 25, stock: 999, category: '综合服务' },
    ],
  });
});

app.get('/api/cart', (req, res) => {
  res.json({
    items: [
      { id: 'purchase-demo', product_id: 'purchase', name: '代购药品', quantity: 1, price: 20 },
    ],
    total: 20,
    checkoutReady: true,
  });
});

app.use('/api/orders', orderRoutes);
app.use('/api/couriers', courierRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initDB();
seedDB();

const PORT = process.env.BACKEND_PORT || 59048;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
