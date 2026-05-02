const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { TaskStateService, TASK_STATES, TASK_EVENTS } = require('./stateMachine');

const stateService = new TaskStateService();

class ProgressService {
  async triggerEvent(eventCode, userUuid, eventData = {}, source = 'game') {
    const trackingUuid = uuidv4();
    
    await run(
      `INSERT INTO tracking_events 
       (tracking_uuid, user_uuid, event_code, event_data, source)
       VALUES (?, ?, ?, ?, ?)`,
      [trackingUuid, userUuid, eventCode, JSON.stringify(eventData), source]
    );

    const tasks = await all(
      `SELECT * FROM tasks 
       WHERE trigger_event_code = ? 
       AND status = ? 
       AND (start_time IS NULL OR start_time <= CURRENT_TIMESTAMP)
       AND (end_time IS NULL OR end_time >= CURRENT_TIMESTAMP)`,
      [eventCode, TASK_STATES.PENDING_TRIGGER]
    );

    const results = [];
    for (const task of tasks) {
      const progress = await this.getOrCreateProgress(userUuid, task.task_uuid);
      const updateResult = await this.updateProgress(progress.progress_uuid, 1, eventData);
      results.push(updateResult);
    }

    return {
      trackingUuid,
      triggeredTasks: results
    };
  }

  async getOrCreateProgress(userUuid, taskUuid) {
    let progress = await get(
      `SELECT * FROM progresses 
       WHERE user_uuid = ? AND task_uuid = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [userUuid, taskUuid]
    );

    const task = await get(
      'SELECT * FROM tasks WHERE task_uuid = ?',
      [taskUuid]
    );

    if (!progress || progress.status === 'completed') {
      if (task.is_repeatable && (progress?.repeat_count || 0) < task.max_repeat_count) {
        const progressUuid = uuidv4();
        const repeatCount = (progress?.repeat_count || 0) + 1;
        
        await run(
          `INSERT INTO progresses 
           (progress_uuid, user_uuid, task_uuid, current_count, target_count, status, repeat_count)
           VALUES (?, ?, ?, 0, ?, ?, ?)`,
          [progressUuid, userUuid, taskUuid, task.target_count, 'pending', repeatCount]
        );

        progress = await get(
          'SELECT * FROM progresses WHERE progress_uuid = ?',
          [progressUuid]
        );
      } else if (!progress) {
        const progressUuid = uuidv4();
        
        await run(
          `INSERT INTO progresses 
           (progress_uuid, user_uuid, task_uuid, current_count, target_count, status, repeat_count)
           VALUES (?, ?, ?, 0, ?, ?, 0)`,
          [progressUuid, userUuid, taskUuid, task.target_count, 'pending']
        );

        progress = await get(
          'SELECT * FROM progresses WHERE progress_uuid = ?',
          [progressUuid]
        );
      }
    }

    return progress;
  }

  async updateProgress(progressUuid, increment = 1, eventData = {}) {
    const progress = await get(
      'SELECT * FROM progresses WHERE progress_uuid = ?',
      [progressUuid]
    );

    if (!progress) {
      throw new Error('进度记录不存在');
    }

    const task = await get(
      'SELECT * FROM tasks WHERE task_uuid = ?',
      [progress.task_uuid]
    );

    if (!task) {
      throw new Error('关联任务不存在');
    }

    const newCount = progress.current_count + increment;
    const isComplete = newCount >= progress.target_count;

    await run(
      `UPDATE progresses 
       SET current_count = ?, 
           last_triggered_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE progress_uuid = ?`,
      [newCount, progressUuid]
    );

    await stateService.createAuditLog(
      progress.user_uuid, 'progress_update', 'progress', progressUuid,
      { 
        previous: progress.current_count, 
        current: newCount, 
        target: progress.target_count,
        eventData 
      },
      `进度更新: ${newCount}/${progress.target_count}`
    );

    if (isComplete) {
      await run(
        `UPDATE progresses 
         SET status = ?, completed_at = CURRENT_TIMESTAMP
         WHERE progress_uuid = ?`,
        ['completed', progressUuid]
      );

      await stateService.transitionTask(
        progress.task_uuid, TASK_EVENTS.COMPLETE, progress.user_uuid,
        '任务已完成，等待发放奖励'
      );

      return {
        progressUuid,
        currentCount: newCount,
        targetCount: progress.target_count,
        isComplete: true,
        status: 'completed'
      };
    }

    return {
      progressUuid,
      currentCount: newCount,
      targetCount: progress.target_count,
      isComplete: false,
      status: 'in_progress'
    };
  }

  async getUserProgress(userUuid, filters = {}) {
    let sql = `SELECT p.*, t.task_name, t.task_type, t.target_count as task_target
               FROM progresses p
               JOIN tasks t ON p.task_uuid = t.task_uuid
               WHERE p.user_uuid = ?`;
    const params = [userUuid];

    if (filters.status) {
      sql += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.task_uuid) {
      sql += ' AND p.task_uuid = ?';
      params.push(filters.task_uuid);
    }

    sql += ' ORDER BY p.updated_at DESC';

    return await all(sql, params);
  }

  async getProgressHistory(progressUuid) {
    return await get(
      'SELECT * FROM progresses WHERE progress_uuid = ?',
      [progressUuid]
    );
  }
}

module.exports = { ProgressService };
