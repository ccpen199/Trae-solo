const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authMiddleware, (req, res) => {
  const { device_id, device_name, device_type = 'camera' } = req.body;

  if (!device_id) {
    return res.status(400).json({ message: '设备ID不能为空' });
  }

  try {
    const existingDevice = db.prepare('SELECT id FROM virtual_devices WHERE device_id = ?').get(device_id);
    if (existingDevice) {
      return res.status(400).json({ message: '设备已注册' });
    }

    const result = db.prepare(`INSERT INTO virtual_devices (user_id, device_id, device_name, device_type) VALUES (?, ?, ?, ?)`).run(
      req.user.id, device_id, device_name, device_type
    );
    res.status(201).json({ message: '设备注册成功', deviceId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ message: '设备注册失败', error: error.message });
  }
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const devices = db.prepare('SELECT * FROM virtual_devices WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: '获取设备列表失败', error: error.message });
  }
});

router.post('/:deviceId/action', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { action_type, action_params } = req.body;

  if (!action_type) {
    return res.status(400).json({ message: '操作类型不能为空' });
  }

  try {
    const device = db.prepare('SELECT id FROM virtual_devices WHERE id = ? AND user_id = ?').get(deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    const simulatedResults = {
      'capture': { success: true, photo_url: '/uploads/simulated.jpg', thumbnail: '/uploads/simulated-thumb.jpg' },
      'preview': { success: true, preview_url: '/uploads/preview.jpg' },
      'beauty_apply': { success: true, settings_applied: true },
      'filter_apply': { success: true, filter_applied: action_params?.filter || '原图' },
      'scene_analysis': { success: true, scene_detected: '人像', confidence: 0.85 },
      'save_photo': { success: true, saved: true, storage_used: '2.3MB' }
    };

    const result = simulatedResults[action_type] || { success: true, message: '操作完成' };
    const resultJson = JSON.stringify(result);

    const actionResult = db.prepare(`INSERT INTO device_actions (device_id, action_type, action_params, result, success) VALUES (?, ?, ?, ?, ?)`).run(
      deviceId, action_type, action_params ? JSON.stringify(action_params) : null, resultJson, result.success ? 1 : 0
    );

    db.prepare(`UPDATE virtual_devices SET status = ?, last_action = ?, last_result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
      'idle', action_type, resultJson, deviceId
    );

    res.json({
      message: '操作完成',
      actionId: actionResult.lastInsertRowid,
      result
    });
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.get('/:deviceId/actions', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const actions = db.prepare(`SELECT * FROM device_actions WHERE device_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(deviceId, parseInt(limit), offset);
    actions.forEach(action => {
      if (action.action_params) action.action_params = JSON.parse(action.action_params);
      if (action.result) action.result = JSON.parse(action.result);
    });
    res.json({ actions });
  } catch (error) {
    res.status(500).json({ message: '获取操作记录失败', error: error.message });
  }
});

router.put('/actions/:actionId/confirm', authMiddleware, (req, res) => {
  const { actionId } = req.params;

  try {
    const action = db.prepare(`SELECT da.id, da.device_id
          FROM device_actions da
          JOIN virtual_devices vd ON da.device_id = vd.id
          WHERE da.id = ? AND vd.user_id = ?`).get(actionId, req.user.id);

    if (!action) {
      return res.status(404).json({ message: '操作记录不存在' });
    }

    db.prepare('UPDATE device_actions SET user_confirmed = 1 WHERE id = ?').run(actionId);
    db.prepare('UPDATE virtual_devices SET user_confirmed = user_confirmed + 1 WHERE id = ?').run(action.device_id);
    res.json({ message: '已确认' });
  } catch (error) {
    res.status(500).json({ message: '确认失败', error: error.message });
  }
});

router.put('/:deviceId/status', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { status } = req.body;

  try {
    const device = db.prepare('SELECT id FROM virtual_devices WHERE id = ? AND user_id = ?').get(deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    db.prepare('UPDATE virtual_devices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, deviceId);
    res.json({ message: '状态已更新' });
  } catch (error) {
    res.status(500).json({ message: '更新状态失败', error: error.message });
  }
});

router.delete('/:deviceId', authMiddleware, (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = db.prepare('SELECT id FROM virtual_devices WHERE id = ? AND user_id = ?').get(deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    db.prepare('DELETE FROM device_actions WHERE device_id = ?').run(deviceId);
    db.prepare('DELETE FROM virtual_devices WHERE id = ?').run(deviceId);
    res.json({ message: '设备已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除设备失败', error: error.message });
  }
});

module.exports = router;