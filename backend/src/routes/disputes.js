const express = require('express');
const router = express.Router();
const { authenticateToken, requireSupport } = require('../middlewares/auth');
const disputeService = require('../services/DisputeService');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { consultationId, reason, description } = req.body;

    if (!consultationId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: '咨询单ID和争议原因为必填项' 
      });
    }

    const result = await disputeService.raiseDispute(
      consultationId,
      req.user.id,
      req.user.role,
      { reason, description }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('发起争议错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/pending', authenticateToken, requireSupport, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await disputeService.getPendingDisputes(
      parseInt(limit),
      parseInt(offset)
    );

    res.json(result);
  } catch (error) {
    console.error('获取待处理争议错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await disputeService.getDisputeById(req.params.id, req.user.role);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('获取争议详情错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/handle', authenticateToken, requireSupport, async (req, res) => {
  try {
    const { resolution, shouldRefund, refundAmount } = req.body;

    if (!resolution) {
      return res.status(400).json({ 
        success: false, 
        message: '处理结果为必填项' 
      });
    }

    const result = await disputeService.handleDispute(
      req.params.id,
      req.user.id,
      resolution,
      shouldRefund === true,
      parseFloat(refundAmount) || 0
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('处理争议错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/consultation/:consultationId', authenticateToken, async (req, res) => {
  try {
    const result = await disputeService.getDisputeHistory(req.params.consultationId);
    res.json(result);
  } catch (error) {
    console.error('获取咨询单争议历史错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
