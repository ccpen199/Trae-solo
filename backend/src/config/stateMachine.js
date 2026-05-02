const { STATUS, ACTIONS, ROLES } = require('../models/initDb');

const STATE_CONFIG = {
  [STATUS.PENDING_MODEL_LOAD]: {
    name: '待加载模型',
    description: '消费者提交3D模型相关信息的初始状态',
    allowedRoles: [ROLES.CONSUMER, ROLES.OPERATOR],
    allowedActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.CANCEL],
    forbiddenActions: [ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.SELECT_CONFIG],
    responsibleRole: ROLES.CONSUMER,
    nextStatus: STATUS.PENDING_INTERACTION,
    downstreamImpact: '提交后流转至设计师进行交互查看'
  },
  [STATUS.PENDING_INTERACTION]: {
    name: '待交互查看',
    description: '设计师进行材质校验和交互确认的状态',
    allowedRoles: [ROLES.DESIGNER, ROLES.OPERATOR],
    allowedActions: [ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.SUPPLEMENT, ACTIONS.TRANSFER],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.SELECT_CONFIG],
    responsibleRole: ROLES.DESIGNER,
    nextStatus: STATUS.PENDING_CONFIG_SELECTION,
    downstreamImpact: '通过后流转至运营进行配置选择；驳回则回退至上一节点'
  },
  [STATUS.PENDING_CONFIG_SELECTION]: {
    name: '待选择配置',
    description: '运营人员根据热点和规则选择配置项的状态',
    allowedRoles: [ROLES.OPERATOR, ROLES.DESIGNER],
    allowedActions: [ACTIONS.SELECT_CONFIG, ACTIONS.TRANSFER, ACTIONS.CANCEL],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.APPROVE],
    responsibleRole: ROLES.OPERATOR,
    nextStatus: STATUS.PENDING_QUOTE,
    downstreamImpact: '配置确认后流转至销售生成报价'
  },
  [STATUS.PENDING_QUOTE]: {
    name: '待生成报价',
    description: '销售锁定配置并生成正式报价的状态',
    allowedRoles: [ROLES.SALES, ROLES.OPERATOR],
    allowedActions: [ACTIONS.GENERATE_QUOTE, ACTIONS.CANCEL, ACTIONS.TRANSFER],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.APPROVE],
    responsibleRole: ROLES.SALES,
    nextStatus: STATUS.PENDING_LEAD,
    downstreamImpact: '报价生成后流转至消费者进行留资确认'
  },
  [STATUS.PENDING_LEAD]: {
    name: '待留资',
    description: '消费者确认报价并提交联系方式的最终状态',
    allowedRoles: [ROLES.CONSUMER, ROLES.SALES],
    allowedActions: [ACTIONS.SUBMIT_LEAD, ACTIONS.CANCEL, ACTIONS.REVERT],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.SELECT_CONFIG],
    responsibleRole: ROLES.CONSUMER,
    nextStatus: STATUS.COMPLETED,
    downstreamImpact: '留资后流程闭环，标记为完成'
  },
  [STATUS.COMPLETED]: {
    name: '已完成',
    description: '流程已闭环完成的状态',
    allowedRoles: [ROLES.OPERATOR],
    allowedActions: [ACTIONS.REVERT],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.APPROVE, ACTIONS.SELECT_CONFIG],
    responsibleRole: null,
    nextStatus: STATUS.ARCHIVED,
    downstreamImpact: '完成后可进行归档操作'
  },
  [STATUS.ARCHIVED]: {
    name: '已归档',
    description: '记录已归档，仅可通过冲正/补录/重开修改',
    allowedRoles: [ROLES.OPERATOR],
    allowedActions: [],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.APPROVE, ACTIONS.SELECT_CONFIG, ACTIONS.CANCEL],
    responsibleRole: null,
    nextStatus: null,
    downstreamImpact: '归档后记录不可直接修改，需通过专用流程修正'
  },
  [STATUS.REJECTED]: {
    name: '已驳回',
    description: '流程被驳回，需要重新提交或补充资料',
    allowedRoles: [ROLES.CONSUMER, ROLES.DESIGNER],
    allowedActions: [ACTIONS.SUPPLEMENT, ACTIONS.CANCEL],
    forbiddenActions: [ACTIONS.APPROVE, ACTIONS.SELECT_CONFIG],
    responsibleRole: ROLES.CONSUMER,
    nextStatus: null,
    downstreamImpact: '驳回后需根据原因回退至对应节点或重新提交'
  },
  [STATUS.DEGRADED]: {
    name: '已降级',
    description: '因异常触发降级处理的状态',
    allowedRoles: [ROLES.OPERATOR, ROLES.DESIGNER],
    allowedActions: [ACTIONS.REVERT, ACTIONS.CANCEL],
    forbiddenActions: [ACTIONS.SUBMIT_MODEL, ACTIONS.SELECT_CONFIG],
    responsibleRole: ROLES.OPERATOR,
    nextStatus: null,
    downstreamImpact: '降级后需人工干预恢复正常流程'
  }
};

