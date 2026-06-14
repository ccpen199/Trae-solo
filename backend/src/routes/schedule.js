const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, scheduleController.getList);
router.get('/:id', auth, scheduleController.getDetail);
router.post('/', auth, requireRole('collector', 'processor', 'admin'), scheduleController.create);
router.put('/:id', auth, scheduleController.update);
router.post('/:id/start', auth, scheduleController.start);
router.post('/:id/complete', auth, scheduleController.complete);
router.post('/optimize', auth, scheduleController.optimize);

module.exports = router;
