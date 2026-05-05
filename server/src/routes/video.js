const express = require('express');
const db = require('../config/database');
const { getLatestSnapshot, generateSnapshot } = require('../services/deviceService');

const router = express.Router();

router.get('/snapshot/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const snapshot = getLatestSnapshot(deviceId);
    
    if (!snapshot) {
      return res.status(404).json({ error: '没有找到快照' });
    }
    
    res.json({ success: true, snapshot });
  } catch (error) {
    console.error('获取视频快照错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/snapshot/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = db.get('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    const snapshot = generateSnapshot(deviceId);
    
    res.json({ success: true, message: '快照已生成', snapshot });
  } catch (error) {
    console.error('生成视频快照错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/history/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 20 } = req.query;
    
    const snapshots = db.all(`
      SELECT * FROM video_snapshots 
      WHERE device_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [deviceId, parseInt(limit)]);
    
    res.json({ success: true, snapshots });
  } catch (error) {
    console.error('获取视频历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/stream/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    const interval = setInterval(() => {
      const snapshot = getLatestSnapshot(deviceId);
      if (snapshot) {
        res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
      }
    }, 3000);
    
    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (error) {
    console.error('视频流错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
