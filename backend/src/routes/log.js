const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { auth, authorize } = require('../middleware/auth');

// 获取日志列表 - 只有设备管理员可以查看
router.get('/', auth, authorize(['admin']), logController.getLogs);

// 获取设备履历 - 只有设备管理员可以查看
router.get('/equipment/:equipmentId', auth, authorize(['admin']), logController.getEquipmentHistory);

// 获取保养记录 - 只有设备管理员可以查看
router.get('/maintenance', auth, authorize(['admin']), logController.getMaintenanceHistory);

// 获取维修记录 - 只有设备管理员可以查看
router.get('/repair', auth, authorize(['admin']), logController.getRepairHistory);

// 获取备件消耗记录 - 只有设备管理员可以查看
router.get('/sparePart', auth, authorize(['admin']), logController.getSparePartHistory);

module.exports = router;