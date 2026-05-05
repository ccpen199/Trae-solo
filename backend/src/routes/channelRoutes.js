const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, channelController.getChannels);
router.get('/aggregator', optionalAuth, channelController.getChannelAggregator);
router.get('/id/:id', optionalAuth, channelController.getChannelById);
router.get('/slug/:slug', optionalAuth, channelController.getChannelBySlug);
router.get('/:id/books', optionalAuth, channelController.getChannelBooks);

router.post('/', protect, channelController.createChannel);
router.put('/:id', protect, channelController.updateChannel);
router.delete('/:id', protect, channelController.deleteChannel);

router.post('/:id/follow', protect, channelController.followChannel);
router.delete('/:id/follow', protect, channelController.unfollowChannel);

module.exports = router;
