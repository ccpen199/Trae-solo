const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const recommendationService = require('../services/recommendationService');
const adService = require('../services/adService');
const interactionService = require('../services/interactionService');
const { generateRequestId } = require('../utils/audit');

router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const requestId = generateRequestId();
    const sessionId = req.headers['x-session-id'] || null;
    const userIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const user = req.user;
    
    const userProfile = await recommendationService.getUserProfile(user.id);
    
    const recResult = await recommendationService.generateRecommendations(user.id, {
      feedSize: parseInt(pageSize),
      requestId,
      sessionId,
      userIp,
      userAgent
    });
    
    const ads = await adService.selectAdsForFeed(
      user.id,
      parseInt(pageSize),
      userProfile,
      {
        requestId,
        sessionId,
        userIp
      }
    );
    
    const mergedFeed = adService.mergeAdsIntoFeed(recResult.recommendations, ads);
    
    res.json({
      success: true,
      data: {
        feed: mergedFeed,
        algorithmVersion: recResult.algorithmVersion,
        adCount: ads.length,
        requestId,
        distributionPath: recResult.distributionPath
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/delivered', authenticate, async (req, res, next) => {
  try {
    const { recommendationIds, adDeliveryIds } = req.body;
    
    if (!recommendationIds && !adDeliveryIds) {
      throw new AppError('缺少推荐ID或广告分发ID', 400);
    }
    
    const results = {
      recommendations: [],
      ads: []
    };
    
    if (recommendationIds && Array.isArray(recommendationIds)) {
      for (const recId of recommendationIds) {
        try {
          const rec = await recommendationService.markRecommendationDelivered(recId);
          results.recommendations.push({
            success: true,
            recommendationId: recId
          });
        } catch (err) {
          results.recommendations.push({
            success: false,
            recommendationId: recId,
            error: err.message
          });
        }
      }
    }
    
    if (adDeliveryIds && Array.isArray(adDeliveryIds)) {
      for (const deliveryId of adDeliveryIds) {
        try {
          const ad = await adService.markAdImpressed(deliveryId);
          results.ads.push({
            success: true,
            deliveryId
          });
        } catch (err) {
          results.ads.push({
            success: false,
            deliveryId,
            error: err.message
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: '送达状态已更新',
      data: results
    });
  } catch (error) {
    next(error);
  }
});

router.post('/viewed', authenticate, async (req, res, next) => {
  try {
    const { recommendationId, contentId, viewDuration = 0, scrollDepth = 0, readProgress = 0 } = req.body;
    
    if (!recommendationId && !contentId) {
      throw new AppError('缺少推荐ID或内容ID', 400);
    }
    
    if (recommendationId) {
      await recommendationService.markRecommendationViewed(recommendationId, viewDuration);
    }
    
    if (contentId) {
      const sessionId = req.headers['x-session-id'] || null;
      
      await interactionService.recordInteraction({
        userId: req.user.id,
        contentId,
        type: 'view',
        sessionId,
        recommendationId,
        viewDuration,
        scrollDepth,
        readProgress,
        source: 'feed',
        userIp: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
    
    res.json({
      success: true,
      message: '浏览记录已更新'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/clicked', authenticate, async (req, res, next) => {
  try {
    const { recommendationId, adDeliveryId, contentId } = req.body;
    
    if (!recommendationId && !adDeliveryId) {
      throw new AppError('缺少推荐ID或广告分发ID', 400);
    }
    
    if (recommendationId) {
      await recommendationService.markRecommendationClicked(recommendationId);
    }
    
    if (adDeliveryId) {
      await adService.markAdClicked(
        adDeliveryId,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      );
    }
    
    res.json({
      success: true,
      message: '点击记录已更新'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await recommendationService.getRecommendationStats(req.user.id, {
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

router.get('/hot', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, categoryId } = req.query;
    
    const { Content, Category } = require('../models');
    const { Op } = require('sequelize');
    
    const where = {
      status: 'published',
      isDuplicate: false
    };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        { association: 'category', attributes: ['id', 'name'] }
      ],
      order: [
        ['hotScore', 'DESC'],
        ['publishTime', 'DESC']
      ],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        contents: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
