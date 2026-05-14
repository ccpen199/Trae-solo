const express = require('express');
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, commentController.create);
router.post('/:id/like', authMiddleware, commentController.like);

module.exports = router;
