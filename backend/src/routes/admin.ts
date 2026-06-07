import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

function parseSpecialties(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall back to comma-separated text
  }
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function parseMonthInput(value: unknown, fallbackYear?: number, fallbackMonth?: number) {
  if (typeof value === 'string' && /^\d{4}-\d{1,2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
  }
  return {
    year: Number(fallbackYear || new Date().getFullYear()),
    month: Number(fallbackMonth || new Date().getMonth() + 1),
  };
}

function cityIndexValue(row: any): number {
  if (row.overall_index !== null && row.overall_index !== undefined) return Number(row.overall_index);
  const labor = Number(row.labor_index || 0);
  const material = Number(row.material_index || 0);
  return Math.round(((labor + material) / 2) * 100) / 100;
}

function mapCityIndices(rows: any[]) {
  const sorted = [...rows].sort((a, b) => {
    if (a.city !== b.city) return String(a.city).localeCompare(String(b.city));
    if (a.year !== b.year) return Number(a.year) - Number(b.year);
    return Number(a.month) - Number(b.month);
  });
  const previousByCity = new Map<string, number>();
  const trendById = new Map<number, number>();

  sorted.forEach((row) => {
    const value = cityIndexValue(row);
    const previous = previousByCity.get(row.city);
    if (previous !== undefined && previous !== 0) {
      trendById.set(row.id, Math.round(((value - previous) / previous) * 1000) / 10);
    } else {
      trendById.set(row.id, 0);
    }
    previousByCity.set(row.city, value);
  });

  return rows.map((row) => {
    const month = `${row.year}-${String(row.month).padStart(2, '0')}`;
    const value = cityIndexValue(row);
    return {
      ...row,
      index_value: value,
      month,
      trend: trendById.get(row.id) || 0,
    };
  });
}

router.get('/dashboard', (req: AuthenticatedRequest, res) => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const projectCount = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;
    const ownerCount = (db.prepare('SELECT COUNT(*) as count FROM owners').get() as any).count;
    const designerCount = (db.prepare('SELECT COUNT(*) as count FROM designers').get() as any).count;
    const companyCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as any).count;
    const supplierCount = (db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as any).count;
    const designSchemeCount = (db.prepare('SELECT COUNT(*) as count FROM design_schemes').get() as any).count;
    const quotationCount = (db.prepare('SELECT COUNT(*) as count FROM quotations').get() as any).count;
    const inspectionTaskCount = (db.prepare('SELECT COUNT(*) as count FROM inspection_tasks').get() as any).count;
    const complaintCount = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count;
    const materialCount = (db.prepare('SELECT COUNT(*) as count FROM materials').get() as any).count;
    const orderCount = (db.prepare('SELECT COUNT(*) as count FROM material_orders').get() as any).count;

    const projectsByStatus = db.prepare(
      "SELECT status, COUNT(*) as count FROM projects GROUP BY status"
    ).all();
    const activeProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'in_progress')").get() as any).count;
    const completedProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'").get() as any).count;
    const pendingInspections = (db.prepare("SELECT COUNT(*) as count FROM inspection_tasks WHERE status IN ('pending', 'in_progress')").get() as any).count;
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND type IN ('deposit', 'payment')").get() as any).total;

    const recentProjects = db.prepare(
      'SELECT * FROM projects ORDER BY created_at DESC LIMIT 5'
    ).all();

    const recentComplaints = db.prepare(
      'SELECT c.*, u.name as user_name FROM complaints c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 5'
    ).all();

    res.json({
      success: true,
      data: {
        usersCount: userCount,
        projectsCount: projectCount,
        activeProjects,
        pendingInspections,
        ownersCount: ownerCount,
        designersCount: designerCount,
        companiesCount: companyCount,
        suppliersCount: supplierCount,
        completedProjects,
        totalRevenue,
        counts: { users: userCount, projects: projectCount, owners: ownerCount, designers: designerCount, companies: companyCount, suppliers: supplierCount, designSchemes: designSchemeCount, quotations: quotationCount, inspectionTasks: inspectionTaskCount, complaints: complaintCount, materials: materialCount, orders: orderCount },
        projectsByStatus,
        recentProjects,
        recentComplaints
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取仪表盘数据失败' });
  }
});

