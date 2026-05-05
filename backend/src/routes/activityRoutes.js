const express = require('express');
const activityController = require('../controllers/activityController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取当前进行中的活动（前台用）
router.get('/active/:type', optionalAuthMiddleware, activityController.getActiveActivity);

// 获取最近中奖公告
router.get('/winners/:type', activityController.getRecentWinners);

// 以下为后台管理接口（暂时无权限控制，实际项目中需要添加）
// 获取活动列表
router.get('/', activityController.getActivityList);

// 获取活动详情
router.get('/:id', activityController.getActivity);

// 创建活动
router.post('/', activityController.createActivity);

// 更新活动
router.put('/:id', activityController.updateActivity);

// 删除活动
router.delete('/:id', activityController.deleteActivity);

module.exports = router;
