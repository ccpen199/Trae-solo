const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const { logOperation } = require('../middlewares/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(isAdmin());

router.get('/statistics', adminController.getStatistics);

router.get('/users', adminController.getAllUsers);

router.put('/users/:id/role', [
  logOperation('更新用户角色', 'User')
], adminController.updateUserRole);

router.put('/users/:id/status', [
  logOperation('更新用户状态', 'User')
], adminController.updateUserStatus);

router.post('/moderators', [
  logOperation('分配版主', 'BoardModerator')
], adminController.assignModerator);

router.delete('/moderators', [
  logOperation('移除版主', 'BoardModerator')
], adminController.removeModerator);

router.get('/logs', adminController.getOperationLogs);

router.delete('/topics/:id', [
  logOperation('管理员删除主题', 'Topic')
], adminController.adminDeleteTopic);

router.delete('/replies/:id', [
  logOperation('管理员删除回复', 'Reply')
], adminController.adminDeleteReply);

module.exports = router;
