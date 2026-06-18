import { Router } from 'express';
import { db } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware';

const router = Router();
const allowAdminAccess = roleMiddleware('admin', 'store_manager');

router.get('/dashboard/stats', authMiddleware, allowAdminAccess, (_req, res) => {
  const demandCount = db.prepare('SELECT COUNT(*) as count FROM decoration_demands').get() as { count: number };
  const contractCount = db.prepare('SELECT COUNT(*) as count FROM decoration_contracts').get() as { count: number };
  const todoCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM work_orders
    WHERE status IN ('pending', 'processing')
  `).get() as { count: number };
  const riskCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM ai_supervision_records
    WHERE status IN ('detected', 'processing')
  `).get() as { count: number };

  res.json({
    demandCount: demandCount.count,
    contractCount: contractCount.count,
    todoCount: todoCount.count,
    riskCount: riskCount.count,
  });
});

router.get('/dashboard/progress', authMiddleware, allowAdminAccess, (_req, res) => {
  const rows = db.prepare(`
    SELECT
      c.id,
      COALESCE(d.address, c.contract_no) as name,
      c.status,
      c.created_at as updateTime,
      COALESCE(u.real_name, '系统') as operator,
      COUNT(m.id) as milestone_count,
      SUM(CASE WHEN m.status = 'confirmed' THEN 1 ELSE 0 END) as completed_count
    FROM decoration_contracts c
    LEFT JOIN decoration_demands d ON c.demand_id = d.id
    LEFT JOIN users u ON c.designer_id = u.id
    LEFT JOIN project_milestones m ON c.id = m.contract_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 8
  `).all() as any[];

  const progress = rows.map((row) => ({
    id: row.id,
    name: row.name || row.id,
    status: row.status === 'signed' ? '进行中' : row.status,
    progress: row.milestone_count > 0
      ? Math.round((Number(row.completed_count || 0) / Number(row.milestone_count)) * 100)
      : 30,
    updateTime: row.updateTime,
    operator: row.operator,
  }));

  res.json(progress);
});

router.get('/dashboard', authMiddleware, allowAdminAccess, (req, res) => {
  const totalDemands = db.prepare('SELECT COUNT(*) as count FROM decoration_demands').get() as { count: number };
  const totalContracts = db.prepare('SELECT COUNT(*) as count FROM decoration_contracts').get() as { count: number };
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_records WHERE status = 'completed'").get() as { total: number };
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get() as { count: number };

  const demandsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM decoration_demands
    GROUP BY status
  `).all();

  const contractsByMonth = db.prepare(`
    SELECT
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count,
      SUM(total_amount) as amount
    FROM decoration_contracts
    WHERE created_at >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month
  `).all();

  const bomAnalysis = db.prepare(`
    SELECT
      b.material_name,
      SUM(b.quantity) as total_qty,
      SUM(b.total_price) as total_cost,
      COUNT(DISTINCT b.contract_id) as contract_count,
      u.real_name as supplier_name
    FROM material_bom b
    LEFT JOIN users u ON b.supplier_id = u.id
    GROUP BY b.material_name, b.supplier_id
    ORDER BY total_cost DESC
    LIMIT 20
  `).all();

  const performance = db.prepare(`
    SELECT
      u.real_name,
      u.role,
      COUNT(DISTINCT c.id) as contract_count,
      SUM(c.total_amount) as total_amount
    FROM users u
    LEFT JOIN decoration_contracts c ON (u.role = 'designer' AND c.designer_id = u.id) OR (u.role = 'store_manager' AND c.store_id = u.id)
    WHERE u.status = 'active' AND u.role IN ('designer', 'store_manager')
    GROUP BY u.id
    ORDER BY contract_count DESC
    LIMIT 10
  `).all();

  const warrantyTracking = db.prepare(`
    SELECT
      c.id,
      c.contract_no,
      c.total_amount,
      c.warranty_years,
      c.end_date,
      date(c.end_date, '+' || c.warranty_years || ' years') as warranty_expire,
      julianday(date(c.end_date, '+' || c.warranty_years || ' years')) - julianday('now') as days_remaining,
      o.real_name as owner_name,
      o.phone as owner_phone
    FROM decoration_contracts c
    LEFT JOIN users o ON c.owner_id = o.id
    WHERE c.status = 'signed'
    ORDER BY days_remaining ASC
    LIMIT 10
  `).all();

  res.json({
    overview: {
      total_demands: totalDemands.count,
      total_contracts: totalContracts.count,
      total_revenue: totalRevenue.total,
      total_users: totalUsers.count,
    },
    demands_by_status: demandsByStatus,
    contracts_by_month: contractsByMonth,
    bom_analysis: bomAnalysis,
    performance: performance,
    warranty_tracking: warrantyTracking,
  });
});

router.get('/contracts/tracking', authMiddleware, allowAdminAccess, (req, res) => {
  const { status } = req.query;
  let filter = '';
  const params: any[] = [];

  if (status) {
    filter = ' WHERE c.status = ?';
    params.push(status);
  }

  const contracts = db.prepare(`
    SELECT
      c.id,
      c.contract_no,
      c.total_amount,
      c.status,
      c.start_date,
      c.end_date,
      c.warranty_years,
      o.real_name as owner_name,
      o.phone as owner_phone,
      d.real_name as designer_name,
      s.name as store_name,
      COUNT(m.id) as milestone_count,
      SUM(CASE WHEN m.status = 'confirmed' THEN 1 ELSE 0 END) as completed_milestones,
      COALESCE(SUM(p.amount), 0) as paid_amount
    FROM decoration_contracts c
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN users d ON c.designer_id = d.id
    LEFT JOIN stores s ON c.store_id = s.id
    LEFT JOIN project_milestones m ON c.id = m.contract_id
    LEFT JOIN payment_records p ON c.id = p.contract_id AND p.status = 'completed'
    ${filter}
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(...params);

  res.json(contracts);
});

