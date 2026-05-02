const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const { auth, authorize } = require('../middleware/auth');

// 创建维修工单 - 只有使用人可以操作
router.post('/', auth, authorize(['user']), repairController.createRepairOrder);

// 获取维修工单列表 - 所有角色都可以查看
router.get('/', auth, repairController.getRepairOrders);

// 获取单个维修工单 - 所有角色都可以查看
router.get('/:id', auth, repairController.getRepairOrder);

// 分配维修工单 - 只有设备管理员可以操作
router.put('/:id/assign', auth, authorize(['admin']), repairController.assignRepairOrder);

// 开始维修 - 只有维修工可以操作
router.put('/:id/start', auth, authorize(['technician']), repairController.startRepair);

// 完成维修 - 只有维修工可以操作
router.put('/:id/complete', auth, authorize(['technician']), repairController.completeRepair);

// 验收维修 - 只有使用人可以操作
router.put('/:id/accept', auth, authorize(['user']), repairController.acceptRepair);

module.exports = router;