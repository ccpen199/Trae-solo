const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../utils/logger');
const { success, error, pagination } = require('../utils/response');

router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      action_type,
      requester,
      keyword
    } = req.query;

    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('w.status = ?');
      params.push(status);
    }
    if (action_type) {
      conditions.push('w.action_type = ?');
      params.push(action_type);
    }
    if (requester) {
      conditions.push('w.requester LIKE ?');
      params.push(`%${requester}%`);
    }
    if (keyword) {
      conditions.push('(w.work_order_no LIKE ? OR w.title LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM work_orders w
      LEFT JOIN optimization_suggestions s ON w.suggestion_id = s.id
      ${whereClause}
    `;

    const dataSql = `
      SELECT w.*, s.risk_level, s.estimated_saving_monthly,
             r.resource_name, r.resource_type,
             p.project_name, p.project_code
      FROM work_orders w
      LEFT JOIN optimization_suggestions s ON w.suggestion_id = s.id
      LEFT JOIN resources r ON w.resource_id = r.resource_id
      LEFT JOIN projects p ON r.project_id = p.id
      ${whereClause}
      ORDER BY
        CASE w.status
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'executing' THEN 3
          WHEN 'completed' THEN 4
          ELSE 5
        END ASC,
        w.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    logger.info('查询工单列表', { count: list.length, total, page, pageSize });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询工单列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = db.prepare(`
      SELECT w.*, s.risk_level, s.description as suggestion_description,
             s.suggestion_type, s.estimated_saving_monthly,
             r.resource_name, r.resource_type, r.region,
             p.project_name, p.project_code,
             ca.account_name
      FROM work_orders w
      LEFT JOIN optimization_suggestions s ON w.suggestion_id = s.id
      LEFT JOIN resources r ON w.resource_id = r.resource_id
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      WHERE w.id = ?
    `).get(id);

    if (!workOrder) {
      return res.json(error('工单不存在', 404));
    }

    const logs = db.prepare(`
      SELECT * FROM work_order_logs
      WHERE work_order_id = ?
      ORDER BY created_at DESC
    `).all(id);

    const result = {
      ...workOrder,
      logs
    };

    logger.info('查询工单详情', { id });
    res.json(success(result));
  } catch (err) {
    logger.error('查询工单详情失败', err);
    res.json(error(err.message));
  }
});

