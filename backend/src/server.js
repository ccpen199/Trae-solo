require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/cities', (req, res) => {
  const keyword = req.query.keyword || '';
  const cities = db
    .prepare(`SELECT code, name, pinyin FROM cities WHERE name LIKE ? OR pinyin LIKE ? OR code LIKE ?`)
    .all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  res.json({ success: true, data: cities });
});

app.get('/api/cities/hot', (req, res) => {
  const cities = db
    .prepare(`SELECT code, name, pinyin FROM cities WHERE is_hot = 1 ORDER BY sort ASC`)
    .all();
  res.json({ success: true, data: cities });
});

app.post('/api/search', (req, res) => {
  const { fromCity, toCity, date, type } = req.body;
  const searchId = Date.now().toString();
  
  db.prepare(`
    INSERT INTO search_history (search_id, from_city, to_city, search_date, search_type, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(searchId, fromCity, toCity, date, type || 'flight', 'guest');
  
  res.json({ success: true, data: { searchId } });
});

app.get('/api/search/history', (req, res) => {
  const history = db
    .prepare(`SELECT * FROM search_history ORDER BY created_at DESC LIMIT 20`)
    .all();
  res.json({ success: true, data: history });
});

app.get('/api/user/preferences', (req, res) => {
  const history = db
    .prepare(`SELECT from_city, to_city FROM search_history ORDER BY created_at DESC LIMIT 1`)
    .get();
  res.json({ success: true, data: history || { fromCity: 'BJ', toCity: 'SH' } });
});

app.post('/api/train/booking', (req, res) => {
  const { trainNo, fromCity, toCity, date, price, fromStation, toStation, startTime, endTime } = req.body;
  const orderId = 'TK' + Date.now().toString().slice(-8);
  const userId = req.cookies.user_id || 'guest_' + Date.now();
  
  db.prepare(`
    INSERT INTO train_orders (order_id, train_no, from_city, to_city, travel_date, price, status, user_id, from_station, to_station, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, trainNo, fromCity, toCity, date, price, 'confirmed', userId, fromStation, toStation, startTime, endTime);
  
  res.cookie('user_id', userId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
  res.json({ success: true, data: { orderId, trainNo, fromCity, toCity, date, price, status: 'confirmed' } });
});

app.get('/api/train/orders', (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    return res.json({ success: true, data: [] });
  }
  
  const orders = db
    .prepare(`SELECT * FROM train_orders WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId);
  res.json({ success: true, data: orders });
});

app.get('/api/train/orders/:orderId', (req, res) => {
  const order = db
    .prepare(`SELECT * FROM train_orders WHERE order_id = ?`)
    .get(req.params.orderId);
  
  if (order) {
    res.json({ success: true, data: order });
  } else {
    res.status(404).json({ success: false, message: '订单不存在' });
  }
});

const PORT = process.env.BACKEND_PORT || 54872;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`📊 Health check: http://127.0.0.1:${PORT}/api/health`);
});
