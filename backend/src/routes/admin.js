const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/engineers/:id/radar', adminController.getEngineerRadar);
router.get('/engineers/performance', adminController.getEngineerPerformance);
router.get('/faults/heatmap', adminController.getFaultHeatmap);
router.get('/parts/forecast', adminController.getPartsForecast);
router.get('/orders/trend', adminController.getOrderTrend);
router.get('/parts', adminController.getParts);
router.post('/parts', adminController.createPart);
router.put('/parts/:id', adminController.updatePart);
router.get('/used-devices', adminController.getUsedDevices);
router.post('/used-devices', adminController.createUsedDevice);
router.put('/used-devices/:id', adminController.updateUsedDevice);
router.post('/callback/trigger', adminController.triggerCallback);
router.put('/engineers/:id/equipment', adminController.bindEquipment);

module.exports = router;
