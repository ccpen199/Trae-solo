const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { checkIPBlacklist } = require('../middlewares/ipBlacklist');

const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');

router.post('/auth/login', checkIPBlacklist, authController.validateLogin, authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/userinfo', authMiddleware, authController.getUserInfo);

router.get('/users', authMiddleware, userController.getList);
router.get('/users/:id', authMiddleware, userController.getById);
router.post('/users', authMiddleware, userController.validateCreateUser, userController.create);
router.put('/users/:id', authMiddleware, userController.validateUpdateUser, userController.update);
router.delete('/users/:id', authMiddleware, userController.remove);
router.post('/users/batch-delete', authMiddleware, userController.batchDelete);
router.post('/users/:id/reset-password', authMiddleware, userController.resetPassword);

router.get('/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { status: 'healthy' } });
});

module.exports = router;
