const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { TaskStateService, TASK_STATES, TASK_EVENTS } = require('./stateMachine');

const stateService = new TaskStateService();

class TaskService {
  async createTask(taskData, operatorUuid) {
    const taskUuid = uuidv4();
    const taskCode = taskData.task_code || `TASK_${Date.now()}`;

    await run(
      `INSERT INTO tasks 
       (task_uuid, task_code, task_name, task_type, description, 
        trigger_event_code, target_count, priority, is_daily, 
        is_repeatable, max_repeat_count, start_time, end_time, 
        status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskUuid, taskCode, taskData.task_name, taskData.task_type,
        taskData.description, taskData.trigger_event_code,
        taskData.target_count || 1, taskData.priority || 0,
        taskData.is_daily ? 1 : 0, taskData.is_repeatable ? 1 : 0,
        taskData.max_repeat_count || 1, taskData.start_time,
        taskData.end_time, TASK_STATES.DRAFT, operatorUuid
      ]
    );

    await stateService.createAuditLog(
      operatorUuid, 'create', 'task', taskUuid,
      taskData, '创建新任务'
    );

    return { taskUuid, taskCode };
  }

  async updateTask(taskUuid, taskData, operatorUuid) {
    const existingTask = await get(
      'SELECT * FROM tasks WHERE task_uuid = ?',
      [taskUuid]
    );

    if (!existingTask) {
      throw new Error('任务不存在');
    }

    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'task_name', 'description', 'trigger_event_code',
      'target_count', 'priority', 'is_daily', 'is_repeatable',
      'max_repeat_count', 'start_time', 'end_time'
    ];

    for (const field of allowedFields) {
      if (taskData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(
          typeof taskData[field] === 'boolean' ? (taskData[field] ? 1 : 0) : taskData[field]
        );
      }
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(taskUuid);

      await run(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE task_uuid = ?`,
        updateValues
      );

      await stateService.createAuditLog(
        operatorUuid, 'update', 'task', taskUuid,
        { old: existingTask, new: taskData }, '更新任务配置'
      );
    }

    return { success: true };
  }

  async configureTask(taskUuid, operatorUuid) {
    return await stateService.transitionTask(
      taskUuid, TASK_EVENTS.CONFIGURE, operatorUuid, '任务配置完成，等待审核发布'
    );
  }

  async publishTask(taskUuid, operatorUuid) {
    return await stateService.transitionTask(
      taskUuid, TASK_EVENTS.PUBLISH, operatorUuid, '任务已发布，等待玩家触发'
    );
  }

  async getTask(taskUuid) {
    return await get(
      'SELECT * FROM tasks WHERE task_uuid = ?',
      [taskUuid]
    );
  }

  async getTasks(filters = {}) {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.task_type) {
      sql += ' AND task_type = ?';
      params.push(filters.task_type);
    }

    if (filters.created_by) {
      sql += ' AND created_by = ?';
      params.push(filters.created_by);
    }

    sql += ' ORDER BY created_at DESC';

    return await all(sql, params);
  }

  async addTaskReward(taskUuid, rewardUuid, quantity = 1, operatorUuid) {
    const taskRewardUuid = uuidv4();

    await run(
      `INSERT INTO task_rewards 
       (task_reward_uuid, task_uuid, reward_uuid, reward_quantity)
       VALUES (?, ?, ?, ?)`,
      [taskRewardUuid, taskUuid, rewardUuid, quantity]
    );

    await stateService.createAuditLog(
      operatorUuid, 'add_reward', 'task', taskUuid,
      { rewardUuid, quantity }, '为任务添加奖励'
    );

    return { taskRewardUuid };
  }

  async getTaskRewards(taskUuid) {
    return await all(
      `SELECT tr.*, r.reward_name, r.reward_type, r.reward_value, r.icon
       FROM task_rewards tr
       JOIN rewards r ON tr.reward_uuid = r.reward_uuid
       WHERE tr.task_uuid = ?`,
      [taskUuid]
    );
  }
}

module.exports = { TaskService };
