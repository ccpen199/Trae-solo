const { v4: uuidv4 } = require('uuid');

class AuditEngine {
  constructor(db) {
    this.db = db;
  }

  // 记录操作日志
  logOperation(userId, action, module, recordId, oldValue = null, newValue = null, description = '', ip = null, userAgent = null) {
    const stmt = this.db.prepare(`
      INSERT INTO operation_logs 
      (id, user_id, action, module, record_id, old_value, new_value, description, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      uuidv4(),
      userId,
      action,
      module,
      recordId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      description,
      ip,
      userAgent
    );
    
    return result.lastInsertRowid;
  }

  // 添加时间轴记录
  addTimeline(mainOrderId, orderItemId, actorId, actorName, action, actionText, details = {}, status = null) {
    const stmt = this.db.prepare(`
      INSERT INTO timeline 
      (id, main_order_id, order_item_id, actor_id, actor_name, action, action_text, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      uuidv4(),
      mainOrderId,
      orderItemId,
      actorId,
      actorName,
      action,
      actionText,
      JSON.stringify(details),
      status
    );
    
    return result.lastInsertRowid;
  }

  // 创建待办消息
  createTodo(userId, mainOrderId, orderItemId, title, description, todoType = 'task', priority = 'medium', dueAt = null, actionUrl = null) {
    const stmt = this.db.prepare(`
      INSERT INTO todos 
      (id, user_id, main_order_id, order_item_id, title, description, todo_type, status, priority, due_at, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      uuidv4(),
      userId,
      mainOrderId,
      orderItemId,
      title,
      description,
      todoType,
      priority,
      dueAt,
      actionUrl
    );
    
    return result.lastInsertRowid;
  }

  // 完成待办
  completeTodo(todoId) {
    const stmt = this.db.prepare(`
      UPDATE todos SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(todoId);
  }

  // 根据角色批量创建待办
  createTodosByRole(role, mainOrderId, orderItemId, title, description, todoType = 'task') {
    // 查找该角色的所有用户
    const users = this.db.prepare(`
      SELECT id FROM users WHERE role = ?
    `).all(role);
    
    const todoIds = [];
    for (const user of users) {
      const id = this.createTodo(
        user.id,
        mainOrderId,
        orderItemId,
        title,
        description,
        todoType
      );
      todoIds.push(id);
    }
    
    return todoIds;
  }

  // 记录审批
  recordApproval(mainOrderId, orderItemId, approverId, approvalType, decision, comment = null, attachments = null) {
    const stmt = this.db.prepare(`
      INSERT INTO approvals 
      (id, main_order_id, order_item_id, approver_id, approval_type, decision, comment, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      uuidv4(),
      mainOrderId,
      orderItemId,
      approverId,
      approvalType,
      decision,
      comment,
      attachments ? JSON.stringify(attachments) : null
    );
    
    return result.lastInsertRowid;
  }

  // 检查用户是否有权限执行某个动作
  checkPermission(userId, action, mainOrderId = null) {
    // 获取用户角色
    const user = this.db.prepare(`
      SELECT id, name, role FROM users WHERE id = ?
    `).get(userId);
    
    if (!user) {
      return { allowed: false, reason: '用户不存在' };
    }

    // 角色权限矩阵
    const rolePermissions = {
      developer: ['submit_code', 'trigger_pipeline', 'start_build', 'retry_build', 'retry', 'view'],
      tester: ['start_build', 'retry_build', 'complete', 'fail', 'retry', 'view'],
      ops: ['approve_deploy', 'start_deploy', 'rollback', 'retry', 'view'],
      release_manager: ['approve_pass', 'reject', 'supplement', 'reassign', 'rollback', 'retry', 'view']
    };

    const allowedActions = rolePermissions[user.role] || [];
    
    // 基础动作权限检查
    if (!allowedActions.includes(action) && action !== 'view') {
      return { 
        allowed: false, 
        reason: `角色 ${user.role} 不允许执行动作 ${action}`,
        userRole: user.role
      };
    }

    // 如果有主单ID，检查是否是责任人或创建人
    if (mainOrderId) {
      const order = this.db.prepare(`
        SELECT assignee_id, creator_id, status FROM main_orders WHERE id = ?
      `).get(mainOrderId);
      
      if (!order) {
        return { allowed: false, reason: '主单不存在' };
      }

      // 管理员角色可以操作所有（这里简单处理，release_manager 可以看作有高级权限）
      if (user.role === 'release_manager') {
        return { allowed: true, user, order };
      }

      // 检查是否是当前责任人或创建人
      if (order.assignee_id !== userId && order.creator_id !== userId) {
        // 查看权限总是允许
        if (action === 'view') {
          return { allowed: true, user, order };
        }
        return { 
          allowed: false, 
          reason: '不是当前责任人，无法执行此操作',
          user,
          order
        };
      }
    }

    return { allowed: true, user };
  }

  // 获取用户的待办数量
  getUserTodoCount(userId) {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM todos 
      WHERE user_id = ? AND status = 'pending'
    `).get(userId);
    return result.count;
  }

  // 获取操作日志列表
  getOperationLogs(module, recordId, limit = 50) {
    let query = `
      SELECT ol.*, u.name as user_name, u.username 
      FROM operation_logs ol 
      LEFT JOIN users u ON ol.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (module) {
      query += ' AND ol.module = ?';
      params.push(module);
    }
    if (recordId) {
      query += ' AND ol.record_id = ?';
      params.push(recordId);
    }
    
    query += ' ORDER BY ol.created_at DESC LIMIT ?';
    params.push(limit);
    
    return this.db.prepare(query).all(...params);
  }

  // 获取时间轴
  getTimeline(mainOrderId, limit = 100) {
    return this.db.prepare(`
      SELECT t.*, u.name as actor_name
      FROM timeline t
      LEFT JOIN users u ON t.actor_id = u.id
      WHERE t.main_order_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(mainOrderId, limit);
  }
}

module.exports = AuditEngine;
