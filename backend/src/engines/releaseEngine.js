const { v4: uuidv4 } = require('uuid');

class ReleaseEngine {
  constructor(db, statusEngine, auditEngine) {
    this.db = db;
    this.statusEngine = statusEngine;
    this.auditEngine = auditEngine;
  }

  // 创建新的主单（代码提交）
  createMainOrder(userId, pipelineId, title, description, commitHash, commitMessage, attachments, expectedCompletionAt) {
    // 1. 校验必填项
    if (!pipelineId || !title) {
      return { success: false, error: '流水线和标题为必填项' };
    }

    // 2. 检查流水线是否存在且可用
    const pipeline = this.db.prepare(`
      SELECT * FROM pipelines WHERE id = ? AND status = 'active'
    `).get(pipelineId);

    if (!pipeline) {
      return { success: false, error: '流水线不存在或未激活' };
    }

    // 3. 检查是否有重复的待处理单（同一流水线、同一提交Hash）
    if (commitHash) {
      const existing = this.db.prepare(`
        SELECT id FROM main_orders 
        WHERE pipeline_id = ? AND commit_hash = ? AND status NOT IN ('completed', 'rolled_back')
      `).get(pipelineId, commitHash);
      
      if (existing) {
        return { success: false, error: '该提交已存在进行中的流水线单，请先处理完成' };
      }
    }

    // 4. 生成主单号
    const orderNo = this.statusEngine.generateOrderNo();
    const mainOrderId = uuidv4();
    
    // 5. 开启事务
    const transaction = this.db.transaction(() => {
      // 插入主单 - 初始状态为 pending_code (待代码提交)
      const initialStatus = 'pending_code';
      const currentStage = 'code_submit';
      
      // 获取当前阶段的责任人（开发人员）
      const assigneeRole = this.statusEngine.getAssigneeRoleForStage(currentStage);
      
      // 查找该角色的一个用户作为默认责任人（取第一个）
      const assignee = this.db.prepare(`
        SELECT id FROM users WHERE role = ? LIMIT 1
      `).get(assigneeRole);

      const now = new Date().toISOString();
      
      this.db.prepare(`
        INSERT INTO main_orders 
        (id, order_no, pipeline_id, title, description, commit_hash, commit_message, 
         attachments, status, current_stage, assignee_id, creator_id, expected_completion_at, started_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mainOrderId,
        orderNo,
        pipelineId,
        title,
        description,
        commitHash,
        commitMessage,
        attachments ? JSON.stringify(attachments) : null,
        initialStatus,
        currentStage,
        assignee ? assignee.id : userId, // 如果没有找到，使用创建人
        userId,
        expectedCompletionAt,
        now,
        now
      );

      // 6. 创建明细表
      // 解析流水线的阶段配置
      let stages = [];
      try {
        stages = pipeline.stages ? JSON.parse(pipeline.stages) : [];
      } catch (e) {
        // 默认阶段
        stages = [
          { name: '代码提交', stage_name: 'code_submit', order: 1, type: 'manual' },
          { name: '触发流水线', stage_name: 'trigger', order: 2, type: 'manual' },
          { name: '构建测试', stage_name: 'build_test', order: 3, type: 'auto' },
          { name: '部署', stage_name: 'deploy', order: 4, type: 'manual' },
          { name: '监控回滚', stage_name: 'monitor', order: 5, type: 'manual' }
        ];
      }

      const insertItem = this.db.prepare(`
        INSERT INTO order_items 
        (id, main_order_id, item_no, stage_name, stage_order, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `);

      for (const stage of stages) {
        const itemId = uuidv4();
        const itemNo = this.statusEngine.generateItemNo(orderNo, stage.order);
        insertItem.run(itemId, mainOrderId, itemNo, stage.stage_name, stage.order);
      }

      // 7. 更新当前阶段的明细状态为 in_progress
      this.db.prepare(`
        UPDATE order_items 
        SET status = 'in_progress', assignee_id = ?, started_at = CURRENT_TIMESTAMP
        WHERE main_order_id = ? AND stage_name = ?
      `).run(assignee ? assignee.id : userId, mainOrderId, currentStage);

      // 8. 创建待办消息
      this.auditEngine.createTodosByRole(
        assigneeRole,
        mainOrderId,
        null,
        `新流水线单待处理: ${title}`,
        `主单号: ${orderNo}，请处理代码提交流程`,
        'task'
      );

      // 9. 添加时间轴记录
      const creator = this.db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
      this.auditEngine.addTimeline(
        mainOrderId,
        null,
        userId,
        creator ? creator.name : '未知用户',
        'create',
        '创建流水线单',
        {
          orderNo,
          title,
          pipelineName: pipeline.name,
          commitHash
        },
        initialStatus
      );

      // 10. 记录操作日志
      this.auditEngine.logOperation(
        userId,
        'create',
        'order',
        mainOrderId,
        null,
        { orderNo, title, pipelineId },
        '创建CI/CD流水线单'
      );
    });

    try {
      transaction();
      
      // 返回创建的主单信息
      const newOrder = this.db.prepare(`
        SELECT mo.*, p.name as pipeline_name, u.name as assignee_name, uc.name as creator_name
        FROM main_orders mo
        LEFT JOIN pipelines p ON mo.pipeline_id = p.id
        LEFT JOIN users u ON mo.assignee_id = u.id
        LEFT JOIN users uc ON mo.creator_id = uc.id
        WHERE mo.id = ?
      `).get(mainOrderId);

      return { success: true, data: newOrder };
    } catch (error) {
      console.error('创建主单失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 执行状态流转（核心方法）
  transitionStatus(mainOrderId, userId, action, resultData = {}, comment = '') {
    const mainOrder = this.db.prepare(`
      SELECT * FROM main_orders WHERE id = ?
    `).get(mainOrderId);

    if (!mainOrder) {
      return { success: false, error: '主单不存在' };
    }

    // 1. 检查状态转换是否允许
    const transitionCheck = this.statusEngine.canTransition(mainOrder.status, action);
    if (!transitionCheck.allowed) {
      return { success: false, error: transitionCheck.reason };
    }

    // 2. 检查权限
    const permCheck = this.auditEngine.checkPermission(userId, action, mainOrderId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason };
    }

    const user = permCheck.user;

    // 获取当前阶段对应的明细
    const currentItem = this.db.prepare(`
      SELECT * FROM order_items WHERE main_order_id = ? AND stage_name = ?
    `).get(mainOrderId, mainOrder.current_stage);

    // 开始事务
    const transaction = this.db.transaction(() => {
      const now = new Date().toISOString();
      
      // 处理不同的动作
      let isSuccess = true;
      let nextStatus = null;

      switch (action) {
        case 'submit_code':
          // 代码提交 -> 待触发流水线
          // 完成当前阶段明细
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
                  result_data = ?, duration = strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at)
              WHERE id = ?
            `).run(JSON.stringify(resultData), currentItem.id);
          }
          nextStatus = 'pending_trigger';
          break;

        case 'trigger_pipeline':
          // 触发流水线 -> 待构建测试
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
                  result_data = ?, duration = strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at)
              WHERE id = ?
            `).run(JSON.stringify(resultData), currentItem.id);
          }
          nextStatus = 'pending_build';
          break;

        case 'start_build':
        case 'retry_build':
          // 开始构建 - 这个通常会模拟执行，这里简化处理
          // 实际应用中这里可能是异步的
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'in_progress', started_at = CURRENT_TIMESTAMP, assignee_id = ?
              WHERE id = ?
            `).run(userId, currentItem.id);
          }
          
