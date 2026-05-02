const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const settlementService = require('../services/settlementService');

router.post('/create', async (req, res) => {
  try {
    const { sessionId, userId, amount, paymentMethod } = req.body;
    
    if (!sessionId || !userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, User ID and amount are required'
      });
    }
    
    const result = paymentService.createPayment(
      sessionId, 
      userId, 
      parseFloat(amount), 
      paymentMethod || 'wechat'
    );
    
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

router.post('/:paymentId/process', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const result = paymentService.processPayment(paymentId);
    
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

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = paymentService.getPaymentBySession(sessionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
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

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = paymentService.getUserPayments(userId);
    
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

router.post('/settlement/:sessionId/execute', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await settlementService.executeSettlement(sessionId);
    
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

router.get('/settlement/report', async (req, res) => {
  try {
    const { operatorId, venueId, startDate, endDate } = req.query;
    
    const result = settlementService.getSettlementReport(
      operatorId, 
      venueId, 
      startDate, 
      endDate
    );
    
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

module.exports = router;
