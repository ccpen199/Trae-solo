const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../utils/logger');
const { success, error, pagination } = require('../utils/response');

router.get('/suggestions', (req, res) => {
  try {
    const {
      page = 1, pageSize = 20, suggestion_type, risk_level, status, keyword } = req.query;

    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (suggestion_type) {
      conditions.push('s.suggestion_type = ?');
      params.push(suggestion_type);
    }
    if (risk_level) {
      conditions.push('s.risk_level = ?');
      params.push(risk_level);
    }
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(s.title LIKE ? OR s.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM optimization_suggestions s
      LEFT JOIN resources r ON s.resource_id = r.resource_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT s.*, r.resource_name, r.resource_type, r.region,
             p.project_name, p.project_code, ca.account_name
      FROM optimization_suggestions s
      LEFT JOIN resources r ON s.resource_id = r.resource_id
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      ${whereClause}
      ORDER BY
        CASE s.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END ASC,
        s.estimated_saving_monthly DESC,
        s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    logger.info('查询优化建议列表', { count: list.length, total, page, pageSize });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询优化建议列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/suggestions/:id', (req, res) => {
  try {
    const { id } = req.params;

    const suggestion = db.prepare(`
      SELECT s.*, r.resource_name, r.resource_type, r.region, r.status as resource_status,
             p.project_name, p.project_code, ca.account_name,
             rm.cpu_avg, rm.cpu_max, rm.memory_avg, rm.memory_max
      FROM optimization_suggestions s
      LEFT JOIN resources r ON s.resource_id = r.resource_id
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      LEFT JOIN resource_metrics rm ON s.resource_id = rm.resource_id
      WHERE s.id = ?
      ORDER BY rm.created_at DESC
      LIMIT 1
    `).get(id);

    if (!suggestion) {
      return res.json(error('建议不存在', 404));
    }

    const workOrder = db.prepare(`
      SELECT * FROM work_orders WHERE suggestion_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(id);

    const result = {
      ...suggestion,
      work_order: workOrder || null
    };

    logger.info('查询优化建议详情', { id });
    res.json(success(result));
  } catch (err) {
    logger.error('查询优化建议详情失败', err);
    res.json(error(err.message));
  }
});

router.post('/suggestions/:id/adopt', (req, res) => {
  try {
    const { id } = req.params;
    const { requester = 'system', maintenance_window } = req.body;

    const suggestion = db.prepare('SELECT * FROM optimization_suggestions WHERE id = ?').get(id);
    if (!suggestion) {
      return res.json(error('建议不存在', 404));
    }

    if (suggestion.status === 'completed') {
      return res.json(error('该建议已完成，无法重复采纳'));
    }

    const existingWorkOrder = db.prepare(`
      SELECT * FROM work_orders WHERE suggestion_id = ? AND status NOT IN ('completed', 'cancelled')
    `).get(id);

    if (existingWorkOrder) {
      return res.json(error('该建议已有关联工单，请先处理现有工单'));
    }

    const workOrderNo = `WO-${Date.now().toString().slice(-7)}`;

    const insertWorkOrder = db.prepare(`
      INSERT INTO work_orders (
        work_order_no, title, suggestion_id, resource_id, action_type,
        status, requester, maintenance_window, estimated_saving
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `);

    const updateSuggestion = db.prepare(`
      UPDATE optimization_suggestions
      SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertLog = db.prepare(`
      INSERT INTO work_order_logs (work_order_id, action, operator, remark)
      VALUES (?, 'create', ?, '从优化建议创建工单')
    `);

    const transaction = db.transaction(() => {
      const workOrderResult = insertWorkOrder.run(
        workOrderNo,
        suggestion.title,
        suggestion.id,
        suggestion.resource_id,
        suggestion.action,
        requester,
        maintenance_window || null,
        suggestion.estimated_saving_monthly
      );

      updateSuggestion.run(id);
      insertLog.run(workOrderResult.lastInsertRowid, requester);

      return workOrderResult.lastInsertRowid;
    });

    const workOrderId = transaction();

    const workOrder = db.prepare(`
      SELECT * FROM work_orders WHERE id = ?
    `).get(workOrderId);

    logger.info('采纳优化建议成功', { suggestion_id: id, work_order_id: workOrderId });
    res.json(success(workOrder, '采纳成功，已创建工单'));
  } catch (err) {
    logger.error('采纳优化建议失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
