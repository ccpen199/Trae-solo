import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/init.js';

import authRoutes from './routes/auth.js';
import ownerRoutes from './routes/owners.js';
import designerRoutes from './routes/designers.js';
import companyRoutes from './routes/companies.js';
import supplierRoutes from './routes/suppliers.js';
import designRoutes from './routes/designs.js';
import quotationRoutes from './routes/quotations.js';
import inspectionRoutes from './routes/inspections.js';
import materialRoutes from './routes/materials.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/projects.js';
import orderRoutes from './routes/orders.js';
import { authMiddleware, roleMiddleware } from './middleware/auth.js';
import db from './db/database.js';

initDatabase();

const app = express();
const frontendPort = process.env.FRONTEND_PORT || 49044;
const allowedOrigins = new Set([
  `http://127.0.0.1:${frontendPort}`,
  `http://localhost:${frontendPort}`,
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by project CORS`));
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

function countTable(table: string): number {
  return Number((db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any).count || 0);
}

function buildDashboardStats() {
  const activeProjects = Number((db.prepare("SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'in_progress')").get() as any).count || 0);
  const completedProjects = Number((db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'").get() as any).count || 0);
  const pendingInspections = Number((db.prepare("SELECT COUNT(*) as count FROM inspection_tasks WHERE status IN ('pending', 'in_progress')").get() as any).count || 0);
  const totalRevenue = Number((db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND type IN ('deposit', 'payment')").get() as any).total || 0);

  return {
    projectsCount: countTable('projects'),
    activeProjects,
    pendingInspections,
    completedProjects,
    usersCount: countTable('users'),
    ownersCount: countTable('owners'),
    designersCount: countTable('designers'),
    companiesCount: countTable('companies'),
    suppliersCount: countTable('suppliers'),
    designSchemesCount: countTable('design_schemes'),
    quotationsCount: countTable('quotations'),
    materialsCount: countTable('materials'),
    ordersCount: countTable('material_orders'),
    totalRevenue,
    status: 'running',
  };
}

app.get('/api/dashboard/stats', authMiddleware, (_req, res) => {
  try {
    res.json({ success: true, data: buildDashboardStats() });
  } catch {
    res.status(500).json({ success: false, error: '获取工作台统计失败' });
  }
});

app.get('/api/dashboard/activities', authMiddleware, (_req, res) => {
  try {
    const projects = db.prepare(
      "SELECT id, title, status, updated_at as time FROM projects ORDER BY updated_at DESC LIMIT 4"
    ).all() as any[];
    const inspections = db.prepare(
      `SELECT it.id, it.status, it.updated_at as time, p.title as project_title
       FROM inspection_tasks it
       LEFT JOIN projects p ON it.project_id = p.id
       ORDER BY it.updated_at DESC LIMIT 4`
    ).all() as any[];
    const orders = db.prepare(
      `SELECT mo.id, mo.status, mo.updated_at as time, m.name as material_name
       FROM material_orders mo
       LEFT JOIN materials m ON mo.material_id = m.id
       ORDER BY mo.updated_at DESC LIMIT 4`
    ).all() as any[];

    const activities = [
      ...projects.map((item) => ({
        id: `project-${item.id}`,
        action: `项目「${item.title}」状态：${item.status}`,
        time: item.time,
        type: 'project',
      })),
      ...inspections.map((item) => ({
        id: `inspection-${item.id}`,
        action: `验收任务「${item.project_title || `项目#${item.id}`}」状态：${item.status}`,
        time: item.time,
        type: 'inspection',
      })),
      ...orders.map((item) => ({
        id: `material-${item.id}`,
        action: `材料订单「${item.material_name || `订单#${item.id}`}」状态：${item.status}`,
        time: item.time,
        type: 'material',
      })),
    ].sort((a, b) => String(b.time || '').localeCompare(String(a.time || ''))).slice(0, 8);

    res.json({ success: true, data: activities });
  } catch {
    res.status(500).json({ success: false, error: '获取最近动态失败' });
  }
});

app.get('/api/products', authMiddleware, (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize || req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const rows = db.prepare(
      `SELECT m.id, m.name, m.brand, m.category, m.specification, m.unit_price as price,
              m.stock, m.status, u.name as supplier_name
       FROM materials m
       LEFT JOIN users u ON m.supplier_id = u.id
       ORDER BY m.updated_at DESC LIMIT ? OFFSET ?`
    ).all(limit, offset);
    const total = countTable('materials');

    res.json({
      success: true,
      data: {
        list: rows,
        total,
        page,
        limit,
        pageSize: limit,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取建材商品列表失败' });
  }
});

app.get('/api/cart', authMiddleware, (_req, res) => {
  res.json({ success: true, data: { list: [], items: [], total: 0 } });
});

function userProfileHandler(req: any, res: any) {
  try {
    const user = db.prepare(
      'SELECT id, username, role, name, phone, email, avatar, created_at FROM users WHERE id = ?'
    ).get(req.user.id) as any;
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
}

app.get('/api/users/profile', authMiddleware, userProfileHandler);
app.get('/api/user/profile', authMiddleware, userProfileHandler);

app.get('/api/users', authMiddleware, (req: any, res) => {
  try {
    const role = req.query.role as string;
    const limit = Number(req.query.limit) || 100;
    const offset = 0;

    let whereClause = '';
    const params: any[] = [];

    if (role) {
      whereClause = 'WHERE u.role = ?';
      params.push(role);
    }

    let query = '';
    if (role === 'owner') {
      query = `SELECT o.id as profile_id, o.user_id, u.username, u.name, u.role, u.phone, u.email, u.avatar
               FROM owners o JOIN users u ON o.user_id = u.id ${whereClause}
               ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    } else if (role === 'designer') {
      query = `SELECT d.id as profile_id, d.user_id, u.username, u.name, u.role, u.phone, u.email, u.avatar
               FROM designers d JOIN users u ON d.user_id = u.id ${whereClause}
               ORDER BY d.rating DESC LIMIT ? OFFSET ?`;
    } else if (role === 'company') {
      query = `SELECT c.id as profile_id, c.user_id, u.username, u.name, u.role, u.phone, u.email, u.avatar
               FROM companies c JOIN users u ON c.user_id = u.id ${whereClause}
               ORDER BY c.contract_fulfillment_rate DESC LIMIT ? OFFSET ?`;
    } else {
      query = `SELECT u.id, u.username, u.name, u.role, u.phone, u.email, u.avatar, u.created_at
               FROM users u ${whereClause}
               ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    }

    const users = db.prepare(query).all(...params, limit, offset);
    res.json({ success: true, data: { list: users, total: users.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  }
});

app.get('/api/admin/stats', authMiddleware, roleMiddleware(['admin']), (_req, res) => {
  try {
    const count = (table: string) => Number((db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any).count || 0);
    const activeProjects = Number((db.prepare("SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'in_progress')").get() as any).count || 0);
    const completedProjects = Number((db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'").get() as any).count || 0);
    const pendingInspections = Number((db.prepare("SELECT COUNT(*) as count FROM inspection_tasks WHERE status IN ('pending', 'in_progress')").get() as any).count || 0);

    res.json({
      success: true,
      data: {
        usersCount: count('users'),
        ownersCount: count('owners'),
        designersCount: count('designers'),
        companiesCount: count('companies'),
        suppliersCount: count('suppliers'),
        projectsCount: count('projects'),
        designSchemesCount: count('design_schemes'),
        quotationsCount: count('quotations'),
        materialsCount: count('materials'),
        ordersCount: count('material_orders'),
        activeProjects,
        completedProjects,
        pendingInspections,
        status: 'running',
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取管理统计失败' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/designers', designerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);

const PORT = process.env.BACKEND_PORT || 59044;

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
