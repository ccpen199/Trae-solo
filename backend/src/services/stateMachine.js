const { createMachine, interpret } = require('xstate');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');

const TASK_STATES = {
  DRAFT: 'draft',
  PENDING_CONFIG: 'pending_config',
  PENDING_TRIGGER: 'pending_trigger',
  PENDING_PROGRESS: 'pending_progress',
  PENDING_REWARD: 'pending_reward',
  PENDING_ANALYSIS: 'pending_analysis',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

const TASK_EVENTS = {
  CONFIGURE: 'CONFIGURE',
  PUBLISH: 'PUBLISH',
  TRIGGER: 'TRIGGER',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  COMPLETE: 'COMPLETE',
  GRANT_REWARD: 'GRANT_REWARD',
  ANALYZE: 'ANALYZE',
  ARCHIVE: 'ARCHIVE'
};

const taskStateMachine = createMachine({
  id: 'task',
  initial: TASK_STATES.DRAFT,
  states: {
    [TASK_STATES.DRAFT]: {
      on: {
        [TASK_EVENTS.CONFIGURE]: {
          target: TASK_STATES.PENDING_CONFIG,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.PENDING_CONFIG]: {
      on: {
        [TASK_EVENTS.PUBLISH]: {
          target: TASK_STATES.PENDING_TRIGGER,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.PENDING_TRIGGER]: {
      on: {
        [TASK_EVENTS.TRIGGER]: {
          target: TASK_STATES.PENDING_PROGRESS,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.PENDING_PROGRESS]: {
      on: {
        [TASK_EVENTS.UPDATE_PROGRESS]: {
          target: TASK_STATES.PENDING_PROGRESS,
          actions: ['recordStatusChange'],
          cond: 'progressNotComplete'
        },
        [TASK_EVENTS.COMPLETE]: {
          target: TASK_STATES.PENDING_REWARD,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.PENDING_REWARD]: {
      on: {
        [TASK_EVENTS.GRANT_REWARD]: {
          target: TASK_STATES.PENDING_ANALYSIS,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.PENDING_ANALYSIS]: {
      on: {
        [TASK_EVENTS.ANALYZE]: {
          target: TASK_STATES.COMPLETED,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.COMPLETED]: {
      on: {
        [TASK_EVENTS.ARCHIVE]: {
          target: TASK_STATES.ARCHIVED,
          actions: ['recordStatusChange']
        }
      }
    },
    [TASK_STATES.ARCHIVED]: {
      type: 'final'
    }
  }
}, {
  guards: {
    progressNotComplete: (context, event) => {
      return event.progress < event.target;
    }
  },
  actions: {
    recordStatusChange: (context, event) => {
      console.log(`状态变更记录: ${event.type}`);
    }
  }
});

class TaskStateService {
  constructor() {
    this.interpreters = new Map();
  }

  async transitionTask(taskUuid, eventType, operatorUuid, reason = '') {
    const task = await get(
      'SELECT * FROM tasks WHERE task_uuid = ?',
      [taskUuid]
    );

    if (!task) {
      throw new Error('任务不存在');
    }

    const currentState = task.status;
    const interpreter = interpret(taskStateMachine).start();
    interpreter.state.value = currentState;

    const transitionResult = taskStateMachine.transition(currentState, eventType);
    
    if (!transitionResult.changed) {
      throw new Error(`无法从状态 ${currentState} 通过事件 ${eventType} 进行转换`);
    }

    const newState = transitionResult.value;

    await run(
      'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE task_uuid = ?',
      [newState, taskUuid]
    );

    const historyUuid = uuidv4();
    await run(
      `INSERT INTO task_status_history 
       (history_uuid, task_uuid, from_status, to_status, operator_uuid, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [historyUuid, taskUuid, currentState, newState, operatorUuid, reason]
    );

    await this.createAuditLog(operatorUuid, 'status_change', 'task', taskUuid, {
      from: currentState,
      to: newState
    }, reason);

    return {
      taskUuid,
      fromStatus: currentState,
      toStatus: newState,
      eventType
    };
  }

  async canTransition(taskStatus, eventType) {
    const transitionResult = taskStateMachine.transition(taskStatus, eventType);
    return transitionResult.changed;
  }

  async getValidEvents(taskStatus) {
    const stateNode = taskStateMachine.states[taskStatus];
    if (!stateNode) return [];
    return Object.keys(stateNode.on || {});
  }

  async createAuditLog(operatorUuid, actionType, targetType, targetUuid, value, description) {
    const auditUuid = uuidv4();
    
    let operatorRole = null;
    if (operatorUuid) {
      const user = await get(
        'SELECT role_code FROM users WHERE user_uuid = ?',
        [operatorUuid]
      );
      operatorRole = user?.role_code;
    }

    await run(
      `INSERT INTO audit_logs 
       (audit_uuid, operator_uuid, operator_role, action_type, target_type, target_uuid, new_value, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [auditUuid, operatorUuid, operatorRole, actionType, targetType, targetUuid, JSON.stringify(value), description]
    );

    return auditUuid;
  }
}

module.exports = {
  TaskStateService,
  TASK_STATES,
  TASK_EVENTS,
  taskStateMachine
};
