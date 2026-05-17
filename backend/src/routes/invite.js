const express = require('express');
const router = express.Router();
const { createInvite, acceptInvite, getMyInvites } = require('../controllers/inviteController');
const { authenticateToken, requireBabyInfo } = require('../middleware/auth');

router.post('/create', authenticateToken, requireBabyInfo, createInvite);
router.post('/accept', authenticateToken, acceptInvite);
router.get('/', authenticateToken, getMyInvites);

module.exports = router;
