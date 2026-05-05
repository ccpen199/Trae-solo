const express = require('express');
const db = require('../config/database');
const { controlLed, setTemperature, controlVideo } = require('../services/deviceService');

const router = express.Router();

router.post('/led', (req, res) => {
  try {
    const { deviceId, status, brightness, color } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '设备ID不能为空' });
    }
    
    const device = db.get('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    const result = controlLed(deviceId, {
      status: status || 'off',
      brightness: brightness || 100,
      color: color || '#ffffff'
    });
    
    db.run(
      'INSERT INTO control_commands (device_id, command, parameters, status, executed_by, executed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [deviceId, 'led_control', JSON.stringify({ status, brightness, color }), 'executed', req.user.id]
    );
    
    res.json({ success: true, message: 'LED控制指令已发送', result });
  } catch (error) {
    console.error('LED控制错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/temperature', (req, res) => {
  try {
    const { deviceId, targetTemperature, mode } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '设备ID不能为空' });
    }
    
    if (targetTemperature === undefined || targetTemperature === null) {
      return res.status(400).json({ error: '目标温度不能为空' });
    }
    
    const device = db.get('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    const result = setTemperature(deviceId, {
      targetTemperature: parseFloat(targetTemperature),
      mode: mode || 'auto'
    });
    
    db.run(
      'INSERT INTO control_commands (device_id, command, parameters, status, executed_by, executed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [deviceId, 'temperature_control', JSON.stringify({ targetTemperature, mode }), 'executed', req.user.id]
    );
    
    res.json({ success: true, message: '温度控制指令已发送', result });
  } catch (error) {
    console.error('温度控制错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/video', (req, res) => {
  try {
    const { deviceId, action } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '设备ID不能为空' });
    }
    
    if (!action) {
      return res.status(400).json({ error: '操作类型不能为空' });
    }
    
    const device = db.get('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    const result = controlVideo(deviceId, action);
    
    db.run(
      'INSERT INTO control_commands (device_id, command, parameters, status, executed_by, executed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [deviceId, 'video_control', JSON.stringify({ action }), 'executed', req.user.id]
    );
    
    res.json({ success: true, message: '视频控制指令已发送', result });
  } catch (error) {
    console.error('视频控制错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const commands = db.all(`
      SELECT 
        cc.*,
        u.username as executed_by_name
      FROM control_commands cc
      LEFT JOIN users u ON cc.executed_by = u.id
      ORDER BY cc.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    res.json({ success: true, commands });
  } catch (error) {
    console.error('获取控制历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