const TRANSITION_RULES = {
  [ACTIONS.SUBMIT_MODEL]: {
    from: [STATUS.PENDING_MODEL_LOAD],
    to: STATUS.PENDING_INTERACTION,
    requiredFields: [],
    validateFn: (data) => {
      return true;
    }
  },
  [ACTIONS.APPROVE]: {
    from: [STATUS.PENDING_INTERACTION],
    to: STATUS.PENDING_CONFIG_SELECTION,
    requiredFields: ['comment'],
    validateFn: (data) => {
      return true;
    }
  },
  [ACTIONS.REJECT]: {
    from: [STATUS.PENDING_INTERACTION],
    to: STATUS.REJECTED,
    requiredFields: ['reason'],
    validateFn: (data) => {
      return data.reason && data.reason.length > 0;
    }
  },
  [ACTIONS.SUPPLEMENT]: {
    from: [STATUS.PENDING_INTERACTION, STATUS.REJECTED],
    to: STATUS.PENDING_INTERACTION,
    requiredFields: ['supplement_data'],
    validateFn: (data) => {
      return true;
    }
  },
  [ACTIONS.TRANSFER]: {
    from: [STATUS.PENDING_INTERACTION, STATUS.PENDING_CONFIG_SELECTION, STATUS.PENDING_QUOTE],
    to: null,
    requiredFields: ['new_responsible_user_id'],
    validateFn: (data) => {
      return data.new_responsible_user_id;
    }
  },
  [ACTIONS.SELECT_CONFIG]: {
    from: [STATUS.PENDING_CONFIG_SELECTION],
    to: STATUS.PENDING_QUOTE,
    requiredFields: ['config_data'],
    validateFn: (data) => {
      return data.config_data;
    }
  },
  [ACTIONS.GENERATE_QUOTE]: {
    from: [STATUS.PENDING_QUOTE],
    to: STATUS.PENDING_LEAD,
    requiredFields: ['quoteData', 'actualCost'],
    validateFn: (data) => {
      return data.actualCost >= 0;
    }
  },
  [ACTIONS.SUBMIT_LEAD]: {
    from: [STATUS.PENDING_LEAD],
    to: STATUS.COMPLETED,
    requiredFields: ['leadName', 'leadPhone'],
    validateFn: (data) => {
      return data.leadName && data.leadPhone;
    }
  },
  [ACTIONS.CANCEL]: {
    from: [STATUS.PENDING_MODEL_LOAD, STATUS.PENDING_INTERACTION, STATUS.PENDING_CONFIG_SELECTION, STATUS.PENDING_QUOTE, STATUS.PENDING_LEAD],
    to: STATUS.REJECTED,
    requiredFields: ['reason'],
    validateFn: (data) => {
      return true;
    }
  },
  [ACTIONS.REVERT]: {
    from: [STATUS.COMPLETED, STATUS.DEGRADED],
    to: STATUS.PENDING_MODEL_LOAD,
    requiredFields: ['reason'],
    validateFn: (data) => {
      return true;
    }
  }
};

function isActionAllowed(currentStatus, action, userRole) {
  const stateConfig = STATE_CONFIG[currentStatus];
  if (!stateConfig) return false;

  if (!stateConfig.allowedRoles.includes(userRole) && userRole !== ROLES.OPERATOR) {
    return false;
  }

  if (stateConfig.forbiddenActions.includes(action)) {
    return false;
  }

  return stateConfig.allowedActions.includes(action);
}

function getNextStatus(currentStatus, action) {
  const transition = TRANSITION_RULES[action];
  if (!transition) return null;

  if (!transition.from.includes(currentStatus)) {
    return null;
  }

  return transition.to;
}

function validateTransition(currentStatus, action, data, userRole) {
  const errors = [];

  if (!isActionAllowed(currentStatus, action, userRole)) {
    errors.push(`角色"${userRole}"在状态"${currentStatus}"下不允许执行操作"${action}"`);
  }

  const transition = TRANSITION_RULES[action];
  if (!transition) {
    errors.push(`操作"${action}"不存在`);
  } else {
    if (!transition.from.includes(currentStatus)) {
      errors.push(`操作"${action}"不能在状态"${currentStatus}"下执行`);
    }

    if (transition.requiredFields) {
      for (const field of transition.requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`必填字段"${field}"缺失`);
        }
      }
    }

    if (transition.validateFn && !transition.validateFn(data)) {
      errors.push(`数据验证失败`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    nextStatus: transition ? transition.to : null
  };
}

function getAvailableActions(currentStatus, userRole) {
  const stateConfig = STATE_CONFIG[currentStatus];
  if (!stateConfig) return [];

  return stateConfig.allowedActions.filter(action => {
    return isActionAllowed(currentStatus, action, userRole);
  });
}

function getStateInfo(status) {
  return STATE_CONFIG[status] || null;
}

module.exports = {
  STATE_CONFIG,
  TRANSITION_RULES,
  isActionAllowed,
  getNextStatus,
  validateTransition,
  getAvailableActions,
  getStateInfo
};
