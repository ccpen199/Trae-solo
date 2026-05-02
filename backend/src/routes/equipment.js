const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { auth, authorize } = require('../middleware/auth');

// 设备建档 - 只有设备管理员可以操作
router.post('/', auth, authorize(['admin']), equipmentController.createEquipment);

// 获取设备列表 - 所有角色都可以查看
router.get('/', auth, equipmentController.getEquipments);

// 获取单个设备信息 - 所有角色都可以查看
router.get('/:id', auth, equipmentController.getEquipment);

// 更新设备信息 - 只有设备管理员可以操作
router.put('/:id', auth, authorize(['admin']), equipmentController.updateEquipment);

// 删除设备 - 只有设备管理员可以操作
router.delete('/:id', auth, authorize(['admin']), equipmentController.deleteEquipment);

// 设备报废 - 只有设备管理员可以操作
router.put('/:id/scrap', auth, authorize(['admin']), equipmentController.scrapEquipment);

module.exports = router;