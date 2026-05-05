const express = require('express');
const router = express.Router();
const UserCenterService = require('../services/userCenterService');
const PaymentCenterService = require('../services/paymentCenterService');

router.get('/info/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userInfo = UserCenterService.getUserInfo(parseInt(userId));
    
    if (!userInfo) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const privileges = UserCenterService.getLevelPrivileges(userInfo.user.current_level_id);
    const retentionStrategy = UserCenterService.getRetentionStrategy(userInfo.user.current_level_id);
    const expiringGrowth = UserCenterService.getExpiringGrowth(parseInt(userId));

    res.json({
      success: true,
      data: {
        userInfo,
        privileges,
        retentionStrategy,
        expiringGrowth
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/points/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const result = PaymentCenterService.getUserPoints(parseInt(userId));
    
    if (!result) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取用户积分失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/growth/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    const growthRecords = UserCenterService.getUserGrowthRecords(parseInt(userId), parseInt(limit));

    res.json({
      success: true,
      data: {
        growthRecords,
        total: growthRecords.length
      }
    });
  } catch (error) {
    console.error('获取成长值记录失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    const orders = PaymentCenterService.getUserOrders(parseInt(userId), parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('获取用户订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/levels', (req, res) => {
  try {
    const levels = UserCenterService.getAllLevelsWithPrivileges();
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('获取等级列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/discount/:userId/:businessLineId', (req, res) => {
  try {
    const { userId, businessLineId } = req.params;
    
    const discountInfo = UserCenterService.getBusinessLineDiscounts(
      parseInt(userId), 
      parseInt(businessLineId)
    );

    res.json({
      success: true,
      data: discountInfo
    });
  } catch (error) {
    console.error('获取等级优惠失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const { months = 3 } = req.query;
    const stats = UserCenterService.getOperationStats(parseInt(months));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取运营统计失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
