const express = require('express');
const router = express.Router();
const wasteController = require('../controllers/wasteController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', wasteController.getList);
router.get('/:id', wasteController.getDetail);
router.post('/', auth, requireRole('producer', 'collector', 'processor'), wasteController.create);
router.put('/:id', auth, wasteController.update);
router.delete('/:id', auth, wasteController.remove);
router.post('/:id/submit-review', auth, wasteController.submitReview);
router.post('/estimate-price', wasteController.estimatePrice);

module.exports = router;
