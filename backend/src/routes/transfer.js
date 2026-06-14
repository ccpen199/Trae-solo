const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, transferController.getList);
router.get('/:id', auth, transferController.getDetail);
router.post('/', auth, transferController.create);
router.put('/:id', auth, transferController.update);
router.post('/:id/submit', auth, transferController.submit);
router.put('/:id/approve', auth, requireRole('admin'), transferController.approve);
router.put('/:id/reject', auth, requireRole('admin'), transferController.reject);
router.post('/:id/complete', auth, transferController.complete);

module.exports = router;
