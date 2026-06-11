const express = require('express');
const { db } = require('../db');
const { logCommand, updateLastUsed } = require('../middleware/commandLogger');

const router = express.Router();

router.get('/', (req, res) => {
  const { user } = req;
  
  const scenes = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM scene_actions sa WHERE sa.scene_id = s.id) as action_count
    FROM scenes s
    WHERE s.user_id = ?
    ORDER BY s.is_active DESC, s.created_at DESC
  `).all(user.id);

  const scenesWithActions = scenes.map(scene => {
    const actions = db.prepare(`
      SELECT sa.*,
        d.name as device_name,
        dt.name as device_type_name,
        b.name as brand_name
      FROM scene_actions sa
      JOIN user_devices d ON sa.device_id = d.id
      JOIN device_types dt ON d.device_type_id = dt.id
      JOIN brands b ON d.brand_id = b.id
      WHERE sa.scene_id = ?
      ORDER BY sa.order_index, sa.delay_seconds
    `).all(scene.id);
    return { ...scene, actions };
  });

  res.json(scenesWithActions);
});

router.get('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const scene = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM scene_actions sa WHERE sa.scene_id = s.id) as action_count
    FROM scenes s
    WHERE s.id = ? AND s.user_id = ?
  `).get(id, user.id);

  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  const actions = db.prepare(`
    SELECT sa.*,
      d.name as device_name,
      dt.name as device_type_name,
      b.name as brand_name
    FROM scene_actions sa
    JOIN user_devices d ON sa.device_id = d.id
    JOIN device_types dt ON d.device_type_id = dt.id
    JOIN brands b ON d.brand_id = b.id
    WHERE sa.scene_id = ?
    ORDER BY sa.order_index, sa.delay_seconds
  `).all(id);

  scene.actions = actions;
  res.json(scene);
});

router.post('/', (req, res) => {
  const { user } = req;
  const { name, description, icon, is_active, actions } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing scene name' });
  }

  db.exec('BEGIN TRANSACTION');
  try {
    const sceneResult = db.prepare(`
      INSERT INTO scenes (user_id, name, description, icon, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, name, description || '', icon || '', is_active !== undefined ? is_active : 1);

    const sceneId = sceneResult.lastInsertRowid;

    if (actions && Array.isArray(actions)) {
      const insertAction = db.prepare(`
        INSERT INTO scene_actions (scene_id, device_id, command, params, delay_seconds, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      actions.forEach((action, index) => {
        insertAction.run(
          sceneId,
          action.device_id,
          action.command,
          action.params ? JSON.stringify(action.params) : '{}',
          action.delay_seconds || 0,
          action.order_index !== undefined ? action.order_index : index
        );
      });
    }

    db.exec('COMMIT');

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(sceneId);
    logCommand(user.id, null, null, `scene_create:${name}`, true, null, req.networkStatus);
    
    res.status(201).json(scene);
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to create scene', details: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { name, description, icon, is_active, actions } = req.body;

  const existing = db.prepare('SELECT id FROM scenes WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`
      UPDATE scenes
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          is_active = COALESCE(?, is_active)
      WHERE id = ? AND user_id = ?
    `).run(name || null, description || null, icon || null, is_active !== undefined ? is_active : null, id, user.id);

    if (actions && Array.isArray(actions)) {
      db.prepare('DELETE FROM scene_actions WHERE scene_id = ?').run(id);
      
      const insertAction = db.prepare(`
        INSERT INTO scene_actions (scene_id, device_id, command, params, delay_seconds, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      actions.forEach((action, index) => {
        insertAction.run(
          id,
          action.device_id,
          action.command,
          action.params ? JSON.stringify(action.params) : '{}',
          action.delay_seconds || 0,
          action.order_index !== undefined ? action.order_index : index
        );
      });
    }

    db.exec('COMMIT');

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
    logCommand(user.id, null, null, `scene_update:${id}`, true, null, req.networkStatus);
    
    res.json(scene);
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to update scene', details: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM scenes WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('DELETE FROM scene_actions WHERE scene_id = ?').run(id);
    db.prepare('DELETE FROM schedule_tasks WHERE scene_id = ?').run(id);
    db.prepare('DELETE FROM scenes WHERE id = ? AND user_id = ?').run(id, user.id);
    db.exec('COMMIT');

    logCommand(user.id, null, null, `scene_delete:${id}`, true, null, req.networkStatus);
    res.json({ success: true, message: 'Scene deleted' });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

router.post('/:id/execute', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const scene = db.prepare(`
    SELECT s.* FROM scenes s
    WHERE s.id = ? AND s.user_id = ? AND s.is_active = 1
  `).get(id, user.id);

  if (!scene) {
    return res.status(404).json({ error: 'Scene not found or inactive' });
  }

  const actions = db.prepare(`
    SELECT sa.*,
      d.model_id,
      d.name as device_name
    FROM scene_actions sa
    JOIN user_devices d ON sa.device_id = d.id
    WHERE sa.scene_id = ?
    ORDER BY sa.order_index, sa.delay_seconds
  `).all(id);

  const results = [];
  
  for (const action of actions) {
    const irCode = db.prepare(`
      SELECT * FROM ir_codes
      WHERE ir_code_model_id = ? AND command_name = ?
    `).get(action.model_id, action.command);

    const success = Math.random() > 0.05;
    
    if (success) {
      updateLastUsed(action.device_id);
    }

    const logResult = logCommand(
      user.id,
      action.device_id,
      irCode ? irCode.id : null,
      `scene:${scene.name}:${action.command}`,
      success,
      success ? null : 'IR transmission failed',
      req.networkStatus
    );

    results.push({
      device_id: action.device_id,
      device_name: action.device_name,
      command: action.command,
      params: action.params ? JSON.parse(action.params) : {},
      delay_seconds: action.delay_seconds,
      success,
      log_id: logResult.lastInsertRowid
    });
  }

  db.prepare('UPDATE scenes SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  logCommand(user.id, null, null, `scene_execute:${scene.name}`, true, null, req.networkStatus);

  res.json({
    scene_id: id,
    scene_name: scene.name,
    executed_at: new Date().toISOString(),
    actions_executed: results.length,
    success_count: results.filter(r => r.success).length,
    results
  });
});

module.exports = router;
