const express = require('express');
const answerController = require('../controllers/answerController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, answerController.create);
router.post('/:id/like', authMiddleware, answerController.like);

module.exports = router;
