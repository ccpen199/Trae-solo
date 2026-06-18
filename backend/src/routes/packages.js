const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const auth = require('../middleware/auth');

router.get('/', auth(), packageController.getPackages);
router.get('/:id', auth(), packageController.getPackageById);
router.post('/', auth('operator', 'admin'), packageController.createPackage);
router.put('/:id/status', auth('operator', 'admin'), packageController.updatePackageStatus);
router.put('/:id', auth('operator', 'admin'), packageController.updatePackage);

module.exports = router;
