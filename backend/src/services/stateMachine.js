const { v4: uuidv4 } = require('uuid');

const ORDER_STATES = {
  DRAFT: 'draft',
  PENDING_SCHEDULE: 'pending_schedule',
  SCHEDULED: 'scheduled',
  VEHICLE_RUNNING: 'vehicle_running',
  PENDING_ARRIVAL_PREDICTION: 'pending_arrival_prediction',
  ARRIVAL_PREDICTED: 'arrival_predicted',
  PENDING_EXCEPTION: 'pending_exception',
  EXCEPTION_HANDLED: 'exception_handled',
  PENDING_STATISTICS: 'pending_statistics',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  WITHDRAWN: 'withdrawn'
};

const STATE_TRANSITIONS = {
  [ORDER_STATES.DRAFT]: {
    submit: ORDER_STATES.PENDING_SCHEDULE,
    withdraw: ORDER_STATES.WITHDRAWN
  },
  [ORDER_STATES.PENDING_SCHEDULE]: {
    approve: ORDER_STATES.SCHEDULED,
    reject: ORDER_STATES.REJECTED,
    supplement: ORDER_STATES.DRAFT,
    reassign: ORDER_STATES.PENDING_SCHEDULE,
    withdraw: ORDER_STATES.WITHDRAWN
  },
  [ORDER_STATES.SCHEDULED]: {
    start_running: ORDER_STATES.VEHICLE_RUNNING,
    cancel: ORDER_STATES.CANCELLED
  },
  [ORDER_STATES.VEHICLE_RUNNING]: {
    predict_arrival: ORDER_STATES.PENDING_ARRIVAL_PREDICTION,
    exception: ORDER_STATES.PENDING_EXCEPTION
  },
  [ORDER_STATES.PENDING_ARRIVAL_PREDICTION]: {
    confirm: ORDER_STATES.ARRIVAL_PREDICTED,
    exception: ORDER_STATES.PENDING_EXCEPTION
  },
  [ORDER_STATES.ARRIVAL_PREDICTED]: {
    complete: ORDER_STATES.PENDING_STATISTICS,
    exception: ORDER_STATES.PENDING_EXCEPTION
  },
  [ORDER_STATES.PENDING_EXCEPTION]: {
    resolve: ORDER_STATES.PENDING_ARRIVAL_PREDICTION,
    escalate: ORDER_STATES.PENDING_EXCEPTION,
    close: ORDER_STATES.EXCEPTION_HANDLED
  },
  [ORDER_STATES.EXCEPTION_HANDLED]: {
    resume: ORDER_STATES.PENDING_ARRIVAL_PREDICTION,
    close: ORDER_STATES.CANCELLED
  },
  [ORDER_STATES.PENDING_STATISTICS]: {
    finalize: ORDER_STATES.COMPLETED
  }
};

const ACTION_PERMISSIONS = {
  submit: ['dispatcher'],
  withdraw: ['dispatcher'],
  approve: ['operator'],
  reject: ['operator'],
  supplement: ['operator'],
  reassign: ['operator'],
  start_running: ['driver', 'dispatcher'],
  cancel: ['dispatcher', 'operator'],
  predict_arrival: ['driver', 'dispatcher'],
  confirm: ['driver', 'operator'],
  exception: ['driver', 'dispatcher'],
  resolve: ['dispatcher', 'operator'],
  escalate: ['operator'],
  close: ['operator'],
  resume: ['dispatcher'],
  finalize: ['operator']
};

class StateMachine {
  constructor(db) {
    this.db = db;
  }

  getValidActions(currentState, userRole) {
    const transitions = STATE_TRANSITIONS[currentState];
    if (!transitions) return [];
    
    return Object.entries(transitions)
      .filter(([action]) => {
        const allowedRoles = ACTION_PERMISSIONS[action] || [];
        return allowedRoles.includes(userRole);
      })
      .map(([action, nextState]) => ({
        action,
        nextState,
        label: this.getActionLabel(action)
      }));
  }

  getActionLabel(action) {
    const labels = {
      submit: '提交',
      withdraw: '撤回',
      approve: '通过',
      reject: '驳回',
      supplement: '补充资料',
      reassign: '转派',
      start_running: '开始运行',
      cancel: '取消',
      predict_arrival: '预测到站',
      confirm: '确认',
      exception: '标记异常',
      resolve: '解决',
      escalate: '升级',
      close: '关闭',
      resume: '恢复',
      finalize: '完成统计'
    };
    return labels[action] || action;
  }

