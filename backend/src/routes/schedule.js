const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { authenticateToken, requireRider, requireApproved } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRider, requireApproved);

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    let whereCondition = {
      userId: req.user.id
    };
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereCondition.scheduleDate = {
        gte: targetDate,
        lt: nextDay
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereCondition.scheduleDate = {
        gte: today
      };
    }
    
    const schedules = await prisma.schedule.findMany({
      where: whereCondition,
      orderBy: {
        scheduleDate: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('获取排班错误:', error);
    res.status(500).json({ success: false, message: '获取排班失败' });
  }
});

router.post('/', [
  body('scheduleDate').isDate().withMessage('请输入有效的日期'),
  body('startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('请输入有效的开始时间'),
  body('endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('请输入有效的结束时间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { scheduleDate, startTime, endTime } = req.body;
    
    const targetDate = new Date(scheduleDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxScheduleDay = new Date(today);
    maxScheduleDay.setDate(maxScheduleDay.getDate() + 3);
    
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: '不能申请过去日期的排班'
      });
    }
    
    if (targetDate > maxScheduleDay) {
      return res.status(400).json({
        success: false,
        message: '只能申请后三天的排班'
      });
    }
    
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: '结束时间必须大于开始时间'
      });
    }
    
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        userId: req.user.id,
        scheduleDate: targetDate,
        startTime,
        endTime
      }
    });
    
    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: '该时间段已存在排班'
      });
    }
    
    const schedule = await prisma.schedule.create({
      data: {
        userId: req.user.id,
        scheduleDate: targetDate,
        startTime,
        endTime,
        status: 'confirmed'
      }
    });
    
    res.json({
      success: true,
      message: '排班申请成功',
      data: schedule
    });
  } catch (error) {
    console.error('创建排班错误:', error);
    res.status(500).json({ success: false, message: '创建排班失败' });
  }
});

router.delete('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: '排班不存在' });
    }
    
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权操作此排班' });
    }
    
    const scheduleDate = new Date(schedule.scheduleDate);
    const now = new Date();
    const hoursUntilSchedule = (scheduleDate - now) / (1000 * 60 * 60);
    
    let warning = null;
    if (hoursUntilSchedule < 24) {
      warning = '警告：距离排班开始不足24小时，取消可能触发惩罚机制';
    }
    
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });
    
    res.json({
      success: true,
      message: '排班已取消',
      warning
    });
  } catch (error) {
    console.error('取消排班错误:', error);
    res.status(500).json({ success: false, message: '取消排班失败' });
  }
});

module.exports = router;
