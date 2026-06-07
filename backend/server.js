import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import db from './db.js';
import cinemasRouter from './routes/cinemas.js';
import moviesRouter from './routes/movies.js';
import showtimesRouter from './routes/showtimes.js';
import ordersRouter from './routes/orders.js';
import seatsRouter from './routes/seats.js';
import audiencesRouter from './routes/audiences.js';
import walletRouter from './routes/wallet.js';
import crowdfundingRouter from './routes/crowdfunding.js';
import concessionsRouter from './routes/concessions.js';
import schedulingRouter from './routes/scheduling.js';
import analyticsRouter from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readRootEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf-8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

const envVars = readRootEnv();
const BACKEND_PORT = Number.parseInt(process.env.BACKEND_PORT || envVars.BACKEND_PORT, 10) || 59046;
const FRONTEND_PORT = Number.parseInt(process.env.FRONTEND_PORT || envVars.FRONTEND_PORT, 10) || 49046;
const HOST = '127.0.0.1';

const app = express();

app.use(
  cors({
    origin: [
      `http://127.0.0.1:${FRONTEND_PORT}`,
      `http://localhost:${FRONTEND_PORT}`,
    ],
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cinema-aggregation',
    db: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/auth/me', (_req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'admin',
      role: 'admin',
      real_name: '影院平台管理员',
    },
    mode: 'demo-no-login',
  });
});

app.get('/api/users/profile', (_req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'admin',
      role: 'admin',
      real_name: '影院平台管理员',
    },
  });
});

app.get('/api/user/profile', (_req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'admin',
      role: 'admin',
      real_name: '影院平台管理员',
    },
  });
});

app.get('/api/admin/stats', (_req, res) => {
  try {
    res.json({
      cinema_count: db.prepare('SELECT COUNT(*) AS count FROM cinemas').get().count,
      movie_count: db.prepare('SELECT COUNT(*) AS count FROM movies').get().count,
      showtime_count: db.prepare('SELECT COUNT(*) AS count FROM showtimes').get().count,
      order_count: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
      audience_count: db.prepare('SELECT COUNT(*) AS count FROM audiences').get().count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard', (_req, res) => {
  try {
    const recentOrders = db.prepare(`
      SELECT o.id, o.order_no, o.total_amount, o.status, m.title AS movie_title, c.name AS cinema_name
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 6
    `).all();
    const hotMovies = db.prepare(`
      SELECT m.id, m.title, COUNT(o.id) AS order_count
      FROM movies m
      LEFT JOIN showtimes s ON s.movie_id = m.id
      LEFT JOIN orders o ON o.showtime_id = s.id
      GROUP BY m.id
      ORDER BY order_count DESC
      LIMIT 6
    `).all();
    res.json({ service: 'cinema-admin-dashboard', recentOrders, hotMovies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', (_req, res) => {
  try {
    const movies = db.prepare(`
      SELECT id, title AS name, genre AS category, duration, status, release_date, poster_url AS image_url
      FROM movies
      ORDER BY id
      LIMIT 20
    `).all();
    const concessions = db.prepare(`
      SELECT id, name, category, price, status, image_url
      FROM concessions
      ORDER BY id
      LIMIT 20
    `).all();
    const products = [
      ...movies.map((movie) => ({
        ...movie,
        type: 'movie_ticket',
        price: 68,
        stock: 999,
      })),
      ...concessions.map((concession) => ({
        ...concession,
        type: 'concession',
        stock: 999,
      })),
    ];
    res.json({ products, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cart', (_req, res) => {
  try {
    const items = db.prepare(`
      SELECT id, name, category, price
      FROM concessions
      WHERE status = 'available'
      ORDER BY id
      LIMIT 3
    `).all().map((item) => ({
      ...item,
      quantity: 1,
      type: 'concession',
    }));
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    res.json({ items, total, status: 'ready_for_checkout' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/cinemas', cinemasRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/showtimes', showtimesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/audiences', audiencesRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/crowdfunding', crowdfundingRouter);
app.use('/api/concessions', concessionsRouter);
app.use('/api/scheduling', schedulingRouter);
app.use('/api/analytics', analyticsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(BACKEND_PORT, HOST, () => {
  console.log(`Cinema backend running on http://${HOST}:${BACKEND_PORT}`);
});
