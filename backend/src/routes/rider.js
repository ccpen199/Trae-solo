const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { authenticateToken, requireRider, requireApproved } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRider, requireApproved);

const checkRiderEligibility = (user) => {
  const issues = [];
  
  if (!user.rider.hasInsurance) {
    issues.push({ type: 'insurance', message: '未购买骑手保险' });
  }
  
  if (!user.rider.hasDeposit) {
    issues.push({ type: 'deposit', message: '未缴纳保证金' });
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  if (user.riderSettings) {
    const startTime = user.riderSettings.workStartTime;
    const endTime = user.riderSettings.workEndTime;
    if (currentTime < startTime || currentTime > endTime) {
      issues.push({ type: 'schedule', message: `当前不在工作时间内（工作时间: ${startTime}-${endTime}）` });
    }
  }
  
  return {
    eligible: issues.length === 0,
    issues
  };
};

router.get('/status', async (req, res) => {
  try {
    const eligibility = checkRiderEligibility(req.user);
    
    res.json({
      success: true,
      data: {
        isOnline: req.user.rider.isOnline,
        currentOrders: req.user.rider.currentOrders,
        maxOrders: req.user.rider.maxOrders,
        eligibility
      }
    });
  } catch (error) {
    console.error('获取骑手状态错误:', error);
    res.status(500).json({ success: false, message: '获取状态失败' });
  }
});

router.post('/go-online', async (req, res) => {
  try {
    const eligibility = checkRiderEligibility(req.user);
    
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: '上线前请处理以下问题',
        issues: eligibility.issues
      });
    }
    
    const rider = await prisma.rider.update({
      where: { userId: req.user.id },
      data: { isOnline: true }
    });
    
    res.json({
      success: true,
      message: '已上线',
      data: { isOnline: rider.isOnline }
    });
  } catch (error) {
    console.error('上线错误:', error);
    res.status(500).json({ success: false, message: '上线失败' });
  }
});

router.post('/go-offline', async (req, res) => {
  try {
    if (req.user.rider.currentOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `您还有 ${req.user.rider.currentOrders} 个订单正在配送中，请完成后再下线`
      });
    }
    
    const rider = await prisma.rider.update({
      where: { userId: req.user.id },
      data: { isOnline: false }
    });
    
    res.json({
      success: true,
      message: '已下线',
      data: { isOnline: rider.isOnline }
    });
  } catch (error) {
    console.error('下线错误:', error);
    res.status(500).json({ success: false, message: '下线失败' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = req.user.riderSettings || {
      autoAccept: false,
      maxSimultaneous: 3,
      workStartTime: '08:00',
      workEndTime: '22:00'
    };
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取设置错误:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

router.put('/settings', [
  body('maxSimultaneous').isInt({ min: 1, max: 10 }).withMessage('同时接单量必须在1-10之间'),
  body('workStartTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('请输入有效的开始时间'),
  body('workEndTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('请输入有效的结束时间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { autoAccept, maxSimultaneous, workStartTime, workEndTime } = req.body;
    
    const settings = await prisma.riderSetting.upsert({
      where: { userId: req.user.id },
      update: {
        autoAccept: !!autoAccept,
        maxSimultaneous,
        workStartTime,
        workEndTime
      },
      create: {
        userId: req.user.id,
        autoAccept: !!autoAccept,
        maxSimultaneous,
        workStartTime,
        workEndTime
      }
    });
    
    await prisma.rider.update({
      where: { userId: req.user.id },
      data: { maxOrders: maxSimultaneous }
    });
    
    res.json({
      success: true,
      message: '设置已更新',
      data: settings
    });
  } catch (error) {
    console.error('更新设置错误:', error);
    res.status(500).json({ success: false, message: '更新设置失败' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const { password, ...userData } = req.user;
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('获取骑手资料错误:', error);
    res.status(500).json({ success: false, message: '获取资料失败' });
  }
});

// 注意：骑手资质（保险、保证金）由平台管理员审核后设置
// 骑手无法自行修改，需联系平台处理
// router.post('/update-qualification', async (req, res) => {
//   res.status(403).json({ 
//     success: false, 
//     message: '资质信息需由平台管理员审核设置，请联系平台处理' 
//   });
// });

module.exports = router;
