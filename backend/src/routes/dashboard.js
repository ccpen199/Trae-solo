const express = require('express');
const router = express.Router();
const moment = require('moment');
const db = require('../database');
const logger = require('../utils/logger');
const { success, error } = require('../utils/response');

router.get('/summary', (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = moment();
    const currentPeriod = now.format('YYYY-MM');

    const currentStart = period === 'month'
      ? now.clone().startOf('month').format('YYYY-MM-DD')
      : now.clone().startOf('week').format('YYYY-MM-DD');
    const currentEnd = now.format('YYYY-MM-DD');

    const prevStart = period === 'month'
      ? now.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
      : now.clone().subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
    const prevEnd = period === 'month'
      ? now.clone().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
      : now.clone().subtract(1, 'week').endOf('week').format('YYYY-MM-DD');

    const currentCost = db.prepare(`
      SELECT IFNULL(SUM(cost), 0) as total FROM bills
      WHERE bill_date BETWEEN ? AND ?
    `).get(currentStart, currentEnd).total;

    const prevCost = db.prepare(`
      SELECT IFNULL(SUM(cost), 0) as total FROM bills
      WHERE bill_date BETWEEN ? AND ?
    `).get(prevStart, prevEnd).total;

    const momChange = prevCost > 0
      ? ((currentCost - prevCost) / prevCost * 100).toFixed(2)
      : currentCost > 0 ? 100 : 0;

    const budgetResult = db.prepare(`
      SELECT IFNULL(SUM(budget_amount), 0) as total_budget
      FROM budgets
      WHERE period = ?
    `).get(currentPeriod);

    const totalBudget = budgetResult.total_budget || 0;
    const budgetUsage = totalBudget > 0 ? (currentCost / totalBudget * 100).toFixed(2) : 0;
    const budgetRemaining = Math.max(0, totalBudget - currentCost);

    const resourceStats = db.prepare(`
      SELECT
        COUNT(*) as total_resources,
        SUM(CASE WHEN is_assigned = 1 THEN 1 ELSE 0 END) as assigned_resources,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_resources
      FROM resources
    `).get();

    const suggestionStats = db.prepare(`
      SELECT
        COUNT(*) as total_suggestions,
        IFNULL(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_suggestions,
        IFNULL(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_suggestions,
        IFNULL(SUM(estimated_saving_monthly), 0) as total_potential_saving
      FROM optimization_suggestions
    `).get();

    const anomalySql = `
      SELECT
        b.product,
        b.region,
        SUM(b.cost) as current_cost,
        (
          SELECT IFNULL(SUM(cost), 0) FROM bills b2
          WHERE b2.product = b.product
            AND b2.region = b.region
            AND b2.bill_date BETWEEN ? AND ?
        ) as prev_cost
      FROM bills b
      WHERE b.bill_date BETWEEN ? AND ?
      GROUP BY b.product, b.region
      HAVING current_cost > prev_cost * 1.3
      ORDER BY (current_cost - prev_cost) DESC
      LIMIT 10
    `;

    const anomalies = db.prepare(anomalySql).all(
      prevStart, prevEnd,
      currentStart, currentEnd
    ).map(item => ({
      ...item,
      growth_rate: item.prev_cost > 0
        ? ((item.current_cost - item.prev_cost) / item.prev_cost * 100).toFixed(2)
        : 100
    }));

    const summary = {
      total_budget: Math.round(totalBudget),
      actual_cost: Math.round(currentCost),
      budget_usage: parseFloat(budgetUsage),
      budget_remaining: Math.round(budgetRemaining),
      mom_change: parseFloat(momChange),
      prev_cost: Math.round(prevCost),
      resource_stats: {
        total: resourceStats.total_resources,
        assigned: resourceStats.assigned_resources,
        running: resourceStats.running_resources,
        unassigned: resourceStats.total_resources - resourceStats.assigned_resources
      },
      suggestion_stats: {
        total: suggestionStats.total_suggestions,
        pending: suggestionStats.pending_suggestions,
        in_progress: suggestionStats.in_progress_suggestions,
        total_potential_saving: Math.round(suggestionStats.total_potential_saving)
      },
      anomaly_growths: anomalies.map(a => ({
        product: a.product,
        region: a.region,
        current_cost: Math.round(a.current_cost),
        prev_cost: Math.round(a.prev_cost),
        growth_rate: parseFloat(a.growth_rate)
      }))
    };

    logger.info('获取看板总览数据');
    res.json(success(summary));
  } catch (err) {
    logger.error('获取看板总览数据失败', err);
    res.json(error(err.message));
  }
});

