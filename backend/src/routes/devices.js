const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const auth = require('../middleware/auth');

router.get('/', auth(), deviceController.getDevices);
router.get('/heatmap', auth('operator', 'property'), deviceController.getDeviceHeatmap);
router.get('/code/:code', auth(), deviceController.getDeviceByCode);
router.get('/:id/status', auth(), deviceController.getDeviceStatus);
router.get('/:id/sync-offline', auth('operator', 'property'), deviceController.syncOfflineCommands);
router.get('/:id', auth(), deviceController.getDeviceById);
router.post('/', auth('operator', 'admin'), deviceController.createDevice);
router.put('/:id/status', auth('operator', 'admin'), deviceController.updateDeviceStatus);
router.put('/:id', auth('operator', 'admin'), deviceController.updateDevice);

module.exports = router;
