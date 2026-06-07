const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', (req, res) => {
  const scenes = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM scene_executions se WHERE se.scene_id = s.id) as execution_count
    FROM scenes s 
    ORDER BY s.created_at DESC
  `).all().map(s => ({
    ...s,
    action_queue: JSON.parse(s.action_queue || '[]'),
    fallback_plan: JSON.parse(s.fallback_plan || '{}')
  }));
  
  res.json({ success: true, data: scenes });
});

router.get('/:id', (req, res) => {
  const scene = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM scene_executions se WHERE se.scene_id = s.id) as execution_count
    FROM scenes s 
    WHERE s.id = ?
  `).get(req.params.id);
  
  if (!scene) {
    return res.status(404).json({ success: false, error: 'Scene not found' });
  }
  
  scene.action_queue = JSON.parse(scene.action_queue || '[]');
  scene.fallback_plan = JSON.parse(scene.fallback_plan || '{}');
  
  const recentExecutions = db.prepare(`
    SELECT * FROM scene_executions 
    WHERE scene_id = ? 
    ORDER BY started_at DESC 
    LIMIT 10
  `).all(req.params.id);
  
  scene.recent_executions = recentExecutions;
  
  res.json({ success: true, data: scene });
});

router.post('/', (req, res) => {
  const { name, description, triggerExpression, actionQueue, fallbackPlan } = req.body;
  const id = `scene-${uuidv4().slice(0, 8)}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO scenes (id, name, description, trigger_expression, action_queue, fallback_plan, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, name, description || '', triggerExpression, JSON.stringify(actionQueue || []), JSON.stringify(fallbackPlan || {}), now, now);
  
  res.json({ success: true, data: { id } });
});

router.put('/:id', (req, res) => {
  const { name, description, triggerExpression, actionQueue, fallbackPlan, isActive } = req.body;
  const now = Date.now();
  
  const updates = [];
  const params = [];
  
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (triggerExpression !== undefined) { updates.push('trigger_expression = ?'); params.push(triggerExpression); }
  if (actionQueue !== undefined) { updates.push('action_queue = ?'); params.push(JSON.stringify(actionQueue)); }
  if (fallbackPlan !== undefined) { updates.push('fallback_plan = ?'); params.push(JSON.stringify(fallbackPlan)); }
  if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
  
  updates.push('updated_at = ?');
  params.push(now, req.params.id);
  
  db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM scenes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/execute', (req, res) => {
  const { triggeredBy = 'manual' } = req.body;
  const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id);
  
  if (!scene) {
    return res.status(404).json({ success: false, error: 'Scene not found' });
  }
  
  const now = Date.now();
  const execId = db.prepare(`
    INSERT INTO scene_executions (scene_id, triggered_by, status, started_at, action_results)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, triggeredBy, 'executing', now, '[]').lastInsertRowid;
  
  const actionQueue = JSON.parse(scene.action_queue || '[]');
  const fallbackPlan = JSON.parse(scene.fallback_plan || '{}');
  const results = [];
  let hasError = false;
  
  actionQueue.forEach((action, index) => {
    console.log(`[Scene Execute] ${scene.name} [${index + 1}/${actionQueue.length}]:`, action);
    
    let actionResult = {
      step: index + 1,
      deviceId: action.deviceId,
      action: action.action,
      status: 'success',
      timestamp: Date.now()
    };
    
    try {
      if (action.deviceId && action.action) {
        const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(action.deviceId);
        if (device) {
          const targetStatus = action.action.power === false ? 'offline' : 'online';
          db.prepare('UPDATE devices SET status = ?, last_heartbeat = ?, updated_at = ? WHERE id = ?')
            .run(targetStatus, Date.now(), Date.now(), action.deviceId);
          
          db.prepare('INSERT INTO device_heartbeats (device_id, timestamp, status, metrics) VALUES (?, ?, ?, ?)')
            .run(action.deviceId, Date.now(), targetStatus, JSON.stringify({ scene_triggered: scene.name }));
          
          actionResult.deviceName = device.name;
          actionResult.targetStatus = targetStatus;
        }
      }
    } catch (e) {
      hasError = true;
      actionResult.status = 'failed';
      actionResult.error = e.message;
      console.error(`[Scene Execute Error] Step ${index + 1}:`, e.message);
      
      if (fallbackPlan.onError === 'continue' || index < actionQueue.length - 1) {
        actionResult.fallback = '已跳过，继续执行后续动作';
      } else {
        actionResult.fallback = fallbackPlan.description || '执行失败，已中止';
      }
    }
    
    results.push(actionResult);
  });
  
  const finalStatus = hasError ? (fallbackPlan.onError === 'rollback' ? 'rolled_back' : 'partial_success') : 'completed';
  
  db.prepare('UPDATE scene_executions SET status = ?, completed_at = ?, action_results = ? WHERE id = ?')
    .run(finalStatus, Date.now(), JSON.stringify(results), execId);
  
  const executionCount = db.prepare('SELECT COUNT(*) as count FROM scene_executions WHERE scene_id = ?')
    .get(req.params.id).count;
  
  res.json({ 
    success: true, 
    data: { 
      executionId: execId,
      sceneId: req.params.id,
      sceneName: scene.name,
      triggerExpression: scene.trigger_expression,
      actionQueue: actionQueue,
      fallbackPlan: fallbackPlan,
      results,
      completed: !hasError,
      status: finalStatus,
      executionCount
    } 
  });
});

router.get('/executions/list', (req, res) => {
  const { limit = 50 } = req.query;
  const executions = db.prepare(`
    SELECT se.*, s.name as scene_name
    FROM scene_executions se
    LEFT JOIN scenes s ON se.scene_id = s.id
    ORDER BY se.started_at DESC
    LIMIT ?
  `).all(parseInt(limit));
  
  res.json({ success: true, data: executions });
});

router.get('/knowledge-graph/analyze', (req, res) => {
  const devices = db.prepare(`
    SELECT d.*, r.name as room_name
    FROM devices d
    LEFT JOIN rooms r ON d.room_id = r.id
    WHERE d.status = 'online'
  `).all();
  
  const patterns = [];
  
  const livingRoomDevices = devices.filter(d => d.room_name === '客厅');
  const hasLight = livingRoomDevices.some(d => d.name.includes('灯'));
  const hasAC = livingRoomDevices.some(d => d.name.includes('空调'));
  const hasProjector = livingRoomDevices.some(d => d.name.includes('投影'));
  
  if (hasLight && hasAC && hasProjector) {
    patterns.push({
      patternName: '观影模式',
      deviceCombination: livingRoomDevices.map(d => d.id),
      confidence: 0.92,
      suggestion: '检测到客厅设备组合，建议创建"观影模式"场景'
    });
  }
  
  const bedroomDevices = devices.filter(d => d.room_name && d.room_name.includes('卧'));
  if (bedroomDevices.length >= 2) {
    patterns.push({
      patternName: '睡眠模式',
      deviceCombination: bedroomDevices.map(d => d.id),
      confidence: 0.85,
      suggestion: '检测到卧室设备组合，建议创建"睡眠模式"场景'
    });
  }
  
  res.json({ success: true, data: patterns });
});

router.get('/detected/list', (req, res) => {
  const detected = db.prepare('SELECT * FROM auto_detected_scenes ORDER BY detected_at DESC').all().map(d => ({
    ...d,
    device_combination: JSON.parse(d.device_combination || '[]')
  }));
  
  res.json({ success: true, data: detected });
});

router.post('/detected/:id/confirm', (req, res) => {
  db.prepare('UPDATE auto_detected_scenes SET confirmed = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