router.get('/trend', (req, res) => {
  try {
    const { start_date, end_date, group_by = 'date' } = req.query;

    const defaultEnd = moment().format('YYYY-MM-DD');
    const defaultStart = moment().subtract(30, 'days').format('YYYY-MM-DD');

    const start = start_date || defaultStart;
    const end = end_date || defaultEnd;

    let dateFormat, groupField;
    if (group_by === 'week') {
      dateFormat = "strftime('%Y-%W', bill_date)";
      groupField = "week";
    } else if (group_by === 'month') {
      dateFormat = "strftime('%Y-%m', bill_date)";
      groupField = "month";
    } else {
      dateFormat = "bill_date";
      groupField = "date";
    }

    const sql = `
      SELECT
        ${dateFormat} as ${groupField},
        IFNULL(SUM(cost), 0) as total_cost,
        COUNT(DISTINCT resource_id) as resource_count
      FROM bills
      WHERE bill_date BETWEEN ? AND ?
      GROUP BY ${dateFormat}
      ORDER BY ${dateFormat} ASC
    `;

    const data = db.prepare(sql).all(start, end);

    const trend = data.map(item => ({
      period: item[groupField],
      total_cost: Math.round(item.total_cost),
      resource_count: item.resource_count
    }));

    logger.info('获取成本趋势', { start, end, group_by, count: trend.length });
    res.json(success(trend));
  } catch (err) {
    logger.error('获取成本趋势失败', err);
    res.json(error(err.message));
  }
});

router.get('/top-cost', (req, res) => {
  try {
    const { type = 'product', limit = 10, start_date, end_date } = req.query;

    const defaultEnd = moment().format('YYYY-MM-DD');
    const defaultStart = moment().startOf('month').format('YYYY-MM-DD');

    const start = start_date || defaultStart;
    const end = end_date || defaultEnd;

    let groupField, joinClause = '';
    switch (type) {
      case 'product':
        groupField = 'b.product';
        break;
      case 'account':
        groupField = 'b.account_id, ca.account_name';
        joinClause = 'LEFT JOIN cloud_accounts ca ON b.account_id = ca.account_id';
        break;
      case 'project':
        groupField = 'b.project_id, p.project_name, p.project_code';
        joinClause = 'LEFT JOIN projects p ON b.project_id = p.id';
        break;
      case 'region':
        groupField = 'b.region';
        break;
      case 'resource':
        groupField = 'b.resource_id, r.resource_name';
        joinClause = 'LEFT JOIN resources r ON b.resource_id = r.resource_id';
        break;
      default:
        groupField = 'b.product';
    }

    const sql = `
      SELECT
        ${groupField},
        IFNULL(SUM(b.cost), 0) as total_cost,
        COUNT(DISTINCT b.resource_id) as resource_count
      FROM bills b
      ${joinClause}
      WHERE b.bill_date BETWEEN ? AND ?
      GROUP BY ${groupField}
      ORDER BY total_cost DESC
      LIMIT ?
    `;

    const data = db.prepare(sql).all(start, end, parseInt(limit));

    const totalCost = data.reduce((sum, item) => sum + item.total_cost, 0);

    const result = data.map(item => ({
      ...item,
      total_cost: Math.round(item.total_cost),
      percentage: totalCost > 0
        ? parseFloat(((item.total_cost / totalCost) * 100).toFixed(2))
        : 0
    }));

    logger.info('获取TOP费用来源', { type, limit, count: result.length });
    res.json(success(result));
  } catch (err) {
    logger.error('获取TOP费用来源失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
