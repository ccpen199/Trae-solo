const express = require('express');
const topicController = require('../controllers/topicController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', topicController.getAllTopics);
router.post('/', authMiddleware, roleMiddleware('admin', 'editor'), topicController.createTopic);

module.exports = router;
