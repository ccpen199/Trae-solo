const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  override: true
});

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.BACKEND_PORT || '58944', 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '48944', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'cinema-platform-jwt-secret';
const dbPath = path.resolve(__dirname, process.env.DB_PATH || './data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      phone TEXT,
      email TEXT,
      role TEXT DEFAULT 'user',
      member_level TEXT DEFAULT 'normal',
      member_points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cinemas (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      address TEXT NOT NULL,
      hall_count INTEGER DEFAULT 0,
      equipment_types TEXT,
      description TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      original_title TEXT,
      poster TEXT,
      backdrop TEXT,
      duration INTEGER,
      release_date TEXT,
      versions TEXT,
      languages TEXT,
      genres TEXT,
      director TEXT,
      cast TEXT,
      synopsis TEXT,
      rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'showing'
    );

    CREATE TABLE IF NOT EXISTS showtimes (
      id INTEGER PRIMARY KEY,
      cinema_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      hall_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      version TEXT,
      language TEXT,
      base_price REAL NOT NULL,
      remaining_seats INTEGER DEFAULT 90,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      showtime_id INTEGER NOT NULL,
      seats TEXT NOT NULL,
      total_amount REAL NOT NULL,
      pay_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'created',
      verify_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      user_id INTEGER,
      rating INTEGER NOT NULL,
      content TEXT,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedDatabase() {
  const password = bcrypt.hashSync('123456', 8);

  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, nickname, phone, email, role, member_level, member_points)
    VALUES
      (1, 'user', ?, '普通会员', '13800000001', 'user@example.com', 'user', 'gold', 860),
      (2, 'admin', ?, '运营管理员', '13800000002', 'admin@example.com', 'admin', 'diamond', 1880)
  `).run(password, password);

  db.prepare(`
    INSERT OR IGNORE INTO cinemas (id, name, city, district, address, hall_count, equipment_types, description, contact_phone)
    VALUES
      (1, 'PinAI影城 国贸旗舰店', '北京', '朝阳区', '建国门外大街1号', 9, 'IMAX,Dolby Atmos,4DX', '商圈旗舰影城，覆盖高端厅和亲子厅。', '010-8894-4001'),
      (2, 'PinAI影城 徐家汇店', '上海', '徐汇区', '漕溪北路18号', 7, 'CINITY,Dolby Vision', '核心商圈连锁门店，支持在线选座与会员权益。', '021-8894-4002'),
      (3, 'PinAI影城 天河店', '广州', '天河区', '天河路208号', 6, 'Laser,VIP', '华南区域重点门店，适合路演和首映活动。', '020-8894-4003')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO movies (id, title, original_title, poster, backdrop, duration, release_date, versions, languages, genres, director, cast, synopsis, rating, rating_count)
    VALUES
      (1, '星际回响', 'Echoes of Orbit', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200', 128, '2026-05-20', 'IMAX,2D', '国语,英语', '科幻,冒险', '林远', '周辰,陈洛,韩予', '深空通信事故后，一支工程小队在轨道城找回失联真相。', 9.1, 38216),
      (2, '海岸线计划', 'The Coastline Plan', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', 112, '2026-05-28', '2D,Dolby Vision', '国语', '剧情,悬疑', '许岚', '赵越,宋佳宁', '城市更新项目背后，多方利益在一份旧合同里交汇。', 8.7, 24190),
      (3, '午夜喜剧社', 'Midnight Club', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200', 96, '2026-06-01', '2D', '国语', '喜剧', '马可', '李闻,唐小羽', '四个新人演员误闯午夜场，用一晚完成命运反转。', 8.4, 17642)
  `).run();

  const showtimeCount = db.prepare('SELECT COUNT(*) AS count FROM showtimes').get().count;
  if (showtimeCount === 0) {
    const insert = db.prepare(`
      INSERT INTO showtimes (id, cinema_id, movie_id, hall_name, start_time, end_time, version, language, base_price, remaining_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const baseDate = '2026-06-02';
    [
      [1, 1, 1, 'IMAX 1号厅', `${baseDate} 10:30:00`, `${baseDate} 12:38:00`, 'IMAX', '国语', 78, 84],
      [2, 1, 2, 'Dolby 3号厅', `${baseDate} 13:20:00`, `${baseDate} 15:12:00`, 'Dolby Vision', '国语', 68, 76],
      [3, 2, 1, 'CINITY 2号厅', `${baseDate} 16:10:00`, `${baseDate} 18:18:00`, 'CINITY', '英语', 88, 68],
      [4, 2, 3, '欢乐 5号厅', `${baseDate} 19:30:00`, `${baseDate} 21:06:00`, '2D', '国语', 48, 91],
      [5, 3, 2, 'VIP 6号厅', `${baseDate} 20:40:00`, `${baseDate} 22:32:00`, '2D', '国语', 58, 52]
    ].forEach((row) => insert.run(...row));
  }
}

function toList(value) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function mapMovie(movie) {
  if (!movie) return null;
  return {
    ...movie,
    versions: toList(movie.versions),
    languages: toList(movie.languages),
    genres: toList(movie.genres),
    cast: toList(movie.cast)
  };
}

function mapCinema(cinema) {
  if (!cinema) return null;
  return {
    ...cinema,
    equipment_types: toList(cinema.equipment_types)
  };
}

function signUser(user) {
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password, ...safeUser } = user;
  return { token, user: safeUser };
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      req.user = null;
    }
  }
  next();
}

initDatabase();
seedDatabase();

const app = express();
app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(authOptional);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'healthy',
    port: PORT,
    counts: {
      movies: db.prepare('SELECT COUNT(*) AS count FROM movies').get().count,
      cinemas: db.prepare('SELECT COUNT(*) AS count FROM cinemas').get().count,
      showtimes: db.prepare('SELECT COUNT(*) AS count FROM showtimes').get().count
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  res.json(signUser(user));
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname, phone, email } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, bcrypt.hashSync(password, 8), nickname || username, phone || null, email || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json(signUser(user));
  } catch (error) {
    res.status(409).json({ error: '用户名已存在' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  const user = db.prepare('SELECT id, username, nickname, phone, email, role, member_level, member_points FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

app.put('/api/auth/profile', (req, res) => {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  const { nickname, phone, email } = req.body || {};
  db.prepare('UPDATE users SET nickname = COALESCE(?, nickname), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?')
    .run(nickname || null, phone || null, email || null, req.user.id);
  const user = db.prepare('SELECT id, username, nickname, phone, email, role, member_level, member_points FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

app.get('/api/cinemas', (req, res) => {
  const { city } = req.query;
  const rows = city
    ? db.prepare('SELECT * FROM cinemas WHERE city = ? AND status = "active" ORDER BY id').all(city)
    : db.prepare('SELECT * FROM cinemas WHERE status = "active" ORDER BY id').all();
  res.json({ list: rows.map(mapCinema), total: rows.length });
});

app.get('/api/cinemas/cities', (_req, res) => {
  const cities = db.prepare('SELECT DISTINCT city FROM cinemas ORDER BY city').all().map((row) => row.city);
  res.json({ cities });
});

app.get('/api/cinemas/:id', (req, res) => {
  const cinema = mapCinema(db.prepare('SELECT * FROM cinemas WHERE id = ?').get(req.params.id));
  if (!cinema) return res.status(404).json({ error: '影院不存在' });
  res.json({ cinema });
});

app.get('/api/cinemas/:id/showtimes', (req, res) => {
  const list = db.prepare(`
    SELECT s.*, m.title AS movie_title, m.poster AS movie_poster
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    WHERE s.cinema_id = ?
    ORDER BY s.start_time
  `).all(req.params.id);
  res.json({ list, total: list.length });
});

app.get('/api/movies', (req, res) => {
  const { status = 'showing' } = req.query;
  const rows = db.prepare('SELECT * FROM movies WHERE status = ? ORDER BY rating DESC, id').all(status);
  res.json({ list: rows.map(mapMovie), total: rows.length });
});

app.get('/api/movies/recommendations', (_req, res) => {
  const rows = db.prepare('SELECT * FROM movies WHERE status = "showing" ORDER BY rating DESC LIMIT 6').all();
  res.json({ list: rows.map(mapMovie) });
});

app.get('/api/movies/:id', (req, res) => {
  const movie = mapMovie(db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id));
  if (!movie) return res.status(404).json({ error: '影片不存在' });
  res.json({ movie });
});

app.get('/api/movies/:id/showtimes', (req, res) => {
  const list = db.prepare(`
    SELECT s.*, c.name AS cinema_name, c.city, c.district
    FROM showtimes s
    JOIN cinemas c ON c.id = s.cinema_id
    WHERE s.movie_id = ?
    ORDER BY s.start_time
  `).all(req.params.id);
  res.json({ list, total: list.length });
});

app.get('/api/showtimes', (_req, res) => {
  const list = db.prepare(`
    SELECT s.*, m.title AS movie_title, c.name AS cinema_name, c.city
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    JOIN cinemas c ON c.id = s.cinema_id
    ORDER BY s.start_time
  `).all();
  res.json({ list, total: list.length });
});

app.get('/api/showtimes/:id', (req, res) => {
  const showtime = db.prepare(`
    SELECT s.*, m.title AS movie_title, m.poster, c.name AS cinema_name, c.address
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    JOIN cinemas c ON c.id = s.cinema_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!showtime) return res.status(404).json({ error: '场次不存在' });
  const rows = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 10 }, (_, col) => ({
      row: row + 1,
      col: col + 1,
      code: `${String.fromCharCode(65 + row)}${col + 1}`,
      status: row === 2 && col < 2 ? 'sold' : 'available'
    }))
  );
  res.json({ showtime, seats: rows.flat() });
});

app.post('/api/showtimes/:id/lock-seats', (req, res) => {
  const seats = req.body?.seats || [];
  res.json({
    success: true,
    lockId: uuidv4(),
    seats,
    expireAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
});

app.post('/api/showtimes/:id/release-seats', (_req, res) => {
  res.json({ success: true });
});

app.get('/api/orders', (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, s.start_time, m.title AS movie_title, c.name AS cinema_name
    FROM orders o
    JOIN showtimes s ON s.id = o.showtime_id
    JOIN movies m ON m.id = s.movie_id
    JOIN cinemas c ON c.id = s.cinema_id
    WHERE (? IS NULL OR o.user_id = ?)
    ORDER BY o.created_at DESC
  `).all(req.user?.id || null, req.user?.id || null);
  res.json({ list: rows, total: rows.length });
});

app.post('/api/orders', (req, res) => {
  const { showtime_id, showtimeId, seats = [], total_amount, totalAmount } = req.body || {};
  const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(showtime_id || showtimeId);
  if (!showtime) return res.status(404).json({ error: '场次不存在' });
  const id = `ORD-${Date.now()}`;
  const amount = Number(total_amount || totalAmount || seats.length * showtime.base_price || showtime.base_price);
  db.prepare(`
    INSERT INTO orders (id, user_id, showtime_id, seats, total_amount, verify_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user?.id || 1, showtime.id, JSON.stringify(seats), amount, String(Math.floor(100000 + Math.random() * 900000)));
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ order });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, s.start_time, m.title AS movie_title, c.name AS cinema_name
    FROM orders o
    JOIN showtimes s ON s.id = o.showtime_id
    JOIN movies m ON m.id = s.movie_id
    JOIN cinemas c ON c.id = s.cinema_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json({ order });
});

app.post('/api/orders/:id/pay', (req, res) => {
  db.prepare('UPDATE orders SET pay_status = "paid", status = "paid" WHERE id = ?').run(req.params.id);
  res.json({ success: true, payMethod: req.body?.pay_method || 'mock' });
});

app.post('/api/orders/:id/cancel', (req, res) => {
  db.prepare('UPDATE orders SET status = "cancelled" WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/orders/verify', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE verify_code = ? OR id = ?').get(req.body?.code || '', req.body?.orderId || '');
  res.json({ success: Boolean(order), order });
});

app.get('/api/reviews', (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews WHERE (? IS NULL OR movie_id = ?) ORDER BY created_at DESC')
    .all(req.query.movie_id || null, req.query.movie_id || null);
  res.json({ list: rows, total: rows.length });
});

app.post('/api/reviews', (req, res) => {
  const { movie_id, movieId, rating = 5, content = '' } = req.body || {};
  const result = db.prepare('INSERT INTO reviews (movie_id, user_id, rating, content) VALUES (?, ?, ?, ?)')
    .run(movie_id || movieId || 1, req.user?.id || 1, rating, content);
  res.json({ review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid) });
});

app.post('/api/reviews/:id/like', (req, res) => {
  db.prepare('UPDATE reviews SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/danmaku/:showtimeId', (_req, res) => {
  res.json({ list: [{ id: 1, content: '开场节奏很好', color: '#ffffff', position: 'scroll' }] });
});

app.get('/api/danmaku/movie/:movieId', (_req, res) => {
  res.json({ list: [{ id: 1, content: '推荐 IMAX 厅', color: '#ffd166', position: 'top' }] });
});

app.post('/api/danmaku', (req, res) => {
  res.json({ item: { id: Date.now(), ...req.body } });
});

app.get('/api/admin/dashboard', (_req, res) => {
  res.json({
    summary: {
      cinemas: db.prepare('SELECT COUNT(*) AS count FROM cinemas').get().count,
      movies: db.prepare('SELECT COUNT(*) AS count FROM movies').get().count,
      showtimes: db.prepare('SELECT COUNT(*) AS count FROM showtimes').get().count,
      orders: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
      revenue: db.prepare('SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE pay_status = "paid"').get().total
    },
    recentOrders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all()
  });
});

app.get('/api/admin/users', (_req, res) => {
  const list = db.prepare('SELECT id, username, nickname, role, member_level, member_points FROM users ORDER BY id').all();
  res.json({ list, total: list.length });
});

app.get('/api/admin/coupons', (_req, res) => res.json({ list: [], total: 0 }));
app.get('/api/admin/pricing-rules', (_req, res) => res.json({ list: [], total: 0 }));
app.get('/api/admin/marketing-activities', (_req, res) => res.json({ list: [], total: 0 }));
app.get('/api/admin/audit-logs', (_req, res) => res.json({ list: [], total: 0 }));
app.get('/api/admin/benefits', (_req, res) => res.json({ list: [], total: 0 }));
app.get('/api/admin/user/coupons', (_req, res) => res.json({ list: [], total: 0 }));
app.get('/api/admin/user/history', (_req, res) => res.json({ list: [], total: 0 }));
app.post('/api/admin/:resource', (req, res) => res.json({ success: true, resource: req.params.resource, item: req.body || {} }));
app.put('/api/admin/:resource/:id', (req, res) => res.json({ success: true, resource: req.params.resource, id: req.params.id, item: req.body || {} }));

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在', path: req.path });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || '服务器内部错误' });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/danmaku' });
wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'hello', content: 'danmaku websocket ready' }));
});

server.listen(PORT, HOST, () => {
  console.log(`cinema backend listening on http://${HOST}:${PORT}`);
  console.log(`health: http://${HOST}:${PORT}/api/health`);
  console.log(`sqlite: ${dbPath}`);
});

