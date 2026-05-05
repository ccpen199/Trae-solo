const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.get('/favorites', authenticate, userController.getMyFavorites);

router.get('/browse-history', authenticate, userController.getBrowseHistory);

router.delete('/browse-history', authenticate, userController.clearBrowseHistory);

router.get('/coupons', authenticate, userController.getMyCoupons);

router.get('/notifications', authenticate, userController.getNotifications);

router.put('/notifications/:id/read', authenticate, userController.markNotificationRead);

router.put('/notifications/read-all', authenticate, userController.markAllNotificationsRead);

router.get('/reviews', authenticate, userController.getMyReviews);

router.post('/reviews', authenticate, userController.createReview);

module.exports = router;
