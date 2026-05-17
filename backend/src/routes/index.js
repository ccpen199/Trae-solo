const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');
const liveController = require('../controllers/liveController');
const momentController = require('../controllers/momentController');

router.post('/login', userController.login);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.post('/checkin', authenticateToken, userController.checkIn);
router.post('/follow', authenticateToken, userController.followUser);
router.post('/unfollow', authenticateToken, userController.unfollowUser);

router.get('/live', liveController.getLiveList);
router.get('/live/:id', liveController.getLiveRoom);
router.post('/live', authenticateToken, liveController.createLiveRoom);
router.delete('/live/:id', authenticateToken, liveController.closeLiveRoom);
router.post('/live/comment', authenticateToken, liveController.sendComment);
router.post('/live/gift', authenticateToken, liveController.sendGift);

router.get('/moments', momentController.getMoments);
router.post('/moments', authenticateToken, momentController.createMoment);
router.post('/moments/like', authenticateToken, momentController.likeMoment);
router.post('/moments/unlike', authenticateToken, momentController.unlikeMoment);
router.post('/moments/comment', authenticateToken, momentController.addComment);
router.get('/moments/:moment_id/comments', momentController.getMomentComments);

module.exports = router;
