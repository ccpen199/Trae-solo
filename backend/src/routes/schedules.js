const express = require('express');
const { db } = require('../db');
const { logCommand } = require('../middleware/commandLogger');

const router = express.Router();

function normalizeBody(body) {
  const normalized = { ...body };
  const mappings = {
    deviceId: 'device_id',
    sceneId: 'scene_id',
    actionType: 'action_type',
    cronExpression: 'cron_expression',
    targetTime: 'target_time',
    isActive: 'is_active',
    commandParams: 'command_params',
    executionChannel: 'execution_channel',
    offlineStrategy: 'offline_strategy',
    repeatType: 'repeat_type'
  };
  for (const [camel, snake] of Object.entries(mappings)) {
    if (body[camel] !== undefined && body[snake] === undefined) {
      normalized[snake] = body[camel];
    }
  }
  return normalized;
}

function bindScalar(value) {
  if (value === undefined || value === '') return null;
  if (value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || Buffer.isBuffer(value)) return value;
  if (typeof value === 'object' && value.value !== undefined) return bindScalar(value.value);
  return JSON.stringify(value);
}

function bindInteger(value) {
  const scalar = bindScalar(value);
  if (scalar === null) return null;
  const number = Number(scalar);
  return Number.isFinite(number) ? number : null;
}

function encodeJson(value) {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

router.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = normalizeBody(req.body);
  }
  next();
});

router.get('/', (req, res) => {
  const { user } = req;
  
  const schedules = db.prepare(`
    SELECT st.*,
      d.name as device_name,
      d.model_id,
      b.name as brand_name,
      m.model_number as model_name,
      dt.name as device_type_name,
      dt.category as device_category,
      s.name as scene_name
    FROM schedule_tasks st
    LEFT JOIN user_devices d ON st.device_id = d.id
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN ir_code_models m ON d.model_id = m.id
    LEFT JOIN device_types dt ON m.device_type_id = dt.id
    LEFT JOIN scenes s ON st.scene_id = s.id
    WHERE st.user_id = ?
    ORDER BY st.is_active DESC, st.created_at DESC
  `).all(user.id);

  const parsed = schedules.map(s => ({
    ...s,
    command_params: parseJson(s.command_params)
  }));

  res.json(parsed);
});

router.get('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const schedule = db.prepare(`
    SELECT st.*,
      d.name as device_name,
      d.model_id,
      b.name as brand_name,
      m.model_number as model_name,
      dt.name as device_type_name,
      dt.category as device_category,
      s.name as scene_name
    FROM schedule_tasks st
    LEFT JOIN user_devices d ON st.device_id = d.id
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN ir_code_models m ON d.model_id = m.id
    LEFT JOIN device_types dt ON m.device_type_id = dt.id
    LEFT JOIN scenes s ON st.scene_id = s.id
    WHERE st.id = ? AND st.user_id = ?
  `).get(id, user.id);

  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  if (schedule.command_params) {
    schedule.command_params = parseJson(schedule.command_params);
  }

  res.json(schedule);
});

router.post('/', (req, res) => {
  const { user } = req;
  const { name, device_id, scene_id, action_type, cron_expression, target_time, is_active, command, command_params, execution_channel, offline_strategy } = req.body;
  const deviceId = bindInteger(device_id);
  const sceneId = bindInteger(scene_id);

  if (!action_type) {
    return res.status(400).json({ error: 'Missing action_type' });
  }

  if (!deviceId && !sceneId) {
    return res.status(400).json({ error: 'Must provide either device_id or scene_id' });
  }

  if (action_type === 'cron' && !cron_expression) {
    return res.status(400).json({ error: 'Missing cron_expression for cron type' });
  }

  if (action_type === 'once' && !target_time) {
    return res.status(400).json({ error: 'Missing target_time for once type' });
  }

  const result = db.prepare(`
    INSERT INTO schedule_tasks (user_id, name, device_id, scene_id, action_type, cron_expression, target_time, is_active, command, command_params, execution_channel, offline_strategy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    bindScalar(name) || '定时任务',
    deviceId,
    sceneId,
    bindScalar(action_type),
    bindScalar(cron_expression),
    bindScalar(target_time),
    is_active !== undefined ? bindInteger(is_active) : 1,
    bindScalar(command),
    encodeJson(command_params),
    bindScalar(execution_channel) || 'web',
    bindScalar(offline_strategy) || 'queue'
  );

  const schedule = db.prepare('SELECT * FROM schedule_tasks WHERE id = ?').get(result.lastInsertRowid);
  if (schedule.command_params) {
    schedule.command_params = parseJson(schedule.command_params);
  }
  logCommand(user.id, deviceId, null, `schedule_create:${action_type}`, true, null, req.networkStatus);

  res.status(201).json(schedule);
});

