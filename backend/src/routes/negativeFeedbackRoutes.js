const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const negativeFeedbackService = require('../services/negativeFeedbackService');

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { contentId, type = 'not_interested', reason } = req.body;
    
    if (!contentId) {
      throw new AppError('内容ID不能为空', 400);
    }
    
    const validTypes = ['not_interested', 'already_seen', 'low_quality', 'misleading', 'offensive', 'other'];
    if (!validTypes.includes(type)) {
      throw new AppError('无效的负反馈类型', 400);
    }
    
    const sessionId = req.headers['x-session-id'] || null;
    const recommendationId = req.headers['x-recommendation-id'] || null;
    
    const result = await negativeFeedbackService.createNegativeFeedback({
      userId: req.user.id,
      contentId,
      type,
      reason,
      recommendationId,
      sessionId,
      userIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: result.isNew ? '负反馈已提交，将优化后续推荐' : '您已提交过类似反馈',
      data: {
        feedback: result.feedback,
        isNew: result.isNew
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/types', authenticate, async (req, res, next) => {
  try {
    const types = [
      { value: 'not_interested', label: '不感兴趣', description: '对此类内容不感兴趣' },
      { value: 'already_seen', label: '已经看过', description: '已经看过此内容' },
      { value: 'low_quality', label: '内容质量差', description: '内容质量低下' },
      { value: 'misleading', label: '误导性内容', description: '内容具有误导性' },
      { value: 'offensive', label: '令人反感', description: '内容令人反感' },
      { value: 'other', label: '其他原因', description: '其他原因' }
    ];
    
    res.json({
      success: true,
      data: {
        types
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    
    const result = await negativeFeedbackService.getUserNegativeFeedbackHistory(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      type
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const stats = await negativeFeedbackService.getNegativeFeedbackStats(req.user.id, {
      startDate,
      endDate,
      type
    });
    
    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/content/:contentId', authenticate, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { startDate, endDate } = req.query;
    
    const stats = await negativeFeedbackService.getContentNegativeFeedbackStats(contentId, {
      startDate,
      endDate
    });
    
    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
