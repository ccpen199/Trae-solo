const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const analyticsService = require('../services/analyticsService');

router.get('/overview', authenticate, authorize('operator', 'algorithm', 'admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const [contentOverview, userOverview] = await Promise.all([
      analyticsService.getContentOverview({ startDate, endDate }),
      analyticsService.getUserOverview({ startDate, endDate })
    ]);
    
    res.json({
      success: true,
      data: {
        content: contentOverview,
        user: userOverview
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dau', authenticate, authorize('operator', 'algorithm', 'admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new AppError('请指定开始日期和结束日期', 400);
    }
    
    const dauRecords = await analyticsService.getDAURange(startDate, endDate);
    
    res.json({
      success: true,
      data: {
        dauRecords
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/dau/calculate', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { date } = req.body;
    
    const targetDate = date ? new Date(date) : new Date();
    const dau = await analyticsService.calculateDAU(targetDate);
    
    res.json({
      success: true,
      message: 'DAU统计完成',
      data: {
        dau
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/retention', authenticate, authorize('operator', 'algorithm', 'admin'), async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    
    const retentionStats = await analyticsService.getRetentionStats({
      startDate,
      endDate,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: {
        retentionStats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/retention/calculate', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { cohortDate } = req.body;
    
    if (!cohortDate) {
      throw new AppError('请指定分组日期', 400);
    }
    
    const retention = await analyticsService.calculateRetention(cohortDate);
    
    if (!retention) {
      return res.json({
        success: true,
        message: '该日期没有新注册用户，无法计算留存',
        data: null
      });
    }
    
    res.json({
      success: true,
      message: '留存统计完成',
      data: {
        retention
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const {
      eventType,
      userId,
      targetType,
      targetId,
      startDate,
      endDate,
      status,
      page = 1,
      pageSize = 20
    } = req.query;
    
    const result = await analyticsService.getAuditLogs({
      eventType,
      userId,
      targetType,
      targetId,
      startDate,
      endDate,
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ad-reconciliations', authenticate, authorize('operator', 'advertiser', 'admin'), async (req, res, next) => {
  try {
    const {
      advertiserId,
      campaignId,
      startDate,
      endDate,
      status,
      page = 1,
      pageSize = 20
    } = req.query;
    
    let targetAdvertiserId = advertiserId;
    if (req.user.role === 'advertiser') {
      const { Advertiser } = require('../models');
      const advertiser = await Advertiser.findOne({ where: { userId: req.user.id } });
      if (advertiser) {
        targetAdvertiserId = advertiser.id;
      }
    }
    
    const result = await analyticsService.getAdReconciliations({
      advertiserId: targetAdvertiserId,
      campaignId,
      startDate,
      endDate,
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/ad-reconciliations/create', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { advertiserId, date } = req.body;
    
    if (!advertiserId || !date) {
      throw new AppError('请指定广告主ID和日期', 400);
    }
    
    const reconciliation = await require('../services/adService').createReconciliation(
      advertiserId,
      date
    );
    
    res.json({
      success: true,
      message: '对账记录创建成功',
      data: {
        reconciliation
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/health', async (req, res, next) => {
  try {
    const health = await analyticsService.getSystemHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
});

router.get('/realtime-dashboard', authenticate, authorize('operator', 'algorithm', 'admin'), async (req, res, next) => {
  try {
    const { Content, User, Interaction, Recommendation, AdDelivery } = require('../models');
    const { Op } = require('sequelize');
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [
      todayViews,
      todayLikes,
      todayComments,
      todayRecommendations,
      todayAdImpressions,
      todayAdClicks
    ] = await Promise.all([
      Interaction.count({
        where: { type: 'view', createdAt: { [Op.gte]: todayStart } }
      }),
      Interaction.count({
        where: { type: 'like', createdAt: { [Op.gte]: todayStart } }
      }),
      Interaction.count({
        where: { type: 'comment', createdAt: { [Op.gte]: todayStart } }
      }),
      Recommendation.count({
        where: { createdAt: { [Op.gte]: todayStart } }
      }),
      AdDelivery.count({
        where: { isImpressed: true, createdAt: { [Op.gte]: todayStart } }
      }),
      AdDelivery.count({
        where: { isClicked: true, createdAt: { [Op.gte]: todayStart } }
      })
    ]);
    
    const activeUsers = await Interaction.findAll({
      where: { createdAt: { [Op.gte]: todayStart } },
      attributes: ['userId'],
      group: ['userId']
    });
    
    res.json({
      success: true,
      data: {
        today: {
          activeUsers: activeUsers.length,
          views: todayViews,
          likes: todayLikes,
          comments: todayComments,
          recommendations: todayRecommendations,
          adImpressions: todayAdImpressions,
          adClicks: todayAdClicks,
          adCtr: todayAdImpressions > 0 ? todayAdClicks / todayAdImpressions : 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
