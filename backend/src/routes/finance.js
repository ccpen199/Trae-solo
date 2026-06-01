const express = require('express');
const router = express.Router();
const moment = require('moment');
const db = require('../database');
const logger = require('../utils/logger');
const { success, error, pagination } = require('../utils/response');

router.get('/allocations', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      period,
      group_by = 'project',
      department,
      product_line
    } = req.query;

    const currentPeriod = period || moment().format('YYYY-MM');
    const offset = (page - 1) * pageSize;
    const conditions = ['ca.period = ?'];
    const params = [currentPeriod];

    if (department) {
      conditions.push('ca.department LIKE ?');
      params.push(`%${department}%`);
    }
    if (product_line) {
      conditions.push('ca.product_line LIKE ?');
      params.push(`%${product_line}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    let groupField, selectFields, joinClause;
    switch (group_by) {
      case 'department':
        groupField = 'ca.department';
        selectFields = `
          ca.department,
          IFNULL(SUM(ca.total_cost), 0) as total_cost,
          IFNULL(SUM(ca.compute_cost), 0) as compute_cost,
          IFNULL(SUM(ca.storage_cost), 0) as storage_cost,
          IFNULL(SUM(ca.network_cost), 0) as network_cost,
          IFNULL(SUM(ca.database_cost), 0) as database_cost,
          IFNULL(SUM(ca.other_cost), 0) as other_cost,
          COUNT(DISTINCT ca.project_id) as project_count
        `;
        joinClause = '';
        break;
      case 'product_line':
        groupField = 'ca.department, ca.product_line';
        selectFields = `
          ca.department,
          ca.product_line,
          IFNULL(SUM(ca.total_cost), 0) as total_cost,
          IFNULL(SUM(ca.compute_cost), 0) as compute_cost,
          IFNULL(SUM(ca.storage_cost), 0) as storage_cost,
          IFNULL(SUM(ca.network_cost), 0) as network_cost,
          IFNULL(SUM(ca.database_cost), 0) as database_cost,
          IFNULL(SUM(ca.other_cost), 0) as other_cost,
          COUNT(DISTINCT ca.project_id) as project_count
        `;
        joinClause = '';
        break;
      case 'project':
      default:
        groupField = 'ca.id';
        selectFields = `
          ca.*,
          p.project_name,
          p.project_code,
          p.owner
        `;
        joinClause = 'LEFT JOIN projects p ON ca.project_id = p.id';
    }

    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT ${groupField}
        FROM cost_allocations ca
        ${joinClause}
        ${whereClause}
        GROUP BY ${groupField}
      ) t
    `;

    const dataSql = `
      SELECT ${selectFields}
      FROM cost_allocations ca
      ${joinClause}
      ${whereClause}
      GROUP BY ${groupField}
      ORDER BY total_cost DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    const result = list.map(item => ({
      ...item,
      total_cost: Math.round(item.total_cost),
      compute_cost: Math.round(item.compute_cost),
      storage_cost: Math.round(item.storage_cost),
      network_cost: Math.round(item.network_cost),
      database_cost: Math.round(item.database_cost),
      other_cost: Math.round(item.other_cost)
    }));

    logger.info('查询费用分摊列表', { period: currentPeriod, group_by, count: result.length });
    res.json(success(pagination(result, total, page, pageSize)));
  } catch (err) {
    logger.error('查询费用分摊列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/allocations/export', (req, res) => {
  try {
    const { period } = req.query;
    const currentPeriod = period || moment().format('YYYY-MM');

    const sql = `
      SELECT
        ca.period,
        ca.department,
        ca.product_line,
        p.project_code,
        p.project_name,
        p.owner,
        ca.total_cost,
        ca.compute_cost,
        ca.storage_cost,
        ca.network_cost,
        ca.database_cost,
        ca.other_cost,
        b.budget_amount,
        ROUND(ca.total_cost / b.budget_amount * 100, 2) as budget_usage_rate
      FROM cost_allocations ca
      LEFT JOIN projects p ON ca.project_id = p.id
      LEFT JOIN budgets b ON ca.project_id = b.project_id AND ca.period = b.period
      WHERE ca.period = ?
      ORDER BY ca.department, ca.product_line, ca.total_cost DESC
    `;

    const data = db.prepare(sql).all(currentPeriod);

    const exportData = {
      period: currentPeriod,
      export_time: new Date().toISOString(),
      total_count: data.length,
      total_cost: Math.round(data.reduce((sum, item) => sum + item.total_cost, 0)),
      records: data.map(item => ({
        ...item,
        total_cost: Math.round(item.total_cost),
        compute_cost: Math.round(item.compute_cost),
        storage_cost: Math.round(item.storage_cost),
        network_cost: Math.round(item.network_cost),
        database_cost: Math.round(item.database_cost),
        other_cost: Math.round(item.other_cost),
        budget_amount: Math.round(item.budget_amount || 0)
      }))
    };

    const headers = [
      '部门', '产品线', '项目编码', '项目名称', '项目负责人',
      '总费用', '计算费用', '存储费用', '网络费用', '数据库费用', '其他费用',
      '预算金额', '预算使用率(%)'
    ];

    const csvContent = [
      headers.join(','),
      ...exportData.records.map(row => [
        `"${row.department || ''}"`,
        `"${row.product_line || ''}"`,
        `"${row.project_code || ''}"`,
        `"${row.project_name || ''}"`,
        `"${row.owner || ''}"`,
        row.total_cost,
        row.compute_cost,
        row.storage_cost,
        row.network_cost,
        row.database_cost,
        row.other_cost,
        row.budget_amount,
        row.budget_usage_rate || 0
      ].join(','))
    ].join('\n');

    exportData.csv_content = csvContent;

    logger.info('导出月度对账数据', { period: currentPeriod, count: data.length });
    res.json(success(exportData));
  } catch (err) {
    logger.error('导出月度对账数据失败', err);
    res.json(error(err.message));
  }
});

router.get('/budgets', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      period,
      department,
      product_line,
      warning_only
    } = req.query;

    const currentPeriod = period || moment().format('YYYY-MM');
    const offset = (page - 1) * pageSize;
    const conditions = ['b.period = ?'];
    const params = [currentPeriod];

    if (department) {
      conditions.push('b.department LIKE ?');
      params.push(`%${department}%`);
    }
    if (product_line) {
      conditions.push('b.product_line LIKE ?');
      params.push(`%${product_line}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const havingClause = warning_only === '1' || warning_only === 'true'
      ? 'HAVING actual_cost > b.budget_amount * b.warning_threshold / 100'
      : '';

    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT b.id
        FROM budgets b
        LEFT JOIN projects p ON b.project_id = p.id
        LEFT JOIN (
          SELECT project_id, IFNULL(SUM(cost), 0) as actual_cost
          FROM bills
          WHERE strftime('%Y-%m', bill_date) = ?
          GROUP BY project_id
        ) ba ON b.project_id = ba.project_id
        ${whereClause}
        ${havingClause}
      ) t
    `;

    const dataSql = `
      SELECT
        b.*,
        p.project_name,
        p.project_code,
        p.owner,
        IFNULL(ba.actual_cost, 0) as actual_cost,
        ROUND(IFNULL(ba.actual_cost, 0) / b.budget_amount * 100, 2) as usage_rate,
        CASE
          WHEN IFNULL(ba.actual_cost, 0) > b.budget_amount THEN 'over'
          WHEN IFNULL(ba.actual_cost, 0) > b.budget_amount * b.warning_threshold / 100 THEN 'warning'
          ELSE 'normal'
        END as status
      FROM budgets b
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN (
        SELECT project_id, IFNULL(SUM(cost), 0) as actual_cost
        FROM bills
        WHERE strftime('%Y-%m', bill_date) = ?
        GROUP BY project_id
      ) ba ON b.project_id = ba.project_id
      ${whereClause}
      ${havingClause}
      ORDER BY
        CASE status
          WHEN 'over' THEN 1
          WHEN 'warning' THEN 2
          ELSE 3
        END ASC,
        usage_rate DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [currentPeriod, ...params];
    const dataParams = [currentPeriod, ...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    const result = list.map(item => ({
      ...item,
      budget_amount: Math.round(item.budget_amount),
      actual_cost: Math.round(item.actual_cost),
      remaining_budget: Math.max(0, Math.round(item.budget_amount - item.actual_cost)),
      usage_rate: parseFloat(item.usage_rate)
    }));

    const summary = db.prepare(`
      SELECT
        IFNULL(SUM(b.budget_amount), 0) as total_budget,
        IFNULL(SUM(ba.actual_cost), 0) as total_actual
      FROM budgets b
      LEFT JOIN (
        SELECT project_id, IFNULL(SUM(cost), 0) as actual_cost
        FROM bills
        WHERE strftime('%Y-%m', bill_date) = ?
        GROUP BY project_id
      ) ba ON b.project_id = ba.project_id
      WHERE b.period = ?
    `).get(currentPeriod, currentPeriod);

    const warningCount = result.filter(r => r.status === 'warning' || r.status === 'over').length;

    logger.info('查询预算列表', { period: currentPeriod, count: result.length, total });
    res.json(success({
      ...pagination(result, total, page, pageSize),
      summary: {
        total_budget: Math.round(summary.total_budget),
        total_actual: Math.round(summary.total_actual),
        total_usage_rate: summary.total_budget > 0
          ? parseFloat(((summary.total_actual / summary.total_budget) * 100).toFixed(2))
          : 0,
        warning_count: warningCount
      }
    }));
  } catch (err) {
    logger.error('查询预算列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/report', (req, res) => {
  try {
    const { period } = req.query;
    const currentPeriod = period || moment().format('YYYY-MM');
    const [year, month] = currentPeriod.split('-');

    const startDate = `${year}-${month}-01`;
    const endDate = moment(currentPeriod).endOf('month').format('YYYY-MM-DD');

    const prevPeriod = moment(currentPeriod).subtract(1, 'month').format('YYYY-MM');
    const prevStartDate = moment(prevPeriod).startOf('month').format('YYYY-MM-DD');
    const prevEndDate = moment(prevPeriod).endOf('month').format('YYYY-MM-DD');

    const currentCost = db.prepare(`
      SELECT IFNULL(SUM(cost), 0) as total FROM bills WHERE bill_date BETWEEN ? AND ?
    `).get(startDate, endDate).total;

    const prevCost = db.prepare(`
      SELECT IFNULL(SUM(cost), 0) as total FROM bills WHERE bill_date BETWEEN ? AND ?
    `).get(prevStartDate, prevEndDate).total;

    const byDepartment = db.prepare(`
      SELECT
        ca.department,
        IFNULL(SUM(ca.total_cost), 0) as total_cost
      FROM cost_allocations ca
      WHERE ca.period = ?
      GROUP BY ca.department
      ORDER BY total_cost DESC
    `).all(currentPeriod).map(item => ({
      department: item.department || '未分配',
      total_cost: Math.round(item.total_cost)
    }));

    const byProduct = db.prepare(`
      SELECT
        b.product,
        IFNULL(SUM(b.cost), 0) as total_cost
      FROM bills b
      WHERE b.bill_date BETWEEN ? AND ?
      GROUP BY b.product
      ORDER BY total_cost DESC
      LIMIT 10
    `).all(startDate, endDate).map(item => ({
      product: item.product,
      total_cost: Math.round(item.total_cost)
    }));

    const byProject = db.prepare(`
      SELECT
        p.project_name,
        p.project_code,
        IFNULL(SUM(b.cost), 0) as total_cost
      FROM bills b
      LEFT JOIN projects p ON b.project_id = p.id
      WHERE b.bill_date BETWEEN ? AND ?
      GROUP BY b.project_id
      ORDER BY total_cost DESC
      LIMIT 10
    `).all(startDate, endDate).map(item => ({
      project_name: item.project_name || '未分配',
      project_code: item.project_code || '-',
      total_cost: Math.round(item.total_cost)
    }));

    const dailyTrend = db.prepare(`
      SELECT
        bill_date,
        IFNULL(SUM(cost), 0) as total_cost
      FROM bills
      WHERE bill_date BETWEEN ? AND ?
      GROUP BY bill_date
      ORDER BY bill_date ASC
    `).all(startDate, endDate).map(item => ({
      date: item.bill_date,
      total_cost: Math.round(item.total_cost)
    }));

    const savingStats = db.prepare(`
      SELECT
        IFNULL(SUM(actual_saving), 0) as total_saving,
        COUNT(*) as completed_orders
      FROM work_orders
      WHERE status = 'completed'
        AND strftime('%Y-%m', completion_time) = ?
    `).get(currentPeriod);

    const resourceSummary = db.prepare(`
      SELECT
        COUNT(*) as total_resources,
        SUM(CASE WHEN is_assigned = 1 THEN 1 ELSE 0 END) as assigned_resources
      FROM resources
    `).get();

    const report = {
      period: currentPeriod,
      generated_at: new Date().toISOString(),
      summary: {
        current_cost: Math.round(currentCost),
        prev_cost: Math.round(prevCost),
        mom_change: prevCost > 0
          ? parseFloat((((currentCost - prevCost) / prevCost) * 100).toFixed(2))
          : currentCost > 0 ? 100 : 0,
        total_saving: Math.round(savingStats.total_saving),
        completed_work_orders: savingStats.completed_orders,
        total_resources: resourceSummary.total_resources,
        assigned_resources: resourceSummary.assigned_resources
      },
      by_department: byDepartment,
      by_product: byProduct,
      by_project: byProject,
      daily_trend: dailyTrend
    };

    logger.info('生成财务报表', { period: currentPeriod });
    res.json(success(report));
  } catch (err) {
    logger.error('生成财务报表失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