router.post('/', (req, res) => {
  try {
    const {
      title,
      suggestion_id,
      resource_id,
      action_type,
      requester,
      approver,
      maintenance_window,
      estimated_saving
    } = req.body;

    if (!title) {
      return res.json(error('工单标题不能为空'));
    }

    const workOrderNo = `WO-${Date.now().toString().slice(-7)}`;

    const insertStmt = db.prepare(`
      INSERT INTO work_orders (
        work_order_no, title, suggestion_id, resource_id, action_type,
        status, requester, approver, maintenance_window, estimated_saving
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `);

    const insertLog = db.prepare(`
      INSERT INTO work_order_logs (work_order_id, action, operator, remark)
      VALUES (?, 'create', ?, '创建工单')
    `);

    const transaction = db.transaction(() => {
      const result = insertStmt.run(
        workOrderNo,
        title,
        suggestion_id || null,
        resource_id || null,
        action_type || null,
        requester || 'system',
        approver || null,
        maintenance_window || null,
        estimated_saving || 0
      );

      insertLog.run(result.lastInsertRowid, requester || 'system');

      return result.lastInsertRowid;
    });

    const workOrderId = transaction();

    if (suggestion_id) {
      db.prepare(`
        UPDATE optimization_suggestions
        SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(suggestion_id);
    }

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(workOrderId);

    logger.info('创建工单成功', { work_order_id: workOrderId, work_order_no: workOrderNo });
    res.json(success(workOrder, '创建成功'));
  } catch (err) {
    logger.error('创建工单失败', err);
    res.json(error(err.message));
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      risk_confirmation,
      maintenance_window,
      actual_saving,
      approver,
      operator = 'system'
    } = req.body;

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    if (!workOrder) {
      return res.json(error('工单不存在', 404));
    }

    const updateFields = [];
    const updateParams = [];
    const logActions = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
      logActions.push(`状态变更为: ${status}`);
    }
    if (risk_confirmation !== undefined) {
      updateFields.push('risk_confirmation = ?');
      updateParams.push(risk_confirmation ? 1 : 0);
      const confirmText = risk_confirmation ? "Confirmed" : "Not confirmed";
      logActions.push(`Risk: ${confirmText}`);
    }
    if (maintenance_window !== undefined) {
      updateFields.push('maintenance_window = ?');
      updateParams.push(maintenance_window);
      logActions.push(`维护窗口: ${maintenance_window}`);
    }
    if (actual_saving !== undefined) {
      updateFields.push('actual_saving = ?');
      updateParams.push(actual_saving);
      logActions.push(`实际节省: ${actual_saving}`);
    }
    if (approver !== undefined) {
      updateFields.push('approver = ?');
      updateParams.push(approver);
      logActions.push(`审批人: ${approver}`);
    }

    if (updateFields.length === 0) {
      return res.json(error('没有需要更新的字段'));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(id);

    const updateSql = `
      UPDATE work_orders
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const insertLog = db.prepare(`
      INSERT INTO work_order_logs (work_order_id, action, operator, remark)
      VALUES (?, 'update', ?, ?)
    `);

    const transaction = db.transaction(() => {
      db.prepare(updateSql).run(...updateParams);
      insertLog.run(id, operator, logActions.join('; '));
    });

    transaction();

    if (status === 'completed' && workOrder.suggestion_id) {
      db.prepare(`
        UPDATE optimization_suggestions
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(workOrder.suggestion_id);
    }

    const updatedWorkOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);

    logger.info('更新工单成功', { work_order_id: id, actions: logActions });
    res.json(success(updatedWorkOrder, '更新成功'));
  } catch (err) {
    logger.error('更新工单失败', err);
    res.json(error(err.message));
  }
});

router.post('/:id/execute', (req, res) => {
  try {
    const { id } = req.params;
    const { operator = 'system' } = req.body;

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    if (!workOrder) {
      return res.json(error('工单不存在', 404));
    }

    if (workOrder.status !== 'approved' && workOrder.status !== 'pending') {
      return res.json(error('只有待审批或已审批的工单才能执行'));
    }

    const updateStmt = db.prepare(`
      UPDATE work_orders
      SET status = 'executing', execution_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertLog = db.prepare(`
      INSERT INTO work_order_logs (work_order_id, action, operator, remark)
      VALUES (?, 'execute', ?, '开始执行工单')
    `);

    const transaction = db.transaction(() => {
      updateStmt.run(id);
      insertLog.run(id, operator);
    });

    transaction();

    const updatedWorkOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);

    logger.info('执行工单成功', { work_order_id: id });
    res.json(success(updatedWorkOrder, '执行成功'));
  } catch (err) {
    logger.error('执行工单失败', err);
    res.json(error(err.message));
  }
});

router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const { actual_saving, operator = 'system' } = req.body;

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    if (!workOrder) {
      return res.json(error('工单不存在', 404));
    }

    if (workOrder.status !== 'executing') {
      return res.json(error('只有执行中的工单才能完成'));
    }

    const updateStmt = db.prepare(`
      UPDATE work_orders
      SET status = 'completed',
          completion_time = CURRENT_TIMESTAMP,
          actual_saving = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertLog = db.prepare(`
      INSERT INTO work_order_logs (work_order_id, action, operator, remark)
      VALUES (?, 'complete', ?, ?)
    `);

    const updateSuggestion = db.prepare(`
      UPDATE optimization_suggestions
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      updateStmt.run(actual_saving || workOrder.estimated_saving || 0, id);
      insertLog.run(id, operator, `工单完成，实际节省: ${actual_saving || workOrder.estimated_saving || 0}`);
      if (workOrder.suggestion_id) {
        updateSuggestion.run(workOrder.suggestion_id);
      }
    });

    transaction();

    const updatedWorkOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);

    logger.info('完成工单成功', { work_order_id: id, actual_saving });
    res.json(success(updatedWorkOrder, '完成成功'));
  } catch (err) {
    logger.error('完成工单失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
