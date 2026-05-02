const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { auth, authorize } = require('../middleware/auth');

// 获取保养计划列表 - 所有角色都可以查看
router.get('/', auth, maintenanceController.getMaintenancePlans);

// 获取单个保养计划 - 所有角色都可以查看
router.get('/:id', auth, maintenanceController.getMaintenancePlan);

// 分配保养计划 - 只有设备管理员可以操作
router.put('/:id/assign', auth, authorize(['admin']), maintenanceController.assignMaintenancePlan);

// 完成保养计划 - 只有维修工可以操作
router.put('/:id/complete', auth, authorize(['technician']), maintenanceController.completeMaintenancePlan);

// 取消保养计划 - 只有设备管理员可以操作
router.put('/:id/cancel', auth, authorize(['admin']), maintenanceController.cancelMaintenancePlan);

module.exports = router;