const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/DeviceController');
const { authMiddleware } = require('../middleware/auth');

router.post('/groups', authMiddleware(), (req, res) => DeviceController.createGroup(req, res));
router.put('/groups/:id', authMiddleware(), (req, res) => DeviceController.updateGroup(req, res));
router.delete('/groups/:id', authMiddleware(), (req, res) => DeviceController.deleteGroup(req, res));
router.get('/groups', authMiddleware(), (req, res) => DeviceController.listGroups(req, res));

router.post('/', authMiddleware(['owner']), (req, res) => DeviceController.createDevice(req, res));
router.get('/', authMiddleware(), (req, res) => DeviceController.listDevices(req, res));
router.get('/:id', authMiddleware(), (req, res) => DeviceController.getDevice(req, res));
router.put('/:id', authMiddleware(), (req, res) => DeviceController.updateDevice(req, res));
router.delete('/:id', authMiddleware(['owner']), (req, res) => DeviceController.deleteDevice(req, res));

router.post('/:id/ptz', authMiddleware(), (req, res) => DeviceController.controlPTZ(req, res));

router.post('/:id/share', authMiddleware(['owner']), (req, res) => DeviceController.shareDevice(req, res));
router.get('/shares/outgoing', authMiddleware(['owner']), (req, res) => DeviceController.listShares(req, res));
router.get('/shares/incoming', authMiddleware(), (req, res) => DeviceController.listReceivedShares(req, res));
router.put('/shares/:id/revoke', authMiddleware(['owner']), (req, res) => DeviceController.revokeShare(req, res));

router.post('/heartbeat', (req, res) => DeviceController.deviceHeartbeat(req, res));
router.get('/monitor/offline', authMiddleware(), (req, res) => DeviceController.checkOfflineDevices(req, res));

module.exports = router;