  canTransition(currentState, action) {
    const transitions = STATE_TRANSITIONS[currentState];
    return transitions && transitions[action] !== undefined;
  }

  getNextState(currentState, action) {
    const transitions = STATE_TRANSITIONS[currentState];
    return transitions ? transitions[action] : null;
  }

  transition(mainOrderNo, action, operatorId, operatorName, comment = '', sourceClient = 'web') {
    const order = this.db.prepare('SELECT * FROM main_orders WHERE main_order_no = ?').get(mainOrderNo);
    
    if (!order) {
      throw new Error(`主单不存在: ${mainOrderNo}`);
    }

    const currentState = order.current_status;
    
    if (!this.canTransition(currentState, action)) {
      throw new Error(`状态 ${currentState} 无法执行操作 ${action}`);
    }

    const nextState = this.getNextState(currentState, action);
    const statusFlow = order.status_flow ? `${order.status_flow}->${nextState}` : nextState;

    const updateOrder = this.db.prepare(`
      UPDATE main_orders 
      SET current_status = ?, previous_status = ?, status_flow = ?, updated_at = CURRENT_TIMESTAMP
      WHERE main_order_no = ?
    `);

    const insertTimeline = this.db.prepare(`
      INSERT INTO timeline_events (event_id, main_order_no, event_type, status_from, status_to, operator_id, operator_name, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLog = this.db.prepare(`
      INSERT INTO operation_logs (log_id, main_order_no, operation_type, old_value, new_value, operator_id, operator_name, source_client)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      updateOrder.run(nextState, currentState, statusFlow, mainOrderNo);
      
      insertTimeline.run(
        uuidv4(),
        mainOrderNo,
        action,
        currentState,
        nextState,
        operatorId,
        operatorName,
        comment
      );

      insertLog.run(
        uuidv4(),
        mainOrderNo,
        `state_transition:${action}`,
        currentState,
        nextState,
        operatorId,
        operatorName,
        sourceClient
      );
    });

    transaction();

    return {
      success: true,
      previousState: currentState,
      currentState: nextState,
      action
    };
  }

  createOrderWithInitialState(orderData, operatorId, operatorName) {
    const initialState = ORDER_STATES.DRAFT;
    const statusFlow = initialState;

    return {
      ...orderData,
      current_status: initialState,
      previous_status: null,
      status_flow: statusFlow,
      created_by: operatorId
    };
  }

  getStateInfo(state) {
    const stateInfo = {
      [ORDER_STATES.DRAFT]: { label: '草稿', color: '#909399', category: 'initial' },
      [ORDER_STATES.PENDING_SCHEDULE]: { label: '待排班', color: '#E6A23C', category: 'pending' },
      [ORDER_STATES.SCHEDULED]: { label: '已排班', color: '#409EFF', category: 'active' },
      [ORDER_STATES.VEHICLE_RUNNING]: { label: '车辆运行中', color: '#67C23A', category: 'active' },
      [ORDER_STATES.PENDING_ARRIVAL_PREDICTION]: { label: '待到站预测', color: '#E6A23C', category: 'pending' },
      [ORDER_STATES.ARRIVAL_PREDICTED]: { label: '已预测', color: '#409EFF', category: 'active' },
      [ORDER_STATES.PENDING_EXCEPTION]: { label: '待异常处理', color: '#F56C6C', category: 'exception' },
      [ORDER_STATES.EXCEPTION_HANDLED]: { label: '异常已处理', color: '#909399', category: 'resolved' },
      [ORDER_STATES.PENDING_STATISTICS]: { label: '待运营统计', color: '#E6A23C', category: 'pending' },
      [ORDER_STATES.COMPLETED]: { label: '已完成', color: '#67C23A', category: 'final' },
      [ORDER_STATES.REJECTED]: { label: '已驳回', color: '#F56C6C', category: 'final' },
      [ORDER_STATES.CANCELLED]: { label: '已取消', color: '#909399', category: 'final' },
      [ORDER_STATES.WITHDRAWN]: { label: '已撤回', color: '#909399', category: 'final' }
    };
    return stateInfo[state] || { label: state, color: '#909399', category: 'unknown' };
  }
}

module.exports = {
  StateMachine,
  ORDER_STATES,
  STATE_TRANSITIONS,
  ACTION_PERMISSIONS
};
