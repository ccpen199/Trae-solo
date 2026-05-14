const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('admin', 'moderator', 'editor'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', authMiddleware, roleMiddleware('admin'), adminController.getUsers);
router.put('/users/:id/role', authMiddleware, roleMiddleware('admin'), adminController.updateUserRole);
router.post('/users/:id/toggle-status', authMiddleware, roleMiddleware('admin'), adminController.toggleUserStatus);
router.get('/content', adminController.getContentList);
router.put('/content/:type/:id/status', adminController.updateContentStatus);
router.delete('/content/:type/:id', adminController.deleteContent);

module.exports = router;
