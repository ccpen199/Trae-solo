const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES } = require('../middleware/auth');

const router = express.Router();

const DEVICE_TYPES = {
  ac: { name: '智能空调', icon: '❄️' },
  fridge: { name: '智能冰箱', icon: '🧊' },
  washer: { name: '智能洗衣机', icon: '🧺' },
  tv: { name: '智能电视', icon: '📺' },
  light: { name: '智能灯', icon: '💡' },
  heater: { name: '智能热水器', icon: '🔥' },
  air_purifier: { name: '空气净化器', icon: '🌬️' },
  other: { name: '其他设备', icon: '📱' },
};

router.get('/', auth, (req, res) => {
  try {
    const db = getDb();
    const { room, type, status } = req.query;

    let where = ['user_id = ?'];
    let params = [req.user.id];

    if (room) { where.push('room = ?'); params.push(room); }
    if (type) { where.push('type = ?'); params.push(type); }
    if (status) { where.push('status = ?'); params.push(status); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const devices = db.prepare(
      `SELECT * FROM devices ${whereClause} ORDER BY created_at DESC`
    ).all(...params);

    const result = devices.map(d => ({
      ...d,
      type_info: DEVICE_TYPES[d.type] || DEVICE_TYPES.other,
      settings: JSON.parse(d.settings || '{}')
    }));

    res.json({ devices: result });
  } catch (err) {
    res.status(500).json({ error: '获取设备列表失败' });
  }
});

router.get('/stats', auth, (req, res) => {
  try {
    const db = getDb();
    const devices = db.prepare(
      'SELECT * FROM devices WHERE user_id = ?'
    ).all(req.user.id);

    const onlineCount = devices.filter(d => d.status === 'online').length;
    const typeStats = {};
    devices.forEach(d => {
      typeStats[d.type] = (typeStats[d.type] || 0) + 1;
    });

    res.json({
      total: devices.length,
      online: onlineCount,
      offline: devices.length - onlineCount,
      type_stats: typeStats,
      rooms: [...new Set(devices.map(d => d.room).filter(Boolean))]
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

router.post('/discover', auth, (req, res) => {
  try {
    const db = getDb();
    const discoveredDevices = [
      { type: 'ac', name: '海尔智能空调', sn: 'HAIER-AC-' + Math.random().toString(36).substring(2, 10).toUpperCase(), model: 'HAC-35GW' },
      { type: 'fridge', name: '海尔对开门冰箱', sn: 'HAIER-FR-' + Math.random().toString(36).substring(2, 10).toUpperCase(), model: 'HFR-500L' },
      { type: 'washer', name: '海尔滚筒洗衣机', sn: 'HAIER-WA-' + Math.random().toString(36).substring(2, 10).toUpperCase(), model: 'HWA-10KG' },
    ];

    res.json({
      devices: discoveredDevices,
      count: discoveredDevices.length,
      tips: [
        '请确保设备已连接电源',
        '请确保手机与设备在同一WiFi下',
        '长按设备配网键3秒进入配网模式'
      ]
    });
  } catch (err) {
    res.status(500).json({ error: '设备发现失败' });
  }
});

router.post('/bind', auth, (req, res) => {
  try {
    const { sn, name, room, type } = req.body;
    if (!sn || !name) {
      return res.status(400).json({ error: '设备SN和名称必填' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM devices WHERE sn = ?').get(sn);
    if (existing && existing.user_id) {
      return res.status(400).json({ error: '该设备已被其他用户绑定' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const deviceType = type || 'other';

    if (existing) {
      db.prepare(
        'UPDATE devices SET user_id = ?, name = ?, room = ?, status = ?, power_status = ?, updated_at = ? WHERE sn = ?'
      ).run(req.user.id, name, room || null, 'online', 'off', now, sn);
    } else {
      db.prepare(
        'INSERT INTO devices (id, user_id, name, type, sn, model, status, power_status, room, firmware_version, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, req.user.id, name, deviceType, sn, null, 'online', 'off', room || null, 'V1.0.0', JSON.stringify({}), now, now);
    }

    const insertNotification = db.prepare(
      'INSERT INTO notifications (user_id, title, content, type) VALUES (?, ?, ?, ?)'
    );
    insertNotification.run(req.user.id, '设备绑定成功', `您已成功绑定设备：${name}`, 'device');

    db.prepare(
      'UPDATE users SET points = points + 50, updated_at = ? WHERE id = ?'
    ).run(now, req.user.id);

    db.prepare(
      'INSERT INTO points_transactions (user_id, amount, type, reason) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, 50, 'earn', '绑定设备奖励');

    res.json({
      device_id: existing?.id || id,
      message: '设备绑定成功！获得50积分',
      points_earned: 50
    });
  } catch (err) {
    res.status(500).json({ error: '绑定失败，请重试' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const db = getDb();
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!device) {
      return res.status(404).json({ error: '设备不存在或无权限' });
    }

    const data = db.prepare(
      'SELECT * FROM device_data WHERE device_id = ? ORDER BY timestamp DESC LIMIT 50'
    ).all(req.params.id);

    res.json({
      ...device,
      type_info: DEVICE_TYPES[device.type] || DEVICE_TYPES.other,
      settings: JSON.parse(device.settings || '{}'),
      recent_data: data
    });
  } catch (err) {
    res.status(500).json({ error: '获取设备详情失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const { name, room } = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      'UPDATE devices SET name = COALESCE(?, name), room = COALESCE(?, room), updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(name, room, now, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在或无权限' });
    }

    res.json({ message: '设备信息已更新' });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/:id/control', auth, (req, res) => {
  try {
    const { action, params } = req.body;
    if (!action) {
      return res.status(400).json({ error: '操作类型必填' });
    }

    const db = getDb();
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!device) {
      return res.status(404).json({ error: '设备不存在或无权限' });
    }

    const now = new Date().toISOString();
    let settings = JSON.parse(device.settings || '{}');
    let power_status = device.power_status;

    if (action === 'power_on') {
      power_status = 'on';
    } else if (action === 'power_off') {
      power_status = 'off';
    } else if (action === 'set_params' && params) {
      settings = { ...settings, ...params };
    }

    db.prepare(
      'UPDATE devices SET power_status = ?, settings = ?, status = ?, last_online = ?, updated_at = ? WHERE id = ?'
    ).run(power_status, JSON.stringify(settings), 'online', now, now, req.params.id);

    db.prepare(
      'INSERT INTO device_data (device_id, data_type, value) VALUES (?, ?, ?)'
    ).run(req.params.id, 'control', JSON.stringify({ action, params, power_status }));

    res.json({
      message: '指令已下发',
      power_status,
      settings
    });
  } catch (err) {
    res.status(500).json({ error: '控制失败' });
  }
});

router.delete('/:id/unbind', auth, (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      'UPDATE devices SET user_id = NULL, status = ?, power_status = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run('offline', 'off', now, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在或无权限' });
    }

    res.json({ message: '设备已解绑' });
  } catch (err) {
    res.status(500).json({ error: '解绑失败' });
  }
});

module.exports = router;
