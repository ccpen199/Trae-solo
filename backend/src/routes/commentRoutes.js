const express = require('express');
const { getComments, createComment } = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getComments);
router.post('/', authenticateToken, createComment);

module.exports = router;
