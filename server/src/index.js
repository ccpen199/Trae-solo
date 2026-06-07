import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB, initDB } from './db.js';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import caseRoutes from './routes/cases.js';
import certificateRoutes from './routes/certificates.js';
import materialRoutes from './routes/materials.js';
import dashboardRoutes from './routes/dashboard.js';
import departmentRoutes from './routes/departments.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import evaluationRoutes from './routes/evaluations.js';
import searchRoutes from './routes/search.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.get(['/api/users/profile', '/api/user/profile'], (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.id_number, u.phone, u.email,
        u.user_type, u.department_id, u.role, u.avatar, u.status,
        u.last_login_at, u.created_at, u.updated_at,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.username = 'admin'
    `).get();

    res.json({
      user,
      profile: user,
      message: 'demo profile'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const db = getDB();
    const totalItems = db.prepare('SELECT COUNT(*) as cnt FROM service_items').get().cnt;
    const totalCases = db.prepare('SELECT COUNT(*) as cnt FROM cases').get().cnt;
    const totalCertificates = db.prepare('SELECT COUNT(*) as cnt FROM certificates').get().cnt;
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const pendingCases = db.prepare("SELECT COUNT(*) as cnt FROM cases WHERE status IN ('submitted','accepted','reviewing','supplementing')").get().cnt;

    res.json({
      totalItems,
      totalCases,
      totalCertificates,
      totalUsers,
      pendingCases,
      status: 'ok'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard', (req, res) => {
  try {
    const db = getDB();
    const totalItems = db.prepare('SELECT COUNT(*) as cnt FROM service_items').get().cnt;
    const totalCases = db.prepare('SELECT COUNT(*) as cnt FROM cases').get().cnt;
    const totalCertificates = db.prepare('SELECT COUNT(*) as cnt FROM certificates').get().cnt;
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const pendingCases = db.prepare("SELECT COUNT(*) as cnt FROM cases WHERE status IN ('submitted','accepted','reviewing','supplementing')").get().cnt;
    const recentCases = db.prepare(`
      SELECT c.id, c.case_no, c.applicant_name, c.status, c.created_at, si.name as item_name
      FROM cases c
      LEFT JOIN service_items si ON c.item_id = si.id
      ORDER BY c.created_at DESC
      LIMIT 8
    `).all();

    res.json({
      stats: { totalItems, totalCases, totalCertificates, totalUsers, pendingCases },
      recentCases,
      status: 'ok'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initDB();
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Backend listening on http://127.0.0.1:${PORT}`);
  });
}

start();
