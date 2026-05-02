const { v4: uuidv4 } = require('uuid');

// 状态流转定义
const STATUS_FLOW = {
  // 主单状态流转
  main_order: {
    // 待代码提交
    pending_code: {
      allowed_actions: ['submit_code'],
      next_status: 'pending_trigger',
      stage_name: 'code_submit'
    },
    // 待触发流水线
    pending_trigger: {
      allowed_actions: ['trigger_pipeline'],
      next_status: 'pending_build',
      stage_name: 'trigger'
    },
    // 待构建测试
    pending_build: {
      allowed_actions: ['start_build', 'retry_build'],
      next_status: 'pending_deploy',
      stage_name: 'build_test',
      auto_action: true // 可自动执行
    },
    // 待部署
    pending_deploy: {
      allowed_actions: ['approve_deploy', 'start_deploy'],
      next_status: 'pending_monitor',
      stage_name: 'deploy',
      needs_approval: true
    },
    // 待监控回滚
    pending_monitor: {
      allowed_actions: ['approve_pass', 'reject', 'supplement', 'reassign', 'rollback'],
      next_status: 'completed',
      stage_name: 'monitor',
      failure_status: 'failed',
      rollback_status: 'rolled_back'
    },
    // 终止状态
    completed: { allowed_actions: [], is_terminal: true },
    failed: { 
      allowed_actions: ['retry', 'rollback'],
      is_terminal: false 
    },
    rolled_back: { 
      allowed_actions: ['retry'],
      is_terminal: true 
    }
  },
  // 明细项状态
  order_item: {
    pending: {
      allowed_actions: ['start'],
      next_status: 'in_progress'
    },
    in_progress: {
      allowed_actions: ['complete', 'fail', 'skip'],
      next_status: 'completed',
      failure_status: 'failed'
    },
    completed: { allowed_actions: [], is_terminal: true },
    failed: { 
      allowed_actions: ['retry'],
      is_terminal: false,
      retry_status: 'pending'
    },
    skipped: { allowed_actions: [], is_terminal: true }
  }
};

// 阶段和状态映射
const STAGE_TO_STATUS = {
  code_submit: 'pending_code',
  trigger: 'pending_trigger',
  build_test: 'pending_build',
  deploy: 'pending_deploy',
  monitor: 'pending_monitor'
};

const STATUS_TO_STAGE = {
  pending_code: 'code_submit',
  pending_trigger: 'trigger',
  pending_build: 'build_test',
  pending_deploy: 'deploy',
  pending_monitor: 'monitor'
};

// 阶段顺序
const STAGE_ORDER = ['code_submit', 'trigger', 'build_test', 'deploy', 'monitor'];

class StatusEngine {
  constructor(db) {
    this.db = db;
  }

  // 校验状态转换是否允许
  canTransition(currentStatus, action, type = 'main_order') {
    const flow = STATUS_FLOW[type];
    if (!flow[currentStatus]) {
      return { allowed: false, reason: '无效的当前状态' };
    }
    
    const statusConfig = flow[currentStatus];
    if (statusConfig.is_terminal) {
      return { allowed: false, reason: '当前状态已终止' };
    }
    
    if (!statusConfig.allowed_actions.includes(action)) {
      return { 
        allowed: false, 
        reason: `当前状态不允许执行此动作，允许的动作: ${statusConfig.allowed_actions.join(', ')}` 
      };
    }
    
    return { allowed: true };
  }

  // 获取下一状态
  getNextStatus(currentStatus, action, isSuccess = true, type = 'main_order') {
    const flow = STATUS_FLOW[type];
    const config = flow[currentStatus];
    
    if (!config) return null;
    
    // 处理失败情况
    if (!isSuccess && config.failure_status) {
      return config.failure_status;
    }
    
    // 处理回滚
    if (action === 'rollback' && config.rollback_status) {
      return config.rollback_status;
    }
    
    // 重试回退到待处理
    if (action === 'retry' && config.retry_status) {
      return config.retry_status;
    }
    
    return config.next_status;
  }

  // 获取当前状态可用的动作
  getAvailableActions(status, type = 'main_order') {
    const flow = STATUS_FLOW[type];
    if (!flow[status]) return [];
    return flow[status].allowed_actions || [];
  }

  // 检查状态是否需要审批
  needsApproval(status) {
    const config = STATUS_FLOW.main_order[status];
    return config?.needs_approval || false;
  }

  // 检查是否可自动执行
  isAutoAction(status) {
    const config = STATUS_FLOW.main_order[status];
    return config?.auto_action || false;
  }

  // 生成主单号
  generateOrderNo() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 获取今日的序号
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM main_orders 
      WHERE strftime('%Y%m%d', created_at) = ?
    `).get(dateStr);
    
    const seq = String(result.count + 1).padStart(4, '0');
    return `CI${dateStr}${seq}`;
  }

  // 生成明细单号
  generateItemNo(mainOrderNo, stageOrder) {
    return `${mainOrderNo}-${String(stageOrder).padStart(2, '0')}`;
  }

  // 根据阶段获取责任人角色
  getAssigneeRoleForStage(stageName) {
    const stageRoleMap = {
      code_submit: 'developer',
      trigger: 'developer',
      build_test: 'tester',
      deploy: 'ops',
      monitor: 'release_manager'
    };
    return stageRoleMap[stageName] || null;
  }

  // 获取下一个阶段
  getNextStage(currentStage) {
    const index = STAGE_ORDER.indexOf(currentStage);
    if (index >= 0 && index < STAGE_ORDER.length - 1) {
      return STAGE_ORDER[index + 1];
    }
    return null;
  }

  // 获取所有阶段
  getAllStages() {
    return [...STAGE_ORDER];
  }

  // 状态到中文描述
  getStatusText(status) {
    const statusTextMap = {
      pending_code: '待代码提交',
      pending_trigger: '待触发流水线',
      pending_build: '待构建测试',
      pending_deploy: '待部署',
      pending_monitor: '待监控回滚',
      completed: '已完成',
      failed: '失败',
      rolled_back: '已回滚'
    };
    return statusTextMap[status] || status;
  }

  // 动作到中文描述
  getActionText(action) {
    const actionTextMap = {
      submit_code: '提交代码',
      trigger_pipeline: '触发流水线',
      start_build: '开始构建',
      retry_build: '重试构建',
      approve_deploy: '审批部署',
      start_deploy: '开始部署',
      approve_pass: '审批通过',
      reject: '驳回',
      supplement: '补充资料',
      reassign: '转派',
      rollback: '回滚',
      retry: '重试',
      start: '开始',
      complete: '完成',
      fail: '失败',
      skip: '跳过'
    };
    return actionTextMap[action] || action;
  }

  // 阶段到中文描述
  getStageText(stageName) {
    const stageTextMap = {
      code_submit: '代码提交',
      trigger: '触发流水线',
      build_test: '构建测试',
      deploy: '部署',
      monitor: '监控回滚'
    };
    return stageTextMap[stageName] || stageName;
  }

  // 明细状态到中文
  getItemStatusText(status) {
    const map = {
      pending: '待处理',
      in_progress: '处理中',
      completed: '已完成',
      failed: '失败',
      skipped: '已跳过'
    };
    return map[status] || status;
  }
}

module.exports = StatusEngine;
