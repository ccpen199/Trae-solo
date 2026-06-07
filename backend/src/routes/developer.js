const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole('developer'), auditLog('开发商工作台', '开发商管理'), (req, res) => {
  const user = db.prepare('SELECT developer_id FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.developer_id) {
    return res.status(404).json({ error: '开发商信息不存在' });
  }

  const developer = db.prepare('SELECT * FROM developers WHERE id = ?').get(user.developer_id);
  if (!developer) {
    return res.status(404).json({ error: '开发商不存在' });
  }

  const projectStats = db.prepare(`
    SELECT
      COUNT(*) as total_projects,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects,
      SUM(CASE WHEN status = 'presale' THEN 1 ELSE 0 END) as presale_projects,
      SUM(total_units) as total_units,
      SUM(sold_units) as sold_units,
      SUM(total_units) - SUM(sold_units) as remaining_units
    FROM developer_projects
    WHERE developer_id = ?
  `).get(developer.id);

  const recentProjects = db.prepare(`
    SELECT dp.*, c.name as center_name
    FROM developer_projects dp
    LEFT JOIN centers c ON dp.center_id = c.id
    WHERE dp.developer_id = ?
    ORDER BY dp.created_at DESC
    LIMIT 5
  `).all(developer.id);

  const loanCount = db.prepare(`
    SELECT COUNT(*) as count FROM loan_details ld
    WHERE ld.developer_credit_code = ?
  `).get(developer.credit_code).count;

  const loanAmount = db.prepare(`
    SELECT COALESCE(SUM(l.amount), 0) as total
    FROM loan_details ld
    JOIN loans l ON ld.loan_id = l.id
    WHERE ld.developer_credit_code = ?
  `).get(developer.credit_code).total;

  res.json({
    total_projects: projectStats?.total_projects || 0,
    on_sale_projects: projectStats?.presale_projects || 0,
    filed_projects: projectStats?.active_projects || 0,
    projects: recentProjects.map(p => ({
      id: p.id,
      project_name: p.project_name,
      project_address: p.project_address,
      status: p.status === 'presale' ? 'on_sale' : p.status
    })),
    developer_name: developer.name,
    developer_credit_code: developer.credit_code,
    contact_name: developer.name,
    contact_phone: '-',
    developerInfo: {
      name: developer.name,
      credit_code: developer.credit_code
    },
    loanStats: {
      loanCount,
      loanAmount
    }
  });
});

router.get('/projects', authenticateToken, requireRole('developer'), auditLog('查询项目', '开发商管理'), (req, res) => {
  const user = db.prepare('SELECT developer_id FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.developer_id) {
    return res.status(404).json({ error: '开发商信息不存在' });
  }

  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT dp.*, c.name as center_name, c.province, c.city
    FROM developer_projects dp
    LEFT JOIN centers c ON dp.center_id = c.id
    WHERE dp.developer_id = ?
  `;
  const params = [user.developer_id];

  if (status) {
    query += ' AND dp.status = ?';
    params.push(status);
  }

  query += ' ORDER BY dp.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const projects = db.prepare(query).all(...params);

  const enrichedProjects = projects.map(p => {
    const loanDetailCount = db.prepare(`
      SELECT COUNT(*) as count FROM loan_details
      WHERE project_name = ?
    `).get(p.project_name).count;

    const soldRate = p.total_units > 0
      ? ((p.sold_units / p.total_units) * 100).toFixed(1)
      : 0;

    return {
      ...p,
      loan_count: loanDetailCount,
      sold_rate: parseFloat(soldRate)
    };
  });

  let countQuery = 'SELECT COUNT(*) as total FROM developer_projects WHERE developer_id = ?';
  const countParams = [user.developer_id];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    projects: enrichedProjects,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

module.exports = router;