router.put('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { name, device_id, scene_id, action_type, cron_expression, target_time, is_active, command, command_params, execution_channel, offline_strategy } = req.body;

  const existing = db.prepare('SELECT * FROM schedule_tasks WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  db.prepare(`
    UPDATE schedule_tasks
    SET name = ?,
        device_id = ?,
        scene_id = ?,
        action_type = ?,
        cron_expression = ?,
        target_time = ?,
        is_active = ?,
        command = ?,
        command_params = ?,
        execution_channel = ?,
        offline_strategy = ?
    WHERE id = ? AND user_id = ?
  `).run(
    name !== undefined ? bindScalar(name) : existing.name,
    device_id !== undefined ? bindInteger(device_id) : existing.device_id,
    scene_id !== undefined ? bindInteger(scene_id) : existing.scene_id,
    action_type !== undefined ? bindScalar(action_type) : existing.action_type,
    cron_expression !== undefined ? bindScalar(cron_expression) : existing.cron_expression,
    target_time !== undefined ? bindScalar(target_time) : existing.target_time,
    is_active !== undefined ? bindInteger(is_active) : existing.is_active,
    command !== undefined ? bindScalar(command) : existing.command,
    command_params !== undefined ? encodeJson(command_params) : existing.command_params,
    execution_channel !== undefined ? bindScalar(execution_channel) : existing.execution_channel,
    offline_strategy !== undefined ? bindScalar(offline_strategy) : existing.offline_strategy,
    id,
    user.id
  );

  const schedule = db.prepare('SELECT * FROM schedule_tasks WHERE id = ?').get(id);
  if (schedule.command_params) {
    schedule.command_params = parseJson(schedule.command_params);
  }
  logCommand(user.id, null, null, `schedule_update:${id}`, true, null, req.networkStatus);

  res.json(schedule);
});

router.delete('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM schedule_tasks WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  db.prepare('DELETE FROM schedule_tasks WHERE id = ? AND user_id = ?').run(id, user.id);
  logCommand(user.id, null, null, `schedule_delete:${id}`, true, null, req.networkStatus);

  res.json({ success: true, message: 'Schedule deleted' });
});

function executeSchedule(id, user, networkStatus, db, logCommand) {
  const schedule = db.prepare(`
    SELECT st.*,
      d.model_id,
      d.name as device_name,
      s.name as scene_name
    FROM schedule_tasks st
    LEFT JOIN user_devices d ON st.device_id = d.id
    LEFT JOIN scenes s ON st.scene_id = s.id
    WHERE st.id = ? AND st.user_id = ? AND st.is_active = 1
  `).get(id, user.id);

  if (!schedule) {
    return { status: 404, error: 'Schedule not found or inactive' };
  }

  let result;
  let hasErrors = false;

  if (schedule.scene_id) {
    const actions = db.prepare(`
      SELECT sa.*, d.model_id, d.name as device_name
      FROM scene_actions sa
      JOIN user_devices d ON sa.device_id = d.id
      WHERE sa.scene_id = ?
      ORDER BY sa.order_index
    `).all(schedule.scene_id);

    const actionResults = actions.map(action => {
      const success = Math.random() > 0.05;
      if (!success) hasErrors = true;
      logCommand(user.id, action.device_id, null, `schedule_scene_action:${action.command}`, success, success ? null : 'Command failed', networkStatus);
      return {
        device_id: action.device_id,
        device_name: action.device_name,
        command: action.command,
        success,
        error: success ? null : 'Command failed'
      };
    });

    result = {
      type: 'scene',
      scene_id: schedule.scene_id,
      scene_name: schedule.scene_name,
      execution_channel: schedule.execution_channel || 'web',
      offline_strategy: schedule.offline_strategy || 'queue',
      actions: actionResults,
      success_count: actionResults.filter(a => a.success).length,
      total_count: actionResults.length
    };
  } else if (schedule.device_id) {
    const success = Math.random() > 0.05;
    if (!success) hasErrors = true;
    logCommand(user.id, schedule.device_id, null, `schedule_device_action:${schedule.command || 'trigger'}`, success, success ? null : 'Command failed', networkStatus);
    result = {
      type: 'device',
      device_id: schedule.device_id,
      device_name: schedule.device_name,
      command: schedule.command,
      command_params: parseJson(schedule.command_params),
      execution_channel: schedule.execution_channel || 'web',
      offline_strategy: schedule.offline_strategy || 'queue',
      success
    };
  }

  db.prepare(`
    UPDATE schedule_tasks
    SET last_executed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  logCommand(user.id, schedule.device_id, null, `schedule_trigger:${id}`, !hasErrors, hasErrors ? 'Some actions failed' : null, networkStatus);

  return {
    status: 200,
    data: {
      schedule_id: id,
      triggered_at: new Date().toISOString(),
      result
    }
  };
}

router.post('/:id/trigger', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const result = executeSchedule(id, user, req.networkStatus, db, logCommand);
  
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  
  res.json(result.data);
});

router.post('/:id/execute', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const result = executeSchedule(id, user, req.networkStatus, db, logCommand);
  
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }
  
  res.json(result.data);
});

router.put('/:id/toggle', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { is_active, enabled } = req.body;

  const existing = db.prepare('SELECT id FROM schedule_tasks WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  const activeValue = is_active !== undefined ? is_active : (enabled !== undefined ? enabled : 1);

  db.prepare(`
    UPDATE schedule_tasks
    SET is_active = ?
    WHERE id = ? AND user_id = ?
  `).run(activeValue ? 1 : 0, id, user.id);

  const schedule = db.prepare('SELECT * FROM schedule_tasks WHERE id = ?').get(id);
  logCommand(user.id, null, null, `schedule_toggle:${id}:${activeValue}`, true, null, req.networkStatus);

  res.json(schedule);
});

module.exports = router;
