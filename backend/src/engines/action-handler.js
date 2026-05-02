const { getDb } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class ActionHandler {
  constructor() {
    this.db = getDb();
    this.actionExecutors = {
      block_account: this.executeBlockAccount.bind(this),
      block_ip: this.executeBlockIp.bind(this),
      require_mfa: this.executeRequireMfa.bind(this),
      flag_transaction: this.executeFlagTransaction.bind(this),
      notify_admin: this.executeNotifyAdmin.bind(this),
      create_review_task: this.executeCreateReviewTask.bind(this)
    };
  }

  async handleDecision(decisionResult, requestContext) {
    const actions = [];
    const decisionId = decisionResult.decisionId;

    switch (decisionResult.decisionResult) {
      case 'reject':
        actions.push(...await this.handleReject(decisionId, requestContext, decisionResult));
        break;
      case 'review':
        actions.push(...await this.handleReview(decisionId, requestContext, decisionResult));
        break;
      case 'pass':
      default:
        actions.push(...await this.handlePass(decisionId, requestContext, decisionResult));
        break;
    }

    return actions;
  }

  async handleReject(decisionId, requestContext, decisionResult) {
    const actions = [];
    
    const score = decisionResult.score || 0;
    
    if (score >= 80) {
      if (requestContext.userId) {
        const blockAccountAction = await this.executeAction('block_account', decisionId, {
          userId: requestContext.userId,
          duration: 'permanent',
          reason: '高风险自动封禁'
        });
        actions.push(blockAccountAction);
      }
      
      if (requestContext.ip) {
        const blockIpAction = await this.executeAction('block_ip', decisionId, {
          ip: requestContext.ip,
          duration: '24h',
          reason: '高风险IP封禁'
        });
        actions.push(blockIpAction);
      }
    }

    if (score >= 50 && requestContext.userId) {
      const notifyAction = await this.executeAction('notify_admin', decisionId, {
        userId: requestContext.userId,
        score,
        matchedConditions: decisionResult.matchedConditions
      });
      actions.push(notifyAction);
    }

    return actions;
  }

  async handleReview(decisionId, requestContext, decisionResult) {
    const actions = [];
    
    const reviewTask = await this.executeAction('create_review_task', decisionId, {
      userId: requestContext.userId,
      ip: requestContext.ip,
      score: decisionResult.score,
      matchedConditions: decisionResult.matchedConditions,
      riskLevel: decisionResult.score >= 60 ? 'high' : 'medium'
    });
    actions.push(reviewTask);

    return actions;
  }

  async handlePass(decisionId, requestContext, decisionResult) {
    const actions = [];
    
    if (decisionResult.score > 0 && decisionResult.score < 30) {
      const flagAction = await this.executeAction('flag_transaction', decisionId, {
        userId: requestContext.userId,
        score: decisionResult.score,
        note: '低风险标记，持续监控'
      });
      actions.push(flagAction);
    }

    return actions;
  }

  async executeAction(actionType, decisionId, config = {}, executedBy = 'system') {
    const id = `act_${uuidv4().slice(0, 12)}`;
    
    let status = 'completed';
    let actionResult = null;

    try {
      const executor = this.actionExecutors[actionType];
      if (executor) {
        actionResult = await executor(config, decisionId);
      }
    } catch (error) {
      status = 'failed';
      config.error = error.message;
    }

    const stmt = this.db.prepare(`
      INSERT INTO action_records (
        id, decision_id, action_type, target_id, target_type, 
        action_config, executed_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      decisionId,
      actionType,
      config.userId || config.ip || null,
      config.userId ? 'user' : (config.ip ? 'ip' : null),
      JSON.stringify(config),
      executedBy,
      status
    );

    return {
      id,
      actionType,
      status,
      config,
      result: actionResult
    };
  }

  async executeBlockAccount(config, decisionId) {
    console.log(`[ActionHandler] 封禁用户: ${config.userId}, 原因: ${config.reason}`);
    return { blocked: true, userId: config.userId };
  }

  async executeBlockIp(config, decisionId) {
    console.log(`[ActionHandler] 封禁IP: ${config.ip}, 时长: ${config.duration}`);
    return { blocked: true, ip: config.ip };
  }

  async executeRequireMfa(config, decisionId) {
    console.log(`[ActionHandler] 要求MFA验证: ${config.userId}`);
    return { mfaRequired: true, userId: config.userId };
  }

  async executeFlagTransaction(config, decisionId) {
    console.log(`[ActionHandler] 标记交易: userId=${config.userId}, score=${config.score}`);
    return { flagged: true };
  }

  async executeNotifyAdmin(config, decisionId) {
    console.log(`[ActionHandler] 通知管理员: 高风险事件 userId=${config.userId}`);
    return { notified: true };
  }

  async executeCreateReviewTask(config, decisionId) {
    const taskId = `rvw_${uuidv4().slice(0, 10)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO review_tasks (
        id, decision_id, risk_level, current_status
      ) VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      taskId,
      decisionId,
      config.riskLevel || 'medium',
      'pending'
    );

    console.log(`[ActionHandler] 创建审核任务: ${taskId}`);
    return { taskId, created: true };
  }

  getPendingReviewTasks() {
    const stmt = this.db.prepare(`
      SELECT rt.*, dr.score, dr.variables_snapshot, dr.decision_result
      FROM review_tasks rt
      LEFT JOIN decision_records dr ON rt.decision_id = dr.id
      WHERE rt.current_status = 'pending'
      ORDER BY rt.created_at DESC
    `);
    return stmt.all().map(t => ({
      ...t,
      variables_snapshot: JSON.parse(t.variables_snapshot || '{}')
    }));
  }

  resolveReviewTask(taskId, result, comment, operator = 'system') {
    const stmt = this.db.prepare(`
      UPDATE review_tasks 
      SET current_status = ?, review_result = ?, review_comment = ?, 
          reviewed_at = CURRENT_TIMESTAMP, assigned_to = ?
      WHERE id = ? AND current_status = 'pending'
    `);

    const status = result === 'approve' ? 'approved' : 
                   result === 'reject' ? 'rejected' : 'resolved';

    const result2 = stmt.run(status, result, comment, operator, taskId);
    
    if (result2.changes > 0 && result === 'reject') {
      const task = this.getReviewTaskById(taskId);
      if (task) {
        this.optimizeWeightsBasedOnReview(task, result);
      }
    }

    return result2.changes > 0;
  }

  getReviewTaskById(taskId) {
    const stmt = this.db.prepare(`SELECT * FROM review_tasks WHERE id = ?`);
    return stmt.get(taskId);
  }

  optimizeWeightsBasedOnReview(task, reviewResult) {
    if (reviewResult === 'reject') {
      console.log(`[ActionHandler] 根据审核结果优化变量权重: 任务 ${task.id}`);
    }
  }

  getActionRecords(decisionId = null) {
    let sql = `SELECT * FROM action_records ORDER BY executed_at DESC`;
    let params = [];
    if (decisionId) {
      sql = `SELECT * FROM action_records WHERE decision_id = ? ORDER BY executed_at DESC`;
      params = [decisionId];
    }
    const stmt = this.db.prepare(sql);
    return stmt.all(...params).map(r => ({
      ...r,
      action_config: JSON.parse(r.action_config || '{}')
    }));
  }
}

module.exports = ActionHandler;
