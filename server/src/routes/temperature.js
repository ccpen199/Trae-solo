const express = require('express');
const db = require('../config/database');
const { getCurrentTemperature, getTargetTemperature, getTemperatureHistory } = require('../services/deviceService');

const router = express.Router();

router.get('/current/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const currentTemp = getCurrentTemperature(deviceId);
    const targetTemp = getTargetTemperature(deviceId);
    
    res.json({
      success: true,
      current: currentTemp,
      target: targetTemp
    });
  } catch (error) {
    console.error('获取当前温度错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/history/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100, hours = 24 } = req.query;
    
    const history = getTemperatureHistory(deviceId, parseInt(limit), parseInt(hours));
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('获取温度历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/stats/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;
    
    const history = getTemperatureHistory(deviceId, 1000, parseInt(hours));
    
    if (history.length === 0) {
      return res.json({
        success: true,
        stats: {
          min: null,
          max: null,
          avg: null,
          count: 0
        }
      });
    }
    
    const temps = history.map(h => h.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    
    res.json({
      success: true,
      stats: {
        min,
        max,
        avg: parseFloat(avg.toFixed(2)),
        count: temps.length
      }
    });
  } catch (error) {
    console.error('获取温度统计错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
