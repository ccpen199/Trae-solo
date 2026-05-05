const express = require('express');
const db = require('../config/database');
const { getLatestDeviceData, getAllDevices } = require('../services/deviceService');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const devices = getAllDevices();
    res.json({ success: true, devices });
  } catch (error) {
    console.error('获取设备列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = db.get('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    const latestData = getLatestDeviceData(deviceId);
    
    res.json({
      success: true,
      device,
      latestData
    });
  } catch (error) {
    console.error('获取设备信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:deviceId/history', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50, dataType } = req.query;
    
    let query = `
      SELECT * FROM device_data 
      WHERE device_id = ?
    `;
    const params = [deviceId];
    
    if (dataType) {
      query += ' AND data_type = ?';
      params.push(dataType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const history = db.all(query, params);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('获取设备历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/report', (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, data } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '设备ID不能为空' });
    }
    
    let device = db.get('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    
    if (!device) {
      db.run(
        'INSERT INTO devices (device_id, device_name, device_type, status) VALUES (?, ?, ?, ?)',
        [deviceId, deviceName || deviceId, deviceType || 'unknown', 'online']
      );
    } else {
      db.run(
        'UPDATE devices SET status = ?, last_online = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?',
        ['online', deviceId]
      );
    }
    
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        db.run(
          'INSERT INTO device_data (device_id, data_type, value, metadata) VALUES (?, ?, ?, ?)',
          [deviceId, item.dataType, item.value, item.metadata ? JSON.stringify(item.metadata) : null]
        );
      });
    }
    
    res.json({ success: true, message: '数据上报成功' });
  } catch (error) {
    console.error('设备数据上报错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