router.get('/bom/cost-analysis', authMiddleware, allowAdminAccess, (req, res) => {
  const { contract_id } = req.query;
  let filter = '';
  const params: any[] = [];

  if (contract_id) {
    filter = ' WHERE b.contract_id = ?';
    params.push(contract_id);
  }

  const costBreakdown = db.prepare(`
    SELECT
      b.contract_id,
      c.contract_no,
      b.material_name,
      b.specification,
      b.quantity,
      b.unit,
      b.unit_price,
      b.total_price,
      b.status,
      u.real_name as supplier_name,
      c.total_amount as contract_total,
      (b.total_price / c.total_amount * 100) as cost_percentage
    FROM material_bom b
    LEFT JOIN decoration_contracts c ON b.contract_id = c.id
    LEFT JOIN users u ON b.supplier_id = u.id
    ${filter}
    ORDER BY b.total_price DESC
  `).all(...params);

  const summary = db.prepare(`
    SELECT
      COUNT(DISTINCT b.contract_id) as contract_count,
      COUNT(*) as material_items,
      SUM(b.total_price) as total_material_cost,
      AVG(b.total_price / c.total_amount * 100) as avg_material_ratio
    FROM material_bom b
    LEFT JOIN decoration_contracts c ON b.contract_id = c.id
    ${filter}
  `).get(...params);

  res.json({
    summary,
    cost_breakdown: costBreakdown,
  });
});

router.get('/warranty/list', authMiddleware, allowAdminAccess, (req, res) => {
  const { expiring_soon } = req.query;
  let having = '';
  const params: any[] = [];

  if (expiring_soon === 'true') {
    having = ' HAVING days_remaining < 365';
  }

  const warranties = db.prepare(`
    SELECT
      c.id,
      c.contract_no,
      c.total_amount,
      c.end_date,
      c.warranty_years,
      date(c.end_date, '+' || c.warranty_years || ' years') as warranty_expire,
      julianday(date(c.end_date, '+' || c.warranty_years || ' years')) - julianday('now') as days_remaining,
      o.real_name as owner_name,
      o.phone as owner_phone,
      s.name as store_name,
      COUNT(w.id) as open_work_orders
    FROM decoration_contracts c
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN stores s ON c.store_id = s.id
    LEFT JOIN work_orders w ON c.id = w.contract_id AND w.status IN ('pending', 'processing')
    WHERE c.status = 'signed'
    GROUP BY c.id
    ${having}
    ORDER BY days_remaining ASC
  `).all(...params);

  res.json(warranties);
});

router.get('/users', authMiddleware, allowAdminAccess, (req, res) => {
  const { role, status } = req.query;
  let query = `
    SELECT u.*, s.name as store_name
    FROM users u
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role) {
    query += ' AND u.role = ?';
    params.push(role);
  }
  if (status) {
    query += ' AND u.status = ?';
    params.push(status);
  }

  query += ' ORDER BY u.created_at DESC';
  const users = db.prepare(query).all(...params);

  const usersWithoutPassword = users.map(u => {
    const { password_hash, ...rest } = u as any;
    return rest;
  });

  res.json(usersWithoutPassword);
});

router.get('/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: (err as Error).message,
    });
  }
});

export default router;
