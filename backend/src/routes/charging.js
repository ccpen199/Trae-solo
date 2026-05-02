const express = require('express');
const router = express.Router();
const ocppService = require('../services/ocppService');
const billingService = require('../services/billingService');

router.post('/start', async (req, res) => {
  try {
    const { chargerId, userId, qrCode } = req.body;
    
    if (!chargerId && !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Charger ID or QR code is required'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = ocppService.startChargingSession(chargerId, userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:sessionId/stop', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    
    const result = ocppService.stopChargingSession(sessionId, reason || 'USER_REQUEST');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = ocppService.getSessionStatus(sessionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/pricing/rules', async (req, res) => {
  try {
    const rules = {
      peak: {
        timeRange: ['09:00-12:00', '18:00-23:00'],
        pricePerKwh: 1.80,
        serviceFee: 0.60,
        description: '峰时电价'
      },
      normal: {
        timeRange: ['07:00-09:00', '12:00-18:00', '23:00-23:30'],
        pricePerKwh: 1.20,
        serviceFee: 0.50,
        description: '平时电价'
      },
      valley: {
        timeRange: ['23:30-07:00'],
        pricePerKwh: 0.60,
        serviceFee: 0.40,
        description: '谷时电价'
      }
    };
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/pricing/estimate', async (req, res) => {
  try {
    const { energy, time } = req.body;
    
    if (!energy || energy <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid energy amount is required'
      });
    }
    
    const result = billingService.estimateCost(energy, time);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/ocpp/boot-notification', async (req, res) => {
  try {
    const { chargerId, payload } = req.body;
    
    const result = ocppService.handleBootNotification(chargerId, payload);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/ocpp/heartbeat', async (req, res) => {
  try {
    const { chargerId } = req.body;
    
    const result = ocppService.handleHeartbeat(chargerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/ocpp/status-notification', async (req, res) => {
  try {
    const { chargerId, payload } = req.body;
    
    const result = ocppService.handleStatusNotification(chargerId, payload);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/ocpp/meter-values', async (req, res) => {
  try {
    const { chargerId, payload } = req.body;
    
    const result = ocppService.handleMeterValues(chargerId, payload);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