router.get('/city-price-indices', (req: AuthenticatedRequest, res) => {
  try {
    const indices = db.prepare('SELECT * FROM city_price_indices ORDER BY year DESC, month DESC').all() as any[];
    res.json({ success: true, data: mapCityIndices(indices) });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取城市价格指数失败' });
  }
});

router.post('/city-price-indices', (req: AuthenticatedRequest, res) => {
  try {
    const { city, year, month, labor_index, material_index, overall_index, index_value } = req.body;
    const parsed = parseMonthInput(month, year, month);
    const value = Number(index_value ?? overall_index ?? 0);
    if (!city || !year || !month) {
      if (!city || !parsed.year || !parsed.month) {
        return res.status(400).json({ success: false, error: '城市和月份不能为空' });
      }
    }

    const result = db.prepare(
      `INSERT INTO city_price_indices (city, year, month, labor_index, material_index, overall_index)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(city, parsed.year, parsed.month, labor_index ?? value, material_index ?? value, overall_index ?? value);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建城市价格指数失败' });
  }
});

function updateCityPriceIndex(req: AuthenticatedRequest, res: any) {
  try {
    const { city, year, month, labor_index, material_index, overall_index, index_value } = req.body;

    const index = db.prepare('SELECT * FROM city_price_indices WHERE id = ?').get(req.params.id) as any;
    if (!index) {
      return res.status(404).json({ success: false, error: '价格指数记录不存在' });
    }

    const parsed = parseMonthInput(month, year ?? index.year, index.month);
    const value = Number(index_value ?? overall_index ?? index.overall_index ?? cityIndexValue(index));

    db.prepare(
      `UPDATE city_price_indices SET city = ?, year = ?, month = ?, labor_index = ?, material_index = ?, overall_index = ? WHERE id = ?`
    ).run(
      city ?? index.city,
      parsed.year,
      parsed.month,
      labor_index ?? value,
      material_index ?? value,
      overall_index ?? value,
      req.params.id
    );

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新城市价格指数失败' });
  }
}

router.put('/city-price-indices/:id', updateCityPriceIndex);
router.patch('/city-price-indices/:id', updateCityPriceIndex);

router.delete('/city-price-indices/:id', (req: AuthenticatedRequest, res) => {
  try {
    const index = db.prepare('SELECT * FROM city_price_indices WHERE id = ?').get(req.params.id);
    if (!index) {
      return res.status(404).json({ success: false, error: '价格指数记录不存在' });
    }

    db.prepare('DELETE FROM city_price_indices WHERE id = ?').run(req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除城市价格指数失败' });
  }
});

router.get('/designer-heatmap', (req: AuthenticatedRequest, res) => {
  try {
    const designers = db.prepare(
      `SELECT d.id, d.specialties, d.availability, d.rating, d.experience_years, u.name,
       (SELECT COUNT(*) FROM design_schemes WHERE designer_id = d.user_id) as scheme_count,
       (SELECT COUNT(*) FROM projects WHERE designer_id = d.user_id AND status IN ('planning', 'in_progress')) as active_projects
       FROM designers d
       JOIN users u ON d.user_id = u.id`
    ).all();

    const heatmap = designers.map((d: any) => {
      const load = d.active_projects >= 3 ? 'high' : d.active_projects >= 1 ? 'medium' : 'low';
      return {
      id: d.id,
      name: d.name,
      specialties: parseSpecialties(d.specialties),
      availability: d.availability,
      rating: d.rating,
      experience_years: d.experience_years,
      active_projects: d.active_projects,
      load,
      experienceYears: d.experience_years,
      schemeCount: d.scheme_count,
      activeProjects: d.active_projects,
      loadLevel: load,
    };
    });

    res.json({ success: true, data: heatmap });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取设计师热力图失败' });
  }
});

router.get('/complaints', (req: AuthenticatedRequest, res) => {
  try {
    const complaints = db.prepare(
      `SELECT c.*, p.title as project_title
       FROM complaints c
       LEFT JOIN projects p ON c.project_id = p.id
       ORDER BY c.created_at DESC`
    ).all();
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取投诉列表失败' });
  }
});

router.get('/complaint-analysis', (req: AuthenticatedRequest, res) => {
  try {
    const byCategory = db.prepare(
      'SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC'
    ).all();

    const byProject = db.prepare(
      `SELECT p.id, p.title, COUNT(c.id) as complaint_count
       FROM projects p
       JOIN complaints c ON p.id = c.project_id
       GROUP BY p.id ORDER BY complaint_count DESC LIMIT 10`
    ).all();

    const byRootCause = db.prepare(
      "SELECT root_cause, COUNT(*) as count FROM complaints WHERE root_cause IS NOT NULL GROUP BY root_cause ORDER BY count DESC"
    ).all();

    const byStatus = db.prepare(
      'SELECT status, COUNT(*) as count FROM complaints GROUP BY status'
    ).all();

    res.json({
      success: true,
      data: { byCategory, byProject, byRootCause, byStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取投诉分析失败' });
  }
});

router.get('/transactions', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const projectId = req.query.projectId as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (type) {
      conditions.push('t.type = ?');
      params.push(type);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (projectId) {
      conditions.push('t.project_id = ?');
      params.push(projectId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM transactions t ${whereClause}`).get(...params) as any).count;
    const transactions = db.prepare(
      `SELECT t.*,
       fu.name as from_user_name,
       tu.name as to_user_name,
       p.title as project_title
       FROM transactions t
       LEFT JOIN users fu ON t.from_user_id = fu.id
       LEFT JOIN users tu ON t.to_user_id = tu.id
       LEFT JOIN projects p ON t.project_id = p.id
       ${whereClause}
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: transactions, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取交易记录失败' });
  }
});

router.post('/transactions', (req: AuthenticatedRequest, res) => {
  try {
    const { project_id, from_user_id, to_user_id, amount, type, description } = req.body;
    if (!amount || !type) {
      return res.status(400).json({ success: false, error: '金额和类型不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO transactions (project_id, from_user_id, to_user_id, amount, type, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(project_id || null, from_user_id || null, to_user_id || null, amount, type, description || null);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建交易记录失败' });
  }
});

router.get('/reconciliation', (req: AuthenticatedRequest, res) => {
  try {
    const depositTotal = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'deposit' AND status = 'completed'").get() as any).total;
    const paymentTotal = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'payment' AND status = 'completed'").get() as any).total;
    const refundTotal = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'refund' AND status = 'completed'").get() as any).total;
    const fineTotal = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'fine' AND status = 'completed'").get() as any).total;

    const pendingCount = (db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'pending'").get() as any).count;
    const failedCount = (db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'failed'").get() as any).count;

    const netFlow = depositTotal + fineTotal - paymentTotal - refundTotal;

    res.json({
      success: true,
      data: {
        total_deposits: depositTotal,
        total_payments: paymentTotal,
        total_refunds: refundTotal,
        total_fines: fineTotal,
        net_flow: netFlow,
        pending_count: pendingCount,
        failed_count: failedCount,
        transactions: db.prepare(
          `SELECT t.*, p.title as project_title
           FROM transactions t
           LEFT JOIN projects p ON t.project_id = p.id
           ORDER BY t.created_at DESC LIMIT 50`
        ).all(),
        depositTotal,
        paymentTotal,
        refundTotal,
        fineTotal,
        netFlow,
        pendingCount,
        failedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取对账数据失败' });
  }
});

export default router;
