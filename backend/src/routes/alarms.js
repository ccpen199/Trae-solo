const express = require('express');
const router = express.Router();
const models = require('../models');
const utils = require('../utils');

router.get('/', (req, res) => {
  try {
    const { status, station_id } = req.query;
    let alarms = models.getAlarms.all();
    
    if (status) {
      alarms = alarms.filter(a => a.status === status);
    }
    if (station_id) {
      alarms = alarms.filter(a => a.station_id === parseInt(station_id));
    }
    
    const summary = {
      total: alarms.length,
      pending: alarms.filter(a => a.status === 'pending').length,
      processing: alarms.filter(a => a.status === 'processing').length,
      resolved: alarms.filter(a => a.status === 'resolved').length,
      high: alarms.filter(a => a.alarm_level === 'high').length,
      medium: alarms.filter(a => a.alarm_level === 'medium').length,
      low: alarms.filter(a => a.alarm_level === 'low').length
    };
    
    res.json({
      success: true,
      data: alarms,
      summary,
      total: alarms.length
    });
  } catch (err) {
    console.error('获取告警列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取告警列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const alarm = models.getAlarmById.get(id);
    
    if (!alarm) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    res.json({
      success: true,
      data: alarm
    });
  } catch (err) {
    console.error('获取工单详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取工单详情失败'
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignee, description, resolution } = req.body;
    
    const alarm = models.getAlarmById.get(id);
    if (!alarm) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    models.updateAlarm.run(
      status || alarm.status,
      assignee || alarm.assignee,
      description || alarm.description,
      resolution || alarm.resolution,
      status || alarm.status,
      id
    );
    
    const updatedAlarm = models.getAlarmById.get(id);
    
    res.json({
      success: true,
      message: '工单更新成功',
      data: updatedAlarm
    });
  } catch (err) {
    console.error('更新工单失败:', err);
    res.status(500).json({
      success: false,
      message: '更新工单失败'
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { charger_id, station_id, alarm_type, alarm_code, alarm_message, alarm_level, assignee } = req.body;
    
    if (!charger_id || !station_id || !alarm_type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    const db = require('../config/database');
    const workOrderNo = utils.generateWorkOrderNo();
    
    const result = db.prepare(`
      INSERT INTO alarm_work_orders 
      (work_order_no, charger_id, station_id, alarm_type, alarm_code, alarm_message, alarm_level, status, assignee)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      workOrderNo,
      charger_id,
      station_id,
      alarm_type,
      alarm_code || null,
      alarm_message || null,
      alarm_level || 'normal',
      assignee || null
    );
    
    const alarm = models.getAlarmById.get(result.lastInsertRowid);
    
    res.json({
      success: true,
      message: '告警工单已创建',
      data: alarm
    });
  } catch (err) {
    console.error('创建告警工单失败:', err);
    res.status(500).json({
      success: false,
      message: '创建告警工单失败'
    });
  }
});

module.exports = router;
