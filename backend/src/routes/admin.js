const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../utils/logger');
const { success, error, pagination } = require('../utils/response');

router.get('/projects', (req, res) => {
  try {
    const { page = 1, pageSize = 50, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(project_name LIKE ? OR project_code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
    const dataSql = `
      SELECT p.*, 
             (SELECT IFNULL(SUM(cost), 0) FROM bills b WHERE b.project_id = p.id) as current_cost,
             (SELECT IFNULL(SUM(budget_amount), 0) FROM budgets b WHERE b.project_id = p.id) as budget_amount
      FROM projects p
      ${whereClause}
      ORDER BY p.id ASC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    logger.info('查询项目列表', { count: list.length, total });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询项目列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/projects/:id', (req, res) => {
  try {
    const { id } = req.params;

    const project = db.prepare(`
      SELECT p.*, 
             (SELECT IFNULL(SUM(cost), 0) FROM bills b WHERE b.project_id = p.id) as current_cost,
             (SELECT IFNULL(SUM(budget_amount), 0) FROM budgets b WHERE b.project_id = p.id) as budget_amount
      FROM projects p
      WHERE p.id = ?
    `).get(id);

    if (!project) {
      return res.json(error('项目不存在', 404));
    }

    logger.info('查询项目详情', { id });
    res.json(success(project));
  } catch (err) {
    logger.error('查询项目详情失败', err);
    res.json(error(err.message));
  }
});

router.post('/projects', (req, res) => {
  try {
    const { project_code, project_name, department, product_line, owner, budget_monthly } = req.body;

    if (!project_code || !project_name) {
      return res.json(error('项目编码和名称不能为空'));
    }

    const existing = db.prepare('SELECT id FROM projects WHERE project_code = ?').get(project_code);
    if (existing) {
      return res.json(error('项目编码已存在'));
    }

    const insertStmt = db.prepare(`
      INSERT INTO projects (project_code, project_name, department, product_line, owner, budget_monthly)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(project_code, project_name, department || '', product_line || '', owner || '', budget_monthly || 0);

    if (budget_monthly) {
      const period = new Date().toISOString().slice(0, 7);
      const insertBudget = db.prepare(`
        INSERT OR REPLACE INTO budgets (period, department, product_line, project_id, budget_amount, warning_threshold)
        VALUES (?, ?, ?, ?, ?, 80)
      `);
      insertBudget.run(period, department || '', product_line || '', result.lastInsertRowid, budget_monthly);
    }

    logger.info('创建项目成功', { id: result.lastInsertRowid, project_code });
    res.json(success({ id: result.lastInsertRowid }, '创建成功'));
  } catch (err) {
    logger.error('创建项目失败', err);
    res.json(error(err.message));
  }
});

router.put('/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, department, product_line, owner, budget_monthly } = req.body;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.json(error('项目不存在', 404));
    }

    const updateStmt = db.prepare(`
      UPDATE projects 
      SET project_name = COALESCE(?, project_name),
          department = COALESCE(?, department),
          product_line = COALESCE(?, product_line),
          owner = COALESCE(?, owner),
          budget_monthly = COALESCE(?, budget_monthly)
      WHERE id = ?
    `);

    updateStmt.run(project_name, department, product_line, owner, budget_monthly, id);

    if (budget_monthly !== undefined) {
      const period = new Date().toISOString().slice(0, 7);
      const insertBudget = db.prepare(`
        INSERT OR REPLACE INTO budgets (period, department, product_line, project_id, budget_amount, warning_threshold)
        VALUES (?, ?, ?, ?, ?, 80)
      `);
      insertBudget.run(period, department || project.department, product_line || project.product_line, id, budget_monthly);
    }

    logger.info('更新项目成功', { id });
    res.json(success(null, '更新成功'));
  } catch (err) {
    logger.error('更新项目失败', err);
    res.json(error(err.message));
  }
});

router.get('/accounts', (req, res) => {
  try {
    const { page = 1, pageSize = 50, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(account_name LIKE ? OR account_id LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM cloud_accounts ${whereClause}`;
    const dataSql = `
      SELECT ca.*, 
             (SELECT COUNT(*) FROM resources r WHERE r.account_id = ca.account_id) as resource_count,
             (SELECT IFNULL(SUM(cost), 0) FROM bills b WHERE b.account_id = ca.account_id) as total_cost
      FROM cloud_accounts ca
      ${whereClause}
      ORDER BY ca.id ASC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    logger.info('查询账号列表', { count: list.length, total });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询账号列表失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
