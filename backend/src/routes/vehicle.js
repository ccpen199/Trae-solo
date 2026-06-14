const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, vehicleController.getList);
router.get('/:id', auth, vehicleController.getDetail);
router.post('/', auth, requireRole('collector', 'processor', 'admin'), vehicleController.create);
router.put('/:id', auth, vehicleController.update);
router.delete('/:id', auth, vehicleController.remove);

module.exports = router;