          // 模拟构建结果（实际应该异步）
          // 这里我们简单认为成功，实际可能需要异步处理
          // 为了演示，我们假设构建成功
          const buildSuccess = resultData.buildSuccess !== false;
          
          if (buildSuccess) {
            // 构建成功
            if (currentItem) {
              this.db.prepare(`
                UPDATE order_items 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
                    result_data = ?, retry_count = retry_count + 1,
                    duration = strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at)
                WHERE id = ?
              `).run(JSON.stringify(resultData), currentItem.id);
            }
            nextStatus = 'pending_deploy';
          } else {
            // 构建失败
            isSuccess = false;
            if (currentItem) {
              this.db.prepare(`
                UPDATE order_items 
                SET status = 'failed', completed_at = CURRENT_TIMESTAMP, 
                    error_message = ?, retry_count = retry_count + 1,
                    duration = strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at)
                WHERE id = ?
              `).run(resultData.errorMessage || '构建失败', currentItem.id);
            }
            nextStatus = 'failed';
          }
          break;

        case 'approve_deploy':
        case 'start_deploy':
          // 审批/开始部署 -> 待监控
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
                  result_data = ?, duration = strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at)
              WHERE id = ?
            `).run(JSON.stringify({ ...resultData, comment }), currentItem.id);
          }
          
          // 记录审批
          this.auditEngine.recordApproval(
            mainOrderId,
            currentItem?.id,
            userId,
            'deploy',
            'approve',
            comment
          );
          
          nextStatus = 'pending_monitor';
          break;

        case 'approve_pass':
          // 审批通过 -> 已完成
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
                  result_data = ?, duration = strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at)
              WHERE id = ?
            `).run(JSON.stringify({ ...resultData, comment }), currentItem.id);
          }
          
          this.auditEngine.recordApproval(
            mainOrderId,
            currentItem?.id,
            userId,
            'monitor',
            'approve',
            comment
          );
          
          nextStatus = 'completed';
          break;

        case 'reject':
          // 驳回 -> 失败或回到上一阶段
          isSuccess = false;
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'failed', completed_at = CURRENT_TIMESTAMP, 
                  error_message = ?
              WHERE id = ?
            `).run(comment || '审批被驳回', currentItem.id);
          }
          
          this.auditEngine.recordApproval(
            mainOrderId,
            currentItem?.id,
            userId,
            'monitor',
            'reject',
            comment
          );
          
          nextStatus = 'failed';
          break;

        case 'rollback':
          // 回滚
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'failed', completed_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(currentItem.id);
          }
          
          this.auditEngine.recordApproval(
            mainOrderId,
            currentItem?.id,
            userId,
            'rollback',
            'rollback',
            comment
          );
          
          nextStatus = 'rolled_back';
          break;

        case 'retry':
          // 重试 - 重置状态
          if (currentItem) {
            this.db.prepare(`
              UPDATE order_items 
              SET status = 'pending', retry_count = retry_count + 1,
                  started_at = NULL, completed_at = NULL, error_message = NULL
              WHERE id = ?
            `).run(currentItem.id);
          }
          // 重试需要重新判断回到哪个状态
          // 简单处理：回到当前阶段的待处理状态
          nextStatus = this.statusEngine.getNextStatus(mainOrder.status, action, true);
          if (!nextStatus) {
            // 如果没有定义重试后的状态，回到当前阶段对应的初始状态
            nextStatus = mainOrder.status;
          }
          break;

        default:
          nextStatus = this.statusEngine.getNextStatus(mainOrder.status, action, isSuccess);
      }

      // 确定下一阶段
      let nextStage = null;
      if (nextStatus && STATUS_TO_STAGE[nextStatus]) {
        nextStage = STATUS_TO_STAGE[nextStatus];
      }

      // 更新主单状态
      const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [nextStatus];

      if (nextStage) {
        updateFields.push('current_stage = ?');
        updateValues.push(nextStage);
      }

      if (nextStatus === 'completed' || nextStatus === 'failed' || nextStatus === 'rolled_back') {
        updateFields.push('completed_at = CURRENT_TIMESTAMP');
        updateFields.push('total_duration = strftime("%s", CURRENT_TIMESTAMP) - strftime("%s", started_at)');
      }

      // 找到下一阶段的责任人
      let nextAssigneeId = null;
      if (nextStage) {
        const nextRole = this.statusEngine.getAssigneeRoleForStage(nextStage);
        if (nextRole) {
          const nextUser = this.db.prepare(`
            SELECT id FROM users WHERE role = ? LIMIT 1
          `).get(nextRole);
          nextAssigneeId = nextUser?.id;
          
          if (nextAssigneeId) {
            updateFields.push('assignee_id = ?');
            updateValues.push(nextAssigneeId);
          }
        }
      }

      updateValues.push(mainOrderId);

      this.db.prepare(`
        UPDATE main_orders SET ${updateFields.join(', ')} WHERE id = ?
      `).run(...updateValues);

      // 初始化下一阶段的明细
      if (nextStage) {
        const nextItem = this.db.prepare(`
          SELECT * FROM order_items WHERE main_order_id = ? AND stage_name = ?
        `).get(mainOrderId, nextStage);
        
        if (nextItem && nextItem.status === 'pending') {
          this.db.prepare(`
            UPDATE order_items 
            SET status = 'in_progress', assignee_id = ?, started_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(nextAssigneeId || userId, nextItem.id);
        }

        // 创建下一阶段的待办
        if (nextAssigneeId) {
          const nextRole = this.statusEngine.getAssigneeRoleForStage(nextStage);
          this.auditEngine.createTodo(
            nextAssigneeId,
            mainOrderId,
            nextItem?.id,
            `流水线单待处理: ${this.statusEngine.getStageText(nextStage)}`,
            `主单号: ${mainOrder.order_no}，当前阶段: ${this.statusEngine.getStageText(nextStage)}`,
            'task'
          );
        }
      }

      // 完成当前用户的待办
      const currentTodo = this.db.prepare(`
        SELECT id FROM todos 
        WHERE main_order_id = ? AND user_id = ? AND status = 'pending'
        LIMIT 1
      `).get(mainOrderId, userId);
      
      if (currentTodo) {
        this.auditEngine.completeTodo(currentTodo.id);
      }

      // 添加时间轴记录
      this.auditEngine.addTimeline(
        mainOrderId,
        currentItem?.id,
        userId,
        user.name,
        action,
        this.statusEngine.getActionText(action),
        {
          fromStatus: mainOrder.status,
          toStatus: nextStatus,
          resultData,
          comment
        },
        nextStatus
      );

      // 记录操作日志
      this.auditEngine.logOperation(
        userId,
        action,
        'order',
        mainOrderId,
        { status: mainOrder.status },
        { status: nextStatus, resultData },
        `${this.statusEngine.getActionText(action)}，状态从 ${this.statusEngine.getStatusText(mainOrder.status)} 变为 ${this.statusEngine.getStatusText(nextStatus)}`
      );
    });

    try {
      transaction();
      
      // 返回更新后的主单
      const updatedOrder = this.db.prepare(`
        SELECT mo.*, p.name as pipeline_name, u.name as assignee_name, uc.name as creator_name
        FROM main_orders mo
        LEFT JOIN pipelines p ON mo.pipeline_id = p.id
        LEFT JOIN users u ON mo.assignee_id = u.id
        LEFT JOIN users uc ON mo.creator_id = uc.id
        WHERE mo.id = ?
      `).get(mainOrderId);

      return { success: true, data: updatedOrder };
    } catch (error) {
      console.error('状态流转失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 锁定变量（防止并发修改）
  lockVariables(pipelineId, environmentId, userId) {
    // 使用事务保证原子性
    const transaction = this.db.transaction(() => {
      // 检查是否已被锁定
      const locked = this.db.prepare(`
        SELECT * FROM variables 
        WHERE pipeline_id = ? AND (environment_id = ? OR environment_id IS NULL) AND is_locked = 1
      `).all(pipelineId, environmentId);

      if (locked.length > 0) {
        const locker = this.db.prepare('SELECT name FROM users WHERE id = ?').get(locked[0].locked_by);
        throw new Error(`变量已被 ${locker?.name || '其他用户'} 锁定，请稍后再试`);
      }

      // 加锁
      const now = new Date().toISOString();
      this.db.prepare(`
        UPDATE variables 
        SET is_locked = 1, locked_by = ?, locked_at = ?
        WHERE pipeline_id = ? AND (environment_id = ? OR environment_id IS NULL)
      `).run(userId, now, pipelineId, environmentId);
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 解锁变量
  unlockVariables(pipelineId, environmentId) {
    this.db.prepare(`
      UPDATE variables 
      SET is_locked = 0, locked_by = NULL, locked_at = NULL
      WHERE pipeline_id = ? AND (environment_id = ? OR environment_id IS NULL)
    `).run(pipelineId, environmentId);
    
    return { success: true };
  }

  // 获取报表统计数据
  getReportStats(startDate, endDate) {
    // 总单数
    const total = this.db.prepare(`
      SELECT COUNT(*) as count FROM main_orders 
      WHERE created_at >= ? AND created_at <= ?
    `).get(startDate, endDate);

    // 各状态数量
    const byStatus = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM main_orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY status
    `).all(startDate, endDate);

    // 平均处理时长
    const avgDuration = this.db.prepare(`
      SELECT AVG(total_duration) as avg_seconds
      FROM main_orders 
      WHERE created_at >= ? AND created_at <= ? AND total_duration IS NOT NULL
    `).get(startDate, endDate);

    // 异常比例（失败和回滚的比例）
    const failedCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM main_orders 
      WHERE created_at >= ? AND created_at <= ? AND status IN ('failed', 'rolled_back')
    `).get(startDate, endDate);

    // 按天统计
    const dailyStats = this.db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'rolled_back' THEN 1 ELSE 0 END) as rolled_back,
        AVG(total_duration) as avg_duration
      FROM main_orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY date(created_at)
      ORDER BY day
    `).all(startDate, endDate);

    return {
      total: total.count,
      byStatus,
      avgDuration: avgDuration.avg_seconds,
      failureRate: total.count > 0 ? (failedCount.count / total.count * 100).toFixed(2) : 0,
      dailyStats
    };
  }
}

// 导入依赖
const STATUS_TO_STAGE = {
  pending_code: 'code_submit',
  pending_trigger: 'trigger',
  pending_build: 'build_test',
  pending_deploy: 'deploy',
  pending_monitor: 'monitor'
};

module.exports = ReleaseEngine;
