const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditService = require('../services/audit.service');
const disputeResolvingService = require('../services/dispute-resolving.service');

router.post('/', authenticateToken, (req, res) => {
  const { orderId, type, title, description, evidence = [] } = req.body;
  const userId = req.user.id;

  if (!orderId || !title) {
    return res.status(400).json({
      success: false,
      message: '订单ID和纠纷标题不能为空'
    });
  }

  try {
    const dispute = disputeResolvingService.createDispute(orderId, userId, {
      type,
      title,
      description,
      evidence
    });

    res.json({
      success: true,
      message: '纠纷已创建，等待客服处理',
      data: {
        ...dispute,
        evidence: dispute.evidence ? JSON.parse(dispute.evidence) : []
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const disputes = disputeResolvingService.getDisputesByUser(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: disputes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/pending', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const disputes = disputeResolvingService.getPendingDisputes({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: disputes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/assigned', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const disputes = disputeResolvingService.getDisputesForHandler(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: disputes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  const disputeId = req.params.id;
  const userId = req.user.id;

  try {
    const dispute = disputeResolvingService.getDispute(disputeId);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: '纠纷不存在'
      });
    }

    if (dispute.initiator_id !== userId && 
        dispute.respondent_id !== userId &&
        dispute.handler_id !== userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权查看此纠纷'
      });
    }

    res.json({
      success: true,
      data: dispute
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/assign', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  const disputeId = req.params.id;
  const { handlerId } = req.body;
  const userId = req.user.id;

  try {
    const dispute = disputeResolvingService.getDispute(disputeId);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: '纠纷不存在'
      });
    }

    const handlerUserId = handlerId || userId;
    const updatedDispute = disputeResolvingService.assignHandler(disputeId, handlerUserId, req.user);

    res.json({
      success: true,
      message: '纠纷已分配',
      data: updatedDispute
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/mediate', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  const disputeId = req.params.id;

  try {
    const dispute = disputeResolvingService.getDispute(disputeId);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: '纠纷不存在'
      });
    }

    const updatedDispute = disputeResolvingService.startMediation(disputeId, req.user);

    res.json({
      success: true,
      message: '纠纷已进入调解阶段',
      data: updatedDispute
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/resolve', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  const disputeId = req.params.id;
  const { resolution, mediationResult, refundAmount, winnerId, loserId } = req.body;

  if (!resolution) {
    return res.status(400).json({
      success: false,
      message: '请提供处理方案'
    });
  }

  try {
    const dispute = disputeResolvingService.getDispute(disputeId);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: '纠纷不存在'
      });
    }

    const resolvedDispute = disputeResolvingService.resolveDispute(disputeId, resolution, {
      mediationResult,
      refundAmount: refundAmount ? parseFloat(refundAmount) : null,
      winnerId: winnerId ? parseInt(winnerId) : null,
      loserId: loserId ? parseInt(loserId) : null,
      actor: req.user
    });

    res.json({
      success: true,
      message: '纠纷已解决',
      data: resolvedDispute
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/close', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  const disputeId = req.params.id;

  try {
    const closedDispute = disputeResolvingService.closeDispute(disputeId, req.user);

    res.json({
      success: true,
      message: '纠纷已关闭',
      data: closedDispute
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/evidence', authenticateToken, (req, res) => {
  const disputeId = req.params.id;
  const userId = req.user.id;
  const { type, content, images = [] } = req.body;

  if (!content && images.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供证据内容或图片'
    });
  }

  try {
    const evidence = disputeResolvingService.addEvidence(disputeId, userId, {
      type: type || 'text',
      content,
      images
    }, req.user);

    res.json({
      success: true,
      message: '证据已添加',
      data: evidence
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/types', (req, res) => {
  const types = [
    { value: 'quality', label: '商品质量问题' },
    { value: 'delivery', label: '物流配送问题' },
    { value: 'payment', label: '支付款项问题' },
    { value: 'other', label: '其他问题' }
  ];

  res.json({
    success: true,
    data: types
  });
});

router.get('/resolutions', (req, res) => {
  const resolutions = [
    { value: 'full_refund', label: '全额退款' },
    { value: 'partial_refund', label: '部分退款' },
    { value: 'keep_item', label: '保留商品' },
    { value: 'return_refund', label: '退货退款' },
    { value: 'other', label: '其他处理方式' }
  ];

  res.json({
    success: true,
    data: resolutions
  });
});

module.exports = router;
