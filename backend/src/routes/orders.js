const express = require('express');
const db = require('../config/database');
const { authMiddleware, logOperation } = require('../middleware/auth');
const { 
  generateOrderNo, 
  generateDetailNo, 
  STATUSES, 
  STATUS_LABELS,
  getNextStatus,
  getRolePermissions
} = require('../utils');

const router = express.Router();

router.use(authMiddleware);

const addTimeline = (mainOrderId, action, actionType, operatorId, content, fromStatus, toStatus) => {
  const stmt = db.prepare(`
    INSERT INTO timelines (main_order_id, action, action_type, operator_id, content, from_status, to_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(mainOrderId, action, actionType, operatorId, content, fromStatus, toStatus);
};

const addMessage = (userId, mainOrderId, title, content, messageType) => {
  const stmt = db.prepare(`
    INSERT INTO messages (user_id, main_order_id, title, content, message_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, mainOrderId, title, content, messageType);
};

const getUsersByRole = (role) => {
  return db.prepare('SELECT * FROM users WHERE role = ?').all(role);
};

router.get('/', (req, res) => {
  const { status, keyword, page = 1, pageSize = 20 } = req.query;
  const permissions = getRolePermissions(req.user.role);
  
  let whereClause = '1=1';
  const params = [];

  if (status) {
    whereClause += ' AND mo.status = ?';
    params.push(status);
  }

  if (keyword) {
    whereClause += ' AND (mo.order_no LIKE ? OR mo.title LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword);
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM main_orders mo WHERE ${whereClause}
  `);
  const { total } = countStmt.get(...params);

  const offset = (page - 1) * pageSize;
  const orders = db.prepare(`
    SELECT mo.*, 
           uc.name as creator_name, uc.username as creator_username,
           ua.name as assignee_name, ua.username as assignee_username
    FROM main_orders mo
    LEFT JOIN users uc ON mo.creator_id = uc.id
    LEFT JOIN users ua ON mo.assignee_id = ua.id
    WHERE ${whereClause}
    ORDER BY mo.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: orders.map(o => ({
      ...o,
      statusLabel: STATUS_LABELS[o.status]
    })),
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    permissions
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const order = db.prepare(`
    SELECT mo.*, 
           uc.name as creator_name, uc.username as creator_username,
           ua.name as assignee_name, ua.username as assignee_username
    FROM main_orders mo
    LEFT JOIN users uc ON mo.creator_id = uc.id
    LEFT JOIN users ua ON mo.assignee_id = ua.id
    WHERE mo.id = ?
  `).get(id);

  if (!order) {
    return res.status(404).json({ message: '主单不存在' });
  }

  const details = db.prepare(`
    SELECT * FROM order_details WHERE main_order_id = ?
  `).all(id);

  const collectors = db.prepare(`
    SELECT * FROM collectors WHERE main_order_id = ?
  `).all(id);

  const logIndices = db.prepare(`
    SELECT * FROM log_indices WHERE main_order_id = ?
  `).all(id);

  const queryRules = db.prepare(`
    SELECT * FROM query_rules WHERE main_order_id = ?
  `).all(id);

  const fieldParsers = db.prepare(`
    SELECT * FROM field_parsers WHERE main_order_id = ?
  `).all(id);

  const alerts = db.prepare(`
    SELECT a.*, u.name as assignee_name
    FROM alerts a
    LEFT JOIN users u ON a.assignee_id = u.id
    WHERE a.main_order_id = ?
  `).all(id);

  const timelines = db.prepare(`
    SELECT t.*, u.name as operator_name
    FROM timelines t
    LEFT JOIN users u ON t.operator_id = u.id
    WHERE t.main_order_id = ?
    ORDER BY t.created_at DESC
  `).all(id);

  res.json({
    data: {
      ...order,
      statusLabel: STATUS_LABELS[order.status],
      details,
      collectors,
      logIndices,
      queryRules,
      fieldParsers,
      alerts,
      timelines
    }
  });
});

router.post('/', (req, res) => {
  const { title, description, assignee_id, expected_finish_time, priority, tags, details, collectors } = req.body;

  if (!title) {
    return res.status(400).json({ message: '标题不能为空' });
  }

  const transaction = db.transaction(() => {
    const orderNo = generateOrderNo();
    
    const insertOrder = db.prepare(`
      INSERT INTO main_orders (order_no, title, description, status, current_node, creator_id, assignee_id, expected_finish_time, priority, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertOrder.run(
      orderNo,
      title,
      description || '',
      STATUSES.PENDING_COLLECT,
      'collect',
      req.user.id,
      assignee_id || null,
      expected_finish_time || null,
      priority || 'normal',
      tags ? JSON.stringify(tags) : null
    );

    const mainOrderId = result.lastInsertRowid;

    if (details && details.length > 0) {
      const insertDetail = db.prepare(`
        INSERT INTO order_details (main_order_id, detail_no, log_source, log_path, log_format, log_count, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const detail of details) {
        const detailNo = generateDetailNo(orderNo);
        insertDetail.run(
          mainOrderId,
          detailNo,
          detail.log_source || '',
          detail.log_path || '',
          detail.log_format || '',
          detail.log_count || 0,
          STATUSES.PENDING_COLLECT
        );
      }
    }

    if (collectors && collectors.length > 0) {
      const insertCollector = db.prepare(`
        INSERT INTO collectors (main_order_id, name, type, config, status, collect_interval, is_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const collector of collectors) {
        insertCollector.run(
          mainOrderId,
          collector.name,
          collector.type || 'file',
          collector.config ? JSON.stringify(collector.config) : null,
          'draft',
          collector.collect_interval || 60,
          1
        );
      }
    }

    addTimeline(
      mainOrderId,
      '创建主单',
      'create',
      req.user.id,
      `创建主单 ${orderNo}`,
      null,
      STATUSES.PENDING_COLLECT
    );

    if (assignee_id) {
      addMessage(
        assignee_id,
        mainOrderId,
        '新日志采集任务',
        `您有一个新的日志采集任务：${title}`,
        'task'
      );
    }

    logOperation(req, 'create', 'main_order', mainOrderId, null, { title, orderNo });

    return { id: mainOrderId, orderNo };
  });

  try {
    const result = transaction();
    res.status(201).json({ message: '创建成功', data: result });
  } catch (error) {
    console.error('创建主单失败:', error);
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.post('/:id/submit-collect', (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(id);
    
    if (!order) {
      throw new Error('主单不存在');
    }

    if (order.status !== STATUSES.PENDING_COLLECT) {
      throw new Error('当前状态不允许提交采集');
    }

    const nextStatus = STATUSES.PENDING_PARSE;
    
    db.prepare(`
      UPDATE main_orders 
      SET status = ?, current_node = 'parse', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, id);

    db.prepare(`
      UPDATE order_details 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE main_order_id = ?
    `).run(nextStatus, id);

    addTimeline(
      id,
      '提交采集',
      'submit',
      req.user.id,
      comment || '日志采集完成，提交解析索引',
      order.status,
      nextStatus
    );

    const opsUsers = getUsersByRole('operator');
    for (const user of opsUsers) {
      addMessage(
        user.id,
        id,
        '待解析索引任务',
        `主单 ${order.order_no} 已完成采集，待解析索引`,
        'task'
      );
    }

    logOperation(req, 'submit_collect', 'main_order', id, { status: order.status }, { status: nextStatus });

    return { status: nextStatus, statusLabel: STATUS_LABELS[nextStatus] };
  });

  try {
    const result = transaction();
    res.json({ message: '提交成功', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/parse-index', (req, res) => {
  const { id } = req.params;
  const { action, comment, logIndices, fieldParsers } = req.body;

  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(id);
    
    if (!order) {
      throw new Error('主单不存在');
    }

    if (order.status !== STATUSES.PENDING_PARSE) {
      throw new Error('当前状态不允许解析索引操作');
    }

    if (logIndices && logIndices.length > 0) {
      const insertIndex = db.prepare(`
        INSERT INTO log_indices (main_order_id, index_name, index_type, shard_count, replica_count, status, total_docs, storage_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const idx of logIndices) {
        if (!idx.id) {
          insertIndex.run(
            id,
            idx.index_name,
            idx.index_type || 'standard',
            idx.shard_count || 1,
            idx.replica_count || 0,
            'active',
            idx.total_docs || 0,
            idx.storage_size || 0
          );
        }
      }
    }

    if (fieldParsers && fieldParsers.length > 0) {
      const insertParser = db.prepare(`
        INSERT INTO field_parsers (main_order_id, field_name, field_type, parser_type, parser_pattern, is_required, is_indexed, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const parser of fieldParsers) {
        if (!parser.id) {
          insertParser.run(
            id,
            parser.field_name,
            parser.field_type || 'string',
            parser.parser_type || 'regex',
            parser.parser_pattern || '',
            parser.is_required ? 1 : 0,
            parser.is_indexed ? 1 : 0,
            parser.description || ''
          );
        }
      }
    }

    let nextStatus;
    let actionText;

    if (action === 'approve') {
      nextStatus = STATUSES.PENDING_QUERY;
      actionText = '解析索引通过';
    } else if (action === 'reject') {
      nextStatus = STATUSES.PENDING_COLLECT;
      actionText = '解析索引驳回';
    } else {
      throw new Error('无效的操作类型');
    }

    db.prepare(`
      UPDATE main_orders 
      SET status = ?, current_node = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, action === 'approve' ? 'query' : 'collect', id);

    addTimeline(
      id,
      actionText,
      action,
      req.user.id,
      comment || actionText,
      order.status,
      nextStatus
    );

    if (action === 'approve') {
      const analystUsers = getUsersByRole('analyst');
      for (const user of analystUsers) {
        addMessage(
          user.id,
          id,
          '待查询分析任务',
          `主单 ${order.order_no} 已完成解析索引，待查询分析`,
          'task'
        );
      }
    } else {
      addMessage(
        order.creator_id,
        id,
        '解析索引被驳回',
        `主单 ${order.order_no} 解析索引被驳回，请重新处理`,
        'notice'
      );
    }

    logOperation(req, `parse_${action}`, 'main_order', id, { status: order.status }, { status: nextStatus });

    return { status: nextStatus, statusLabel: STATUS_LABELS[nextStatus] };
  });

  try {
    const result = transaction();
    res.json({ message: '操作成功', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/query-analyze', (req, res) => {
  const { id } = req.params;
  const { action, comment, queryRules } = req.body;

  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(id);
    
    if (!order) {
      throw new Error('主单不存在');
    }

    if (order.status !== STATUSES.PENDING_QUERY) {
      throw new Error('当前状态不允许查询分析操作');
    }

    if (queryRules && queryRules.length > 0) {
      const insertRule = db.prepare(`
        INSERT INTO query_rules (main_order_id, rule_name, rule_type, query_template, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const rule of queryRules) {
        if (!rule.id) {
          insertRule.run(
            id,
            rule.rule_name,
            rule.rule_type || 'search',
            rule.query_template || '',
            rule.description || '',
            1
          );
        }
      }
    }

    let nextStatus;
    let actionText;

    if (action === 'approve') {
      nextStatus = STATUSES.PENDING_ALERT;
      actionText = '查询分析通过';
    } else if (action === 'reject') {
      nextStatus = STATUSES.PENDING_PARSE;
      actionText = '查询分析驳回';
    } else if (action === 'supplement') {
      nextStatus = STATUSES.PENDING_PARSE;
      actionText = '需补充资料';
    } else if (action === 'transfer') {
      nextStatus = STATUSES.PENDING_QUERY;
      actionText = '转派处理';
    } else {
      throw new Error('无效的操作类型');
    }

    db.prepare(`
      UPDATE main_orders 
      SET status = ?, current_node = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, action === 'approve' ? 'alert' : (action === 'reject' || action === 'supplement' ? 'parse' : 'query'), id);

    addTimeline(
      id,
      actionText,
      action,
      req.user.id,
      comment || actionText,
      order.status,
      nextStatus
    );

    if (action === 'approve') {
      const secUsers = getUsersByRole('security');
      for (const user of secUsers) {
        addMessage(
          user.id,
          id,
          '待告警任务',
          `主单 ${order.order_no} 已完成查询分析，待告警处理`,
          'task'
        );
      }
    }

    logOperation(req, `query_${action}`, 'main_order', id, { status: order.status }, { status: nextStatus });

    return { status: nextStatus, statusLabel: STATUS_LABELS[nextStatus] };
  });

  try {
    const result = transaction();
    res.json({ message: '操作成功', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/alert-handle', (req, res) => {
  const { id } = req.params;
  const { action, comment, alerts } = req.body;

  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(id);
    
    if (!order) {
      throw new Error('主单不存在');
    }

    if (order.status !== STATUSES.PENDING_ALERT) {
      throw new Error('当前状态不允许告警操作');
    }

    if (alerts && alerts.length > 0) {
      const insertAlert = db.prepare(`
        INSERT INTO alerts (main_order_id, alert_name, alert_level, alert_type, trigger_condition, status, assignee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const alert of alerts) {
        if (!alert.id) {
          insertAlert.run(
            id,
            alert.alert_name,
            alert.alert_level || 'info',
            alert.alert_type || 'rule',
            alert.trigger_condition || '',
            'active',
            alert.assignee_id || req.user.id
          );
        }
      }
    }

    let nextStatus;
    let actionText;

    if (action === 'approve') {
      nextStatus = STATUSES.ARCHIVED;
      actionText = '告警处理完成，已归档';
    } else if (action === 'reject') {
      nextStatus = STATUSES.PENDING_QUERY;
      actionText = '告警处理驳回';
    } else {
      throw new Error('无效的操作类型');
    }

    db.prepare(`
      UPDATE main_orders 
      SET status = ?, current_node = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, action === 'approve' ? 'archive' : 'query', id);

    addTimeline(
      id,
      actionText,
      action,
      req.user.id,
      comment || actionText,
      order.status,
      nextStatus
    );

    addMessage(
      order.creator_id,
      id,
      action === 'approve' ? '任务已完成归档' : '告警处理被驳回',
      `主单 ${order.order_no} ${action === 'approve' ? '已完成归档' : '告警处理被驳回'}`,
      'notice'
    );

    logOperation(req, `alert_${action}`, 'main_order', id, { status: order.status }, { status: nextStatus });

    return { status: nextStatus, statusLabel: STATUS_LABELS[nextStatus] };
  });

  try {
    const result = transaction();
    res.json({ message: '操作成功', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/archive', (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(id);
    
    if (!order) {
      throw new Error('主单不存在');
    }

    if (order.is_locked) {
      throw new Error('主单已被锁定，正在归档处理中');
    }

    db.prepare(`
      UPDATE main_orders 
      SET is_locked = 1, locked_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, id);

    db.prepare(`
      UPDATE alerts 
      SET is_locked = 1, locked_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE main_order_id = ? AND status != 'resolved'
    `).run(req.user.id, id);

    db.prepare(`
      UPDATE main_orders 
      SET status = ?, current_node = 'archive', is_locked = 0, locked_by = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(STATUSES.ARCHIVED, id);

    db.prepare(`
      UPDATE alerts 
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, is_locked = 0, locked_by = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE main_order_id = ?
    `).run(id);

    addTimeline(
      id,
      '完成归档',
      'archive',
      req.user.id,
      comment || '主单已完成归档',
      order.status,
      STATUSES.ARCHIVED
    );

    addMessage(
      order.creator_id,
      id,
      '任务已归档',
      `主单 ${order.order_no} 已完成归档`,
      'notice'
    );

    logOperation(req, 'archive', 'main_order', id, { status: order.status }, { status: STATUSES.ARCHIVED });

    return { status: STATUSES.ARCHIVED, statusLabel: STATUS_LABELS[STATUSES.ARCHIVED] };
  });

  try {
    const result = transaction();
    res.json({ message: '归档成功', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/statistics/summary', (req, res) => {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM main_orders').get().count,
    pending_collect: db.prepare('SELECT COUNT(*) as count FROM main_orders WHERE status = ?').get(STATUSES.PENDING_COLLECT).count,
    pending_parse: db.prepare('SELECT COUNT(*) as count FROM main_orders WHERE status = ?').get(STATUSES.PENDING_PARSE).count,
    pending_query: db.prepare('SELECT COUNT(*) as count FROM main_orders WHERE status = ?').get(STATUSES.PENDING_QUERY).count,
    pending_alert: db.prepare('SELECT COUNT(*) as count FROM main_orders WHERE status = ?').get(STATUSES.PENDING_ALERT).count,
    archived: db.prepare('SELECT COUNT(*) as count FROM main_orders WHERE status = ?').get(STATUSES.ARCHIVED).count
  };

  const recentOrders = db.prepare(`
    SELECT mo.*, uc.name as creator_name
    FROM main_orders mo
    LEFT JOIN users uc ON mo.creator_id = uc.id
    ORDER BY mo.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    data: {
      stats,
      recentOrders: recentOrders.map(o => ({
        ...o,
        statusLabel: STATUS_LABELS[o.status]
      }))
    }
  });
});

module.exports = router;
