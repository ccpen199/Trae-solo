const express = require('express');
const router = express.Router();

// 导入子路由
const authRoutes = require('./auth');
const equipmentRoutes = require('./equipment');
const maintenanceRoutes = require('./maintenance');
const repairRoutes = require('./repair');
const sparePartRoutes = require('./sparePart');
const statisticsRoutes = require('./statistics');
const logRoutes = require('./log');
const userRoutes = require('./user');

// 挂载子路由
router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/repair', repairRoutes);
router.use('/sparePart', sparePartRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/log', logRoutes);
router.use('/user', userRoutes);

module.exports = router;