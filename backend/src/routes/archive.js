const express = require('express');
const { getAsync, allAsync, runAsync, db } = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { STATUS, ROLES } = require('../models/initDb');
const { getStateInfo } = require('../config/stateMachine');

const router = express.Router();

router.post('/:orderId/archive', authMiddleware, requireRole(ROLES.OPERATOR), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order.is_archived === 1) {
      return res.status(400).json({
        success: false,
        error: '订单已归档'
      });
    }

    if (order.current_status !== STATUS.COMPLETED && order.current_status !== STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        error: '只有已完成或已驳回的订单才能归档'
      });
    }

    const beforeSnapshot = JSON.stringify({
      ...order,
      stateInfo: getStateInfo(order.current_status)
    });

    await runAsync(
      `UPDATE main_orders SET is_archived = 1, updated_at = datetime('now') WHERE id = ?`,
      [orderId]
    );

    await runAsync(
      `INSERT INTO correction_records (
        main_order_id, correction_type, reason, operator_id, 
        operator_role, before_snapshot, after_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'archive', reason || '订单归档',
        req.user.id, req.user.role, beforeSnapshot, null
      ]
    );

    await runAsync(
      `INSERT INTO timeline_events (
        main_order_id, event_type, operator_id, operator_role,
        operator_name, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'archive', req.user.id, req.user.role,
        req.user.name, '订单归档', `订单已归档。原因: ${reason || '无'}`
      ]
    );

    const updatedOrder = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: updatedOrder
      },
      message: '订单归档成功'
    });
  } catch (err) {
    console.error('归档订单失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:orderId/revert', authMiddleware, requireRole(ROLES.OPERATOR), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, targetStatus } = req.body;

    const order = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const beforeSnapshot = JSON.stringify({
      ...order,
      stateInfo: getStateInfo(order.current_status)
    });

    const newStatus = targetStatus || STATUS.PENDING_MODEL_LOAD;

    await runAsync(
      `UPDATE main_orders SET current_status = ?, is_locked = 0, updated_at = datetime('now') WHERE id = ?`,
      [newStatus, orderId]
    );

    await runAsync(
      `UPDATE order_details SET status = ?, updated_at = datetime('now') WHERE main_order_id = ?`,
      [newStatus, orderId]
    );

    await runAsync(
      `INSERT INTO status_transitions (
        main_order_id, from_status, to_status, transition_type,
        action, operator_id, operator_role, comment, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, order.current_status, newStatus, 'revert',
        'revert', req.user.id, req.user.role, '撤销/冲正操作', reason || '无'
      ]
    );

    await runAsync(
      `INSERT INTO correction_records (
        main_order_id, correction_type, reason, operator_id, 
        operator_role, before_snapshot, after_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'revert', reason || '订单撤销',
        req.user.id, req.user.role, beforeSnapshot,
        JSON.stringify({ ...order, current_status: newStatus })
      ]
    );

    await runAsync(
      `INSERT INTO timeline_events (
        main_order_id, event_type, operator_id, operator_role,
        operator_name, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'revert', req.user.id, req.user.role,
        req.user.name, '订单撤销', `订单状态已从"${getStateInfo(order.current_status)?.name}"撤销至"${getStateInfo(newStatus)?.name}"。原因: ${reason || '无'}`
      ]
    );

    const updatedOrder = await getAsync(
      `SELECT mo.*, u.name as responsible_name 
       FROM main_orders mo 
       LEFT JOIN users u ON mo.responsible_user_id = u.id 
       WHERE mo.id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: {
          ...updatedOrder,
          stateInfo: getStateInfo(newStatus)
        }
      },
      message: '订单撤销成功'
    });
  } catch (err) {
    console.error('撤销订单失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:orderId/supplement', authMiddleware, requireRole(ROLES.OPERATOR), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, supplementData } = req.body;

    if (!supplementData || Object.keys(supplementData).length === 0) {
      return res.status(400).json({
        success: false,
        error: '补充数据不能为空'
      });
    }

    const order = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const beforeSnapshot = JSON.stringify(order);

    const updates = [];
    const params = [];

    if (supplementData.title !== undefined) {
      updates.push('title = ?');
      params.push(supplementData.title);
    }
    if (supplementData.modelName !== undefined) {
      updates.push('model_name = ?');
      params.push(supplementData.modelName);
    }
    if (supplementData.modelType !== undefined) {
      updates.push('model_type = ?');
      params.push(supplementData.modelType);
    }
    if (supplementData.description !== undefined) {
      updates.push('description = ?');
      params.push(supplementData.description);
    }
    if (supplementData.expectCompleteTime !== undefined) {
      updates.push('expect_complete_time = ?');
      params.push(supplementData.expectCompleteTime);
    }
    if (supplementData.costLimit !== undefined) {
      updates.push('cost_limit = ?');
      params.push(supplementData.costLimit);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有可更新的字段'
      });
    }

    updates.push('updated_at = datetime("now")');
    params.push(orderId);

    await runAsync(
      `UPDATE main_orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    await runAsync(
      `INSERT INTO correction_records (
        main_order_id, correction_type, reason, operator_id, 
        operator_role, before_snapshot, after_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'supplement', reason || '订单补录',
        req.user.id, req.user.role, beforeSnapshot,
        JSON.stringify({ ...order, ...supplementData })
      ]
    );

    await runAsync(
      `INSERT INTO timeline_events (
        main_order_id, event_type, operator_id, operator_role,
        operator_name, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'supplement', req.user.id, req.user.role,
        req.user.name, '订单补录', `订单数据已补录更新。原因: ${reason || '无'}`
      ]
    );

    const updatedOrder = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: updatedOrder
      },
      message: '订单补录成功'
    });
  } catch (err) {
    console.error('补录订单失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:orderId/reopen', authMiddleware, requireRole(ROLES.OPERATOR), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, newTitle } = req.body;

    const originalOrder = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!originalOrder) {
      return res.status(404).json({
        success: false,
        error: '原订单不存在'
      });
    }

    if (!originalOrder.is_archived && 
        originalOrder.current_status !== STATUS.COMPLETED && 
        originalOrder.current_status !== STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        error: '只能重开已归档、已完成或已驳回的订单'
      });
    }

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newOrderNo = `3D${year}${month}${day}${random}`;

    const originalSnapshot = JSON.stringify(originalOrder);

    const newOrderResult = await runAsync(
      `INSERT INTO main_orders (
        order_no, title, model_name, model_type, model_url,
        description, current_status, responsible_role,
        responsible_user_id, expect_complete_time, cost_limit, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderNo, newTitle || `${originalOrder.title} (重开)`,
        originalOrder.model_name, originalOrder.model_type,
        originalOrder.model_url, originalOrder.description,
        STATUS.PENDING_MODEL_LOAD, originalOrder.responsible_role,
        originalOrder.responsible_user_id, originalOrder.expect_complete_time,
        originalOrder.cost_limit, req.user.id
      ]
    );

    const newOrderId = newOrderResult.lastID;

    const originalDetails = await allAsync(
      `SELECT * FROM order_details WHERE main_order_id = ?`,
      [orderId]
    );

    for (let i = 0; i < originalDetails.length; i++) {
      const detail = originalDetails[i];
      await runAsync(
        `INSERT INTO order_details (
          main_order_id, detail_no, material_name, material_url,
          hotspot_config, config_data, status, sequence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newOrderId, `${newOrderNo}-D${String(i + 1).padStart(3, '0')}`,
          detail.material_name, detail.material_url,
          detail.hotspot_config, detail.config_data,
          STATUS.PENDING_MODEL_LOAD, i
        ]
      );
    }

    await runAsync(
      `INSERT INTO correction_records (
        main_order_id, correction_type, original_order_id, reason, 
        operator_id, operator_role, before_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderId, 'reopen', orderId, reason || '订单重开',
        req.user.id, req.user.role, originalSnapshot
      ]
    );

    await runAsync(
      `INSERT INTO timeline_events (
        main_order_id, event_type, operator_id, operator_role,
        operator_name, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderId, 'reopen', req.user.id, req.user.role,
        req.user.name, '订单重开', 
        `订单从原订单 #${originalOrder.order_no} 重开。原因: ${reason || '无'}`
      ]
    );

    const newOrder = await getAsync(
      `SELECT mo.*, u.name as responsible_name 
       FROM main_orders mo 
       LEFT JOIN users u ON mo.responsible_user_id = u.id 
       WHERE mo.id = ?`,
      [newOrderId]
    );

    res.json({
      success: true,
      data: {
        order: {
          ...newOrder,
          stateInfo: getStateInfo(STATUS.PENDING_MODEL_LOAD)
        },
        originalOrderNo: originalOrder.order_no
      },
      message: '订单重开成功'
    });
  } catch (err) {
    console.error('重开订单失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/corrections', authMiddleware, requireRole(ROLES.OPERATOR), async (req, res) => {
  try {
    const { orderId, correctionType, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = `SELECT COUNT(*) as total FROM correction_records WHERE 1=1`;
    let dataSql = `SELECT cr.*, mo.order_no, u.name as operator_name
                   FROM correction_records cr 
                   LEFT JOIN main_orders mo ON cr.main_order_id = mo.id
                   LEFT JOIN users u ON cr.operator_id = u.id
                   WHERE 1=1`;
    
    let params = [];
    let countParams = [];

    if (orderId) {
      dataSql += ` AND cr.main_order_id = ?`;
      countSql += ` AND main_order_id = ?`;
      params.push(orderId);
      countParams.push(orderId);
    }

    if (correctionType) {
      dataSql += ` AND cr.correction_type = ?`;
      countSql += ` AND correction_type = ?`;
      params.push(correctionType);
      countParams.push(correctionType);
    }

    const countResult = await getAsync(countSql, countParams);
    const total = countResult.total;

    dataSql += ` ORDER BY cr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const corrections = await allAsync(dataSql, params);

    res.json({
      success: true,
      data: {
        corrections,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (err) {
    console.error('获取冲正记录失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
