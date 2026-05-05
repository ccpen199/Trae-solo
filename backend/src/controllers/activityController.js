const prisma = require('../config/database');
const { success, error, pagination } = require('../utils/response');
const activityService = require('../services/activityService');

// 创建活动（后台）
const createActivity = async (req, res, next) => {
  try {
    const activity = await activityService.createActivity(req.body);
    res.json(success(activity, '活动创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新活动（后台）
const updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const activity = await activityService.updateActivity(id, req.body);
    res.json(success(activity, '活动更新成功'));
  } catch (err) {
    next(err);
  }
};

// 获取活动详情
const getActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const activity = await activityService.getActivityById(id);
    
    if (!activity) {
      return res.status(404).json(error('活动不存在', 404));
    }
    
    res.json(success(activity));
  } catch (err) {
    next(err);
  }
};

// 获取当前进行中的活动
const getActiveActivity = async (req, res, next) => {
  try {
    const { type } = req.params;
    const activityType = type.toUpperCase() === 'WHEEL' ? 'WHEEL' : 'EGG';
    
    const activity = await activityService.getActiveActivity(activityType);
    
    if (!activity) {
      return res.status(404).json(error('暂无进行中的活动', 404));
    }
    
    // 获取最近中奖公告
    const recentWinners = await activityService.getRecentWinners(activityType, 20);
    
    res.json(success({
      activity,
      recentWinners,
    }));
  } catch (err) {
    next(err);
  }
};

// 获取活动列表（后台）
const getActivityList = async (req, res, next) => {
  try {
    const { type, page = 1, pageSize = 10 } = req.query;
    const activityType = type ? (type.toUpperCase() === 'WHEEL' ? 'WHEEL' : 'EGG') : undefined;
    
    const result = await activityService.getActivityList(activityType, parseInt(page), parseInt(pageSize));
    
    res.json(success(pagination(
      result.list,
      result.total,
      result.page,
      result.pageSize
    )));
  } catch (err) {
    next(err);
  }
};

// 删除活动（后台）
const deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    await activityService.deleteActivity(id);
    res.json(success(null, '活动删除成功'));
  } catch (err) {
    next(err);
  }
};

// 获取最近中奖公告
const getRecentWinners = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    const activityType = type.toUpperCase() === 'WHEEL' ? 'WHEEL' : 'EGG';
    
    const winners = await activityService.getRecentWinners(activityType, parseInt(limit));
    
    res.json(success(winners));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createActivity,
  updateActivity,
  getActivity,
  getActiveActivity,
  getActivityList,
  deleteActivity,
  getRecentWinners,
};
