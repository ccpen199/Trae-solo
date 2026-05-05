const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticateToken, isManager } = require('../middleware/auth');

router.post('/register', deviceController.deviceRegister);
router.post('/heartbeat', deviceController.deviceHeartbeat);
router.get('/status/:deviceId', deviceController.getDeviceStatus);

router.use(authenticateToken);

router.get('/', isManager, deviceController.getDevices);
router.get('/:id', isManager, deviceController.getDeviceById);
router.post('/', isManager, deviceController.createDevice);
router.put('/:id', isManager, deviceController.updateDevice);
router.delete('/:id', isManager, deviceController.deleteDevice);

module.exports = router;
