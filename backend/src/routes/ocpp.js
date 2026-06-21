const express = require('express');
const router = express.Router();
const models = require('../models');

router.post('/:charger_code/message', (req, res) => {
  try {
    const { charger_code } = req.params;
    const { message_type, action, payload } = req.body;
    
    if (!message_type) {
      return res.status(400).json({
        success: false,
        message: '缺少消息类型'
      });
    }
    
    const charger = models.getChargerByCode.get(charger_code);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    models.insertOcppMessage.run(
      charger_code,
      message_type,
      action || null,
      payload ? JSON.stringify(payload) : null,
      'in'
    );
    
    let response = { success: true };
    
    switch (action) {
      case 'BootNotification':
        response = {
          status: 'Accepted',
          currentTime: new Date().toISOString(),
          heartbeatInterval: 300
        };
        break;
      case 'Heartbeat':
        response = {
          currentTime: new Date().toISOString()
        };
        break;
      case 'StatusNotification':
        response = { status: 'Accepted' };
        break;
      case 'MeterValues':
        response = { status: 'Accepted' };
        break;
      case 'StartTransaction':
        response = {
          status: 'Accepted',
          transactionId: Date.now(),
          idTagInfo: { status: 'Accepted' }
        };
        break;
      case 'StopTransaction':
        response = {
          idTagInfo: { status: 'Accepted' }
        };
        break;
      default:
        response = { status: 'Accepted' };
    }
    
    models.insertOcppMessage.run(
      charger_code,
      'response',
      action || null,
      JSON.stringify(response),
      'out'
    );
    
    res.json({
      success: true,
      data: {
        message_id: Date.now(),
        response,
        protocol: 'OCPP 1.6',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('处理OCPP消息失败:', err);
    res.status(500).json({
      success: false,
      message: '处理OCPP消息失败'
    });
  }
});

router.get('/:charger_code/messages', (req, res) => {
  try {
    const { charger_code } = req.params;
    const messages = models.getOcppMessages.all(charger_code);
    
    res.json({
      success: true,
      data: messages,
      total: messages.length
    });
  } catch (err) {
    console.error('获取OCPP消息失败:', err);
    res.status(500).json({
      success: false,
      message: '获取OCPP消息失败'
    });
  }
});

module.exports = router;
