const express = require('express');
const { query, run } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotent');
const stateMachine = require('../services/stateMachine');
const ruleEngine = require('../services/ruleEngine');

const router = express.Router();

router.get('/', authenticate, requirePermission('ticket:view'), async (req, res) => {
  try {
    const { status, current_node, assignee_id, reporter_id, search, page = 1, pageSize = 20 } = req.query;
    
    let sql = `SELECT t.*, 
                u1.name as assignee_name, 
                u2.name as reporter_name,
                (SELECT COUNT(*) FROM messages m WHERE m.ticket_id = t.id AND m.status = 'unread') as unread_messages
               FROM tickets t
               LEFT JOIN users u1 ON t.assignee_id = u1.id
               LEFT JOIN users u2 ON t.reporter_id = u2.id
               WHERE 1=1`;
    const params = [];
    
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (current_node) {
      sql += ' AND t.current_node = ?';
      params.push(current_node);
    }
    if (assignee_id) {
      sql += ' AND t.assignee_id = ?';
      params.push(assignee_id);
    }
    if (reporter_id) {
      sql += ' AND t.reporter_id = ?';
      params.push(reporter_id);
    }
    if (search) {
      sql += ' AND (t.title LIKE ? OR t.ticket_no LIKE ? OR t.description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    sql += ' ORDER BY t.created_at DESC';
    
    const allTickets = query(sql, params);
    const total = allTickets.length;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const tickets = query(sql, params);
    
    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取工单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/my', authenticate, requirePermission('ticket:view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, pageSize = 20 } = req.query;
    
    let sql = `SELECT t.*, 
                u1.name as assignee_name, 
                u2.name as reporter_name,
                (SELECT COUNT(*) FROM messages m WHERE m.ticket_id = t.id AND m.status = 'unread' AND m.user_id = ?) as unread_messages
               FROM tickets t
               LEFT JOIN users u1 ON t.assignee_id = u1.id
               LEFT JOIN users u2 ON t.reporter_id = u2.id
               WHERE (t.assignee_id = ? OR t.reporter_id = ?)`;
    const params = [userId, userId, userId];
    
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY t.created_at DESC';
    
    const allTickets = query(sql, params);
    const total = allTickets.length;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const tickets = query(sql, params);
    
    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取我的工单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/:id', authenticate, requirePermission('ticket:view'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const tickets = query(
      `SELECT t.*, 
       u1.name as assignee_name, 
       u2.name as reporter_name
       FROM tickets t
       LEFT JOIN users u1 ON t.assignee_id = u1.id
       LEFT JOIN users u2 ON t.reporter_id = u2.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    const ticket = tickets[0];
    
    const metrics = query(
      'SELECT * FROM metrics WHERE ticket_id = ? ORDER BY created_at',
      [id]
    );
    
    const items = query(
      'SELECT * FROM ticket_items WHERE ticket_id = ? ORDER BY sequence',
      [id]
    );
    
    const transitions = stateMachine.getTicketTransitions(id);
    
    const logs = query(
      `SELECT l.*, u.name as user_name
       FROM logs l
       LEFT JOIN users u ON l.locked_by = u.id
       WHERE l.ticket_id = ?
       ORDER BY l.log_time DESC`,
      [id]
    );
    
    const availableActions = stateMachine.getAvailableActions(ticket);
    
    res.json({
      success: true,
      data: {
        ticket,
        metrics,
        items,
        transitions,
        logs,
        availableActions
      }
    });
  } catch (error) {
    console.error('获取工单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/', authenticate, requirePermission('ticket:create'), checkIdempotency, async (req, res) => {
  try {
    const { title, description, type, priority, assignee_id, expected_finish_time, attachments, metrics, items } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空'
      });
    }
    
    const ticket = stateMachine.createTicket(
      {
        title,
        description,
        type: type || 'alert',
        priority: priority || 'medium',
        assignee_id,
        expected_finish_time,
        attachments,
        metrics,
        items
      },
      req.user.id
    );
    
    res.json({
      success: true,
      message: '工单创建成功',
      data: { ticket }
    });
  } catch (error) {
    console.error('创建工单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/:id/action', authenticate, requirePermission('ticket:edit'), checkIdempotency, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, newAssigneeId, reason } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: '操作类型不能为空'
      });
    }
    
    const ticket = stateMachine.getTicketById(parseInt(id));
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    if (!stateMachine.canTransition(ticket, action)) {
      return res.status(400).json({
        success: false,
        message: `当前状态 [${ticket.status}] 不允许执行操作 [${action}]`
      });
    }
    
    const details = {};
    if (newAssigneeId) details.newAssigneeId = newAssigneeId;
    if (reason) details.reason = reason;
    
    const result = stateMachine.transition(
      parseInt(id),
      action,
      req.user.id,
      comment,
      details
    );
    
    res.json({
      success: true,
      message: '操作成功',
      data: result
    });
  } catch (error) {
    console.error('工单操作错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/:id/lock', authenticate, requirePermission('ticket:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    
    stateMachine.lockTicket(parseInt(id), req.user.id);
    
    res.json({
      success: true,
      message: '锁定成功'
    });
  } catch (error) {
    console.error('锁定工单错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/unlock', authenticate, requirePermission('ticket:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    
    stateMachine.unlockTicket(parseInt(id), req.user.id);
    
    res.json({
      success: true,
      message: '解锁成功'
    });
  } catch (error) {
    console.error('解锁工单错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', authenticate, requirePermission('ticket:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, assignee_id, expected_finish_time } = req.body;
    
    const existing = stateMachine.getTicketById(parseInt(id));
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    const newVersion = (existing.version || 1) + 1;
    
    run(
      `UPDATE tickets 
       SET title = ?, description = ?, priority = ?, assignee_id = ?, 
           expected_finish_time = ?, version = ?, updated_at = datetime('now')
       WHERE id = ? AND version = ?`,
      [
        title || existing.title,
        description !== undefined ? description : existing.description,
        priority || existing.priority,
        assignee_id !== undefined ? assignee_id : existing.assignee_id,
        expected_finish_time !== undefined ? expected_finish_time : existing.expected_finish_time,
        newVersion,
        id,
        existing.version
      ]
    );
    
    const updatedTicket = stateMachine.getTicketById(parseInt(id));
    
    stateMachine.logOperation(req.user.id, 'ticket', 'update', id, existing, req.body);
    
    res.json({
      success: true,
      message: '更新成功',
      data: { ticket: updatedTicket }
    });
  } catch (error) {
    console.error('更新工单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
