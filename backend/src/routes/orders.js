const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getAsync, allAsync, runAsync, db } = require('../config/database');
const { authMiddleware, requireRole, requireOwnershipOrRole } = require('../middleware/auth');
const { STATUS, ROLES, ACTIONS } = require('../models/initDb');
const { validateTransition, getAvailableActions, getStateInfo } = require('../config/stateMachine');
const costEngine = require('../engines/costEngine');
const reviewEngine = require('../engines/reviewEngine');
const modelRuleEngine = require('../engines/modelRuleEngine');

const router = express.Router();

function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `3D${year}${month}${day}${random}`;
}

function generateDetailNo(orderNo, index) {
  return `${orderNo}-D${String(index + 1).padStart(3, '0')}`;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, role, search, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = `SELECT COUNT(*) as total FROM main_orders WHERE 1=1`;
    let dataSql = `SELECT mo.*, u.name as responsible_name, cu.name as creator_name
                   FROM main_orders mo 
                   LEFT JOIN users u ON mo.responsible_user_id = u.id
                   LEFT JOIN users cu ON mo.created_by = cu.id
                   WHERE 1=1`;
    
    let params = [];
    let countParams = [];

    if (status) {
      dataSql += ` AND mo.current_status = ?`;
      countSql += ` AND current_status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      dataSql += ` AND (mo.order_no LIKE ? OR mo.title LIKE ? OR mo.model_name LIKE ?)`;
      countSql += ` AND (order_no LIKE ? OR title LIKE ? OR model_name LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (req.user.role !== ROLES.OPERATOR) {
      dataSql += ` AND (mo.responsible_user_id = ? OR mo.created_by = ?)`;
      countSql += ` AND (responsible_user_id = ? OR created_by = ?)`;
      params.push(req.user.id, req.user.id);
      countParams.push(req.user.id, req.user.id);
    }

    const countResult = await getAsync(countSql, countParams);
    const total = countResult.total;

    dataSql += ` ORDER BY mo.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const orders = await allAsync(dataSql, params);

    const enrichedOrders = orders.map(order => ({
      ...order,
      stateInfo: getStateInfo(order.current_status)
    }));

    res.json({
      success: true,
      data: {
        orders: enrichedOrders,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    let whereClause = '1=1';
    let params = [];

    if (req.user.role !== ROLES.OPERATOR) {
      whereClause = '(responsible_user_id = ? OR created_by = ?)';
      params = [req.user.id, req.user.id];
    }

    const statusCounts = await allAsync(
      `SELECT current_status, COUNT(*) as count 
       FROM main_orders 
       WHERE ${whereClause} 
       GROUP BY current_status`,
      params
    );

    const todayStats = await getAsync(
      `SELECT COUNT(*) as today_count, 
              SUM(CASE WHEN current_status = 'completed' THEN 1 ELSE 0 END) as today_completed
       FROM main_orders 
       WHERE ${whereClause} AND date(created_at) = date('now')`,
      params
    );

    const stats = {
      byStatus: {},
      today: todayStats
    };

    for (const status of Object.values(STATUS)) {
      const statusData = statusCounts.find(s => s.current_status === status);
      stats.byStatus[status] = statusData ? statusData.count : 0;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getAsync(
      `SELECT mo.*, u.name as responsible_name, cu.name as creator_name
       FROM main_orders mo 
       LEFT JOIN users u ON mo.responsible_user_id = u.id
       LEFT JOIN users cu ON mo.created_by = cu.id
       WHERE mo.id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (req.user.role !== ROLES.OPERATOR && 
        order.responsible_user_id !== req.user.id && 
        order.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '没有权限查看此订单'
      });
    }

    const details = await allAsync(
      `SELECT * FROM order_details WHERE main_order_id = ? ORDER BY sequence ASC`,
      [orderId]
    );

    const transitions = await allAsync(
      `SELECT st.*, u.name as operator_name 
       FROM status_transitions st 
       LEFT JOIN users u ON st.operator_id = u.id 
       WHERE st.main_order_id = ? 
       ORDER BY st.created_at ASC`,
      [orderId]
    );

    const timeline = await allAsync(
      `SELECT * FROM timeline_events 
       WHERE main_order_id = ? 
       ORDER BY created_at DESC`,
      [orderId]
    );

    const availableActions = getAvailableActions(order.current_status, req.user.role);

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          stateInfo: getStateInfo(order.current_status),
          availableActions
        },
        details,
        transitions,
        timeline
      }
    });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/', authMiddleware, requireRole(ROLES.CONSUMER, ROLES.OPERATOR), async (req, res) => {
  try {
    const {
      title,
      modelName,
      modelType,
      modelUrl,
      description,
      responsibleUserId,
      expectCompleteTime,
      costLimit,
      details = []
    } = req.body;

    if (!title || !modelName) {
      return res.status(400).json({
        success: false,
        error: '标题和模型名称不能为空'
      });
    }

    const existing = await getAsync(
      `SELECT id FROM main_orders WHERE title = ? AND model_name = ? AND created_by = ?`,
      [title, modelName, req.user.id]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        error: '已存在相同标题和模型名称的订单，请勿重复提交'
      });
    }

    const sensitiveCheck = await costEngine.checkSensitiveContent(modelName, description);
    if (!sensitiveCheck.valid) {
      return res.status(400).json({
        success: false,
        error: sensitiveCheck.degradeReason,
        details: sensitiveCheck.sensitiveItems
      });
    }

    let assignedResponsibleId = responsibleUserId;
    let assignedResponsibleRole = ROLES.DESIGNER;

    if (!assignedResponsibleId) {
      const designers = await allAsync(
        `SELECT id FROM users WHERE role = ? AND is_active = 1 ORDER BY RANDOM() LIMIT 1`,
        [ROLES.DESIGNER]
      );
      if (designers.length > 0) {
        assignedResponsibleId = designers[0].id;
      }
    } else {
      const responsibleUser = await getAsync(
        `SELECT role FROM users WHERE id = ?`,
        [assignedResponsibleId]
      );
      if (responsibleUser) {
        assignedResponsibleRole = responsibleUser.role;
      }
    }

    const orderNo = generateOrderNo();
    const initialStatus = STATUS.PENDING_MODEL_LOAD;

    const orderResult = await runAsync(
      `INSERT INTO main_orders (
        order_no, title, model_name, model_type, model_url, 
        description, current_status, responsible_role, 
        responsible_user_id, expect_complete_time, cost_limit, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo, title, modelName, modelType || 'furniture', modelUrl,
        description, initialStatus, assignedResponsibleRole,
        assignedResponsibleId, expectCompleteTime || null, costLimit || null, req.user.id
      ]
    );

    const orderId = orderResult.lastID;

    for (let i = 0; i < details.length; i++) {
      const detail = details[i];
      await runAsync(
        `INSERT INTO order_details (
          main_order_id, detail_no, material_name, material_url,
          hotspot_config, config_data, status, sequence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, generateDetailNo(orderNo, i),
          detail.material_name, detail.material_url,
          JSON.stringify(detail.hotspot_config || {}),
          JSON.stringify(detail.config_data || {}),
          'pending', i
        ]
      );
    }

    await runAsync(
      `INSERT INTO status_transitions (
        main_order_id, from_status, to_status, transition_type,
        action, operator_id, operator_role, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, '', initialStatus, 'create',
        ACTIONS.SUBMIT_MODEL, req.user.id, req.user.role, '订单创建'
      ]
    );

    await runAsync(
      `INSERT INTO timeline_events (
        main_order_id, event_type, operator_id, operator_role,
        operator_name, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 'create', req.user.id, req.user.role,
        req.user.name, '订单创建', `${req.user.name}创建了订单 "${title}"`
      ]
    );

    if (assignedResponsibleId) {
      await runAsync(
        `INSERT INTO notifications (
          user_id, main_order_id, title, content, type
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          assignedResponsibleId, orderId,
          '新订单待处理', `您有一个新的3D模型订单待处理: ${title}`,
          'new_order'
        ]
      );
    }

    const newOrder = await getAsync(
      `SELECT mo.*, u.name as responsible_name 
       FROM main_orders mo 
       LEFT JOIN users u ON mo.responsible_user_id = u.id 
       WHERE mo.id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: newOrder,
        stateInfo: getStateInfo(initialStatus)
      },
      message: '订单创建成功'
    });
  } catch (err) {
    console.error('创建订单失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:orderId/action', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, data = {} } = req.body;

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
        error: '订单已归档，不能执行操作'
      });
    }

    const validation = validateTransition(order.current_status, action, data, req.user.role);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: '操作验证失败',
        details: validation.errors
      });
    }

    let transitionType = 'normal';
    let nextStatus = validation.nextStatus;
    let comment = '';
    let reason = data.reason || '';

    switch (action) {
      case ACTIONS.APPROVE:
        comment = data.comment || '审核通过';
        transitionType = 'approval';
        
        if (data.materialData) {
          const validationResult = await reviewEngine.calculateMaterialValidation(orderId, data.materialData);
          if (!validationResult.valid && validationResult.errors.length > 0) {
            return res.status(400).json({
              success: false,
              error: '材质校验不通过',
              details: validationResult.errors
            });
          }
          data.validationResult = validationResult;
        }
        break;

      case ACTIONS.REJECT:
        comment = `驳回: ${data.reason}`;
        transitionType = 'rejection';
        reason = data.reason;
        break;

      case ACTIONS.SUPPLEMENT:
        comment = `要求补充资料: ${data.supplementRequest}`;
        transitionType = 'supplement_request';
        nextStatus = order.current_status;
        break;

      case ACTIONS.TRANSFER:
        comment = `转派给新负责人: ${data.newResponsibleId}`;
        transitionType = 'transfer';
        nextStatus = order.current_status;
        
        const newResponsible = await getAsync(
          `SELECT * FROM users WHERE id = ?`,
          [data.newResponsibleId]
        );
        
        if (newResponsible) {
          await runAsync(
            `UPDATE main_orders SET responsible_user_id = ?, responsible_role = ?, updated_at = datetime('now') WHERE id = ?`,
            [data.newResponsibleId, newResponsible.role, orderId]
          );

          await runAsync(
            `INSERT INTO notifications (
              user_id, main_order_id, title, content, type
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              data.newResponsibleId, orderId,
              '订单转派', `订单 "${order.title}" 已转派给您处理`,
              'transfer'
            ]
          );
        }
        break;

      case ACTIONS.SELECT_CONFIG:
        comment = '配置选择完成';
        transitionType = 'config_select';
        
        if (data.configData) {
          await runAsync(
            `UPDATE order_details SET config_data = ?, status = 'configured', updated_at = datetime('now') 
             WHERE main_order_id = ?`,
            [JSON.stringify(data.configData), orderId]
          );
        }
        break;

      case ACTIONS.GENERATE_QUOTE:
        if (order.is_locked === 0) {
          await runAsync(
            `UPDATE main_orders SET is_locked = 1, locked_by = ?, locked_at = datetime('now') WHERE id = ?`,
            [req.user.id, orderId]
          );
        }

        const costCheck = await costEngine.checkCostLimit(orderId, data.actualCost);
        if (!costCheck.valid) {
          await costEngine.recordDegradation(
            orderId, 'cost_limit', costCheck.degradeReason,
            `actual_cost: ${data.actualCost}, limit: ${costCheck.costLimit}`,
            JSON.stringify(costCheck), req.user.id, order.current_status
          );

          return res.status(400).json({
            success: false,
            error: costCheck.degradeReason,
            costCheck,
            degraded: true
          });
        }

        comment = `报价生成，金额: ${data.actualCost}`;
        transitionType = 'quote_generate';

        await runAsync(
          `UPDATE main_orders SET actual_cost = ?, updated_at = datetime('now') WHERE id = ?`,
          [data.actualCost, orderId]
        );

        if (data.quoteData) {
          await runAsync(
            `UPDATE order_details SET status = 'quoted', updated_at = datetime('now') WHERE main_order_id = ?`,
            [orderId]
          );
        }
        break;

      case ACTIONS.SUBMIT_LEAD:
        comment = `留资完成: ${data.leadName} - ${data.leadPhone}`;
        transitionType = 'lead_submit';

        await runAsync(
          `UPDATE main_orders SET is_locked = 0, updated_at = datetime('now') WHERE id = ?`,
          [orderId]
        );

        await runAsync(
          `UPDATE order_details SET status = 'completed', updated_at = datetime('now') WHERE main_order_id = ?`,
          [orderId]
        );

        const operators = await allAsync(
          `SELECT id FROM users WHERE role = ? AND is_active = 1`,
          [ROLES.OPERATOR]
        );

        for (const op of operators) {
          await runAsync(
            `INSERT INTO notifications (
              user_id, main_order_id, title, content, type
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              op.id, orderId,
              '订单完成', `订单 "${order.title}" 已完成留资`,
              'order_complete'
            ]
          );
        }
        break;

      case ACTIONS.CANCEL:
        comment = `取消订单: ${data.reason}`;
        transitionType = 'cancel';
        reason = data.reason;
        break;

      case ACTIONS.REVERT:
        comment = `撤销操作: ${data.reason}`;
        transitionType = 'revert';
        reason = data.reason;
        break;
    }

    if (nextStatus && nextStatus !== order.current_status) {
      await runAsync(
        `UPDATE main_orders SET current_status = ?, updated_at = datetime('now') WHERE id = ?`,
        [nextStatus, orderId]
      );

      await runAsync(
        `UPDATE order_details SET status = ?, updated_at = datetime('now') WHERE main_order_id = ?`,
        [nextStatus, orderId]
      );
    }

    await runAsync(
      `INSERT INTO status_transitions (
        main_order_id, from_status, to_status, transition_type,
        action, operator_id, operator_role, comment, reason, extra_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, order.current_status, nextStatus || order.current_status, transitionType,
        action, req.user.id, req.user.role, comment, reason, JSON.stringify(data)
      ]
    );

    await runAsync(
      `INSERT INTO timeline_events (
        main_order_id, event_type, operator_id, operator_role,
        operator_name, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, transitionType, req.user.id, req.user.role,
        req.user.name, getActionTitle(action, transitionType), comment
      ]
    );

    await runAsync(
      `INSERT INTO operation_logs (
        user_id, user_role, action, target_type, target_id, after_data
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, req.user.role, action, 'order', orderId,
        JSON.stringify({ before: order.current_status, after: nextStatus || order.current_status })
      ]
    );

    const updatedOrder = await getAsync(
      `SELECT mo.*, u.name as responsible_name 
       FROM main_orders mo 
       LEFT JOIN users u ON mo.responsible_user_id = u.id 
       WHERE mo.id = ?`,
      [orderId]
    );

    const availableActions = getAvailableActions(
      nextStatus || order.current_status, 
      req.user.role
    );

    res.json({
      success: true,
      data: {
        order: {
          ...updatedOrder,
          stateInfo: getStateInfo(nextStatus || order.current_status),
          availableActions
        }
      },
      message: `操作成功: ${getActionTitle(action, transitionType)}`
    });
  } catch (err) {
    console.error('执行订单操作失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

function getActionTitle(action, transitionType) {
  const titles = {
    [ACTIONS.SUBMIT_MODEL]: '提交模型',
    [ACTIONS.APPROVE]: '审核通过',
    [ACTIONS.REJECT]: '驳回',
    [ACTIONS.SUPPLEMENT]: '要求补充资料',
    [ACTIONS.TRANSFER]: '转派',
    [ACTIONS.SELECT_CONFIG]: '选择配置',
    [ACTIONS.GENERATE_QUOTE]: '生成报价',
    [ACTIONS.SUBMIT_LEAD]: '提交留资',
    [ACTIONS.CANCEL]: '取消',
    [ACTIONS.REVERT]: '撤销'
  };
  return titles[action] || action;
}

router.get('/:orderId/rules', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { modelType = 'furniture' } = req.query;

    const materialDefaults = await modelRuleEngine.getMaterialDefaults(modelType);
    const rotationLimits = await modelRuleEngine.getRotationLimits(modelType);
    const zoomLimits = await modelRuleEngine.getZoomLimits(modelType);
    const hotspotRules = await modelRuleEngine.getHotspotRules(modelType);

    res.json({
      success: true,
      data: {
        materialDefaults,
        rotationLimits,
        zoomLimits,
        hotspotRules
      }
    });
  } catch (err) {
    console.error('获取规则失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:orderId/calculate-quote', authMiddleware, async (req, res) => {
  try {
    const { configData } = req.body;
    const quoteCost = await costEngine.calculateQuoteCost(configData || {});

    res.json({
      success: true,
      data: quoteCost
    });
  } catch (err) {
    console.error('计算报价失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
