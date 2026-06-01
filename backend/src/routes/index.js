const express = require('express');
const router = express.Router();

const stationController = require('../controllers/stationController');
const orderController = require('../controllers/orderController');
const deviceController = require('../controllers/deviceController');
const reportController = require('../controllers/reportController');
const userController = require('../controllers/userController');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

router.get('/stations', stationController.getAllStations);
router.get('/stations/:id', stationController.getStationDetail);
router.get('/stations/:id/map', stationController.getStationMap);

router.get('/orders', orderController.getOrders);
router.get('/orders/combined', orderController.getCombinedOrders);
router.get('/orders/:id', orderController.getOrderDetail);
router.post('/orders/parking', orderController.createParkingOrder);
router.post('/orders/charging', orderController.createChargingOrder);
router.post('/orders/parking/:id/exit', orderController.exitParking);
router.post('/orders/charging/:id/stop', orderController.stopCharging);
router.post('/orders/pay', orderController.createCombinedPayment);

router.get('/devices', deviceController.getAllDevices);
router.get('/devices/stats', deviceController.getDeviceStats);
router.put('/devices/:id/status', deviceController.updateDeviceStatus);

router.get('/work-orders', deviceController.getWorkOrders);
router.put('/work-orders/:id', deviceController.updateWorkOrder);

router.get('/alerts', deviceController.getAlerts);
router.put('/alerts/:id/resolve', deviceController.resolveAlert);

router.get('/reports/dashboard', reportController.getDashboardStats);
router.get('/reports/parking-utilization', reportController.getParkingUtilization);
router.get('/reports/charging-utilization', reportController.getChargingUtilization);
router.get('/reports/revenue', reportController.getRevenueAnalysis);
router.get('/reports/peak-load', reportController.getPeakLoad);
router.get('/reports/overtime', reportController.getOvertimeAnalysis);

router.get('/pricing-rules', reportController.getPricingRules);
router.put('/pricing-rules/:id', reportController.updatePricingRule);

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);

router.get('/reservations', userController.getReservations);
router.post('/reservations', userController.createReservation);
router.put('/reservations/:id/cancel', userController.cancelReservation);

module.exports = router;
