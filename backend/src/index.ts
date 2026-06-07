import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import db from './db/init';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import healthRouter from './routes/health';
import buildingsRouter from './routes/buildings';
import listingsRouter from './routes/listings';
import agentsRouter from './routes/agents';
import buyersRouter from './routes/buyers';
import reviewsRouter from './routes/reviews';
import policyRouter from './routes/policy';
import collaborationRouter from './routes/collaboration';
import adminRouter from './routes/admin';

const app = express();
const PORT = process.env.BACKEND_PORT || 59042;

app.use(cors({
  origin: ['http://127.0.0.1:49042', 'http://localhost:49042'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

function demoUserPayload() {
  const agent = db.prepare(`
    SELECT id, name, phone, agency, rating, status
    FROM agents
    WHERE status = '在岗'
    ORDER BY rating DESC, id
    LIMIT 1
  `).get() as any;

  return agent ? {
    id: agent.id,
    username: agent.name,
    real_name: agent.name,
    phone: agent.phone,
    role: 'agent',
    agency: agent.agency,
    rating: agent.rating,
    status: agent.status
  } : {
    id: 1,
    username: 'admin',
    real_name: '平台管理员',
    role: 'admin',
    agency: '房产交易数字化服务中台'
  };
}

function adminStatsPayload() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const dashboard = {
    total_buildings: (db.prepare('SELECT COUNT(*) as cnt FROM buildings').get() as any).cnt,
    total_listings: (db.prepare("SELECT COUNT(*) as cnt FROM listings WHERE status = '在售'").get() as any).cnt,
    total_agents: (db.prepare("SELECT COUNT(*) as cnt FROM agents WHERE status = '在岗'").get() as any).cnt,
    total_buyers: (db.prepare('SELECT COUNT(*) as cnt FROM buyers').get() as any).cnt,
    total_contracts: (db.prepare('SELECT COUNT(*) as cnt FROM contracts').get() as any).cnt,
    deals_this_month: (db.prepare(`
      SELECT COUNT(*) as cnt FROM contracts
      WHERE status = '已签署' AND strftime('%Y-%m', signed_at) = ?
    `).get(currentMonth) as any).cnt,
    total_commission: (db.prepare('SELECT COALESCE(SUM(commission_total), 0) as total FROM agents').get() as any).total,
    avg_city_price: Math.round((db.prepare('SELECT COALESCE(AVG(avg_price), 0) as avg FROM buildings').get() as any).avg)
  };

  return {
    code: 0,
    data: dashboard,
    message: 'success'
  };
}

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (_req, res) => {
  res.json({ code: 0, data: demoUserPayload(), message: 'success' });
});

app.get('/api/search', (req, res) => {
  try {
    const keyword = String(req.query.q || req.query.keyword || req.query.search || '').trim();
    const like = `%${keyword}%`;
    const listings = db.prepare(`
      SELECT l.*, b.name as building_name, b.district, b.address as building_address
      FROM listings l
      LEFT JOIN buildings b ON l.building_id = b.id
      WHERE ? = '' OR l.title LIKE ? OR l.description LIKE ? OR b.name LIKE ? OR b.district LIKE ?
      ORDER BY l.id DESC
      LIMIT 20
    `).all(keyword, like, like, like, like);
    const buildings = db.prepare(`
      SELECT id, name, district, address, avg_price
      FROM buildings
      WHERE ? = '' OR name LIKE ? OR district LIKE ? OR address LIKE ?
      ORDER BY id DESC
      LIMIT 20
    `).all(keyword, like, like, like);

    res.json({ code: 0, data: { keyword, listings, buildings, total: listings.length + buildings.length }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

app.get('/api/admin/stats', (_req, res) => {
  res.json(adminStatsPayload());
});

app.get('/api/admin/dashboard', (_req, res) => {
  res.json(adminStatsPayload());
});

app.use('/api/health', healthRouter);
app.use('/api/buildings', buildingsRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/policy', policyRouter);
app.use('/api/collaboration', collaborationRouter);
app.use('/api/admin', adminRouter);

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`[realestate-backend] Server running at http://127.0.0.1:${PORT}`);
});
