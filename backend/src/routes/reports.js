const express = require('express');
const { authenticate } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.post('/', authenticate, reportController.createReport);
router.get('/my', authenticate, reportController.getMyReports);

module.exports = router;
