const express = require('express');
const router = express.Router();
const { saveBabyInfo, getBabyInfo } = require('../controllers/babyController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, saveBabyInfo);
router.get('/', authenticateToken, getBabyInfo);

module.exports = router;
