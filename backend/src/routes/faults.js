const express = require('express');
const router = express.Router();
const faultController = require('../controllers/faultController');

router.post('/diagnose', faultController.diagnose);
router.get('/', faultController.getAllFaults);
router.get('/:id', faultController.getFault);
router.post('/', faultController.createFault);
router.put('/:id', faultController.updateFault);

module.exports = router;
