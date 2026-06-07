const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const db = getDb();
    const scenes = db.prepare(
      'SELECT * FROM scenes WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    const result = scenes.map(s => ({
      ...s,
      actions: JSON.parse(s.actions || '[]'),
      triggers: JSON.parse(s.triggers || '{}')
    }));

    res.json({ scenes: result });
  } catch (err) {
    res.status(500).json({ error: '获取场景列表失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, icon, description, actions, triggers } = req.body;
    if (!name) {
      return res.status(400).json({ error: '场景名称必填' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO scenes (id, user_id, name, icon, description, actions, triggers, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, name, icon || '🏠', description || null,
         JSON.stringify(actions || []), JSON.stringify(triggers || {}), 1, now);

    res.status(201).json({
      scene_id: id,
      message: '场景创建成功'
    });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.post('/:id/trigger', auth, (req, res) => {
  try {
    const db = getDb();
    const scene = db.prepare(
      'SELECT * FROM scenes WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!scene) {
      return res.status(404).json({ error: '场景不存在' });
    }

    const actions = JSON.parse(scene.actions || '[]');
    const now = new Date().toISOString();

    for (const action of actions) {
      if (action.device_id) {
        db.prepare(
          'UPDATE devices SET power_status = ?, last_online = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        ).run(action.power_status || 'on', now, now, action.device_id, req.user.id);
      }
    }

    db.prepare(
      'INSERT INTO scene_logs (scene_id, triggered_by, result, created_at) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, 'manual', 'success', now);

    res.json({ message: '场景执行成功', executed_actions: actions.length });
  } catch (err) {
    res.status(500).json({ error: '执行失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const { name, icon, description, actions, triggers, is_active } = req.body;
    const db = getDb();

    const result = db.prepare(
      `UPDATE scenes SET 
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        description = COALESCE(?, description),
        actions = COALESCE(?, actions),
        triggers = COALESCE(?, triggers),
        is_active = COALESCE(?, is_active)
       WHERE id = ? AND user_id = ?`
    ).run(name, icon, description,
          actions ? JSON.stringify(actions) : null,
          triggers ? JSON.stringify(triggers) : null,
          is_active, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '场景不存在' });
    }

    res.json({ message: '场景已更新' });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(
      'DELETE FROM scenes WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '场景不存在' });
    }

    res.json({ message: '场景已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

router.get('/templates', auth, (req, res) => {
  res.json({
    templates: [
      { id: 'home', name: '回家模式', icon: '🏠', description: '打开空调、灯光，热水器加热' },
      { id: 'leave', name: '离家模式', icon: '🚪', description: '关闭所有设备，启动安防' },
      { id: 'sleep', name: '睡眠模式', icon: '🌙', description: '调暗灯光，空调调温，净化器开启' },
      { id: 'movie', name: '影院模式', icon: '🎬', description: '关闭主灯，开启电视和音响' },
      { id: 'morning', name: '晨起模式', icon: '🌅', description: '缓慢开启灯光，播放新闻，热水器加热' },
    ]
  });
});

module.exports = router;
