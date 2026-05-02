const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparePartController');
const { auth, authorize } = require('../middleware/auth');

// 创建备件 - 只有备件管理员可以操作
router.post('/', auth, authorize(['sparePartManager']), sparePartController.createSparePart);

// 获取备件列表 - 所有角色都可以查看
router.get('/', auth, sparePartController.getSpareParts);

// 获取单个备件信息 - 所有角色都可以查看
router.get('/:id', auth, sparePartController.getSparePart);

// 更新备件信息 - 只有备件管理员可以操作
router.put('/:id', auth, authorize(['sparePartManager']), sparePartController.updateSparePart);

// 删除备件 - 只有备件管理员可以操作
router.delete('/:id', auth, authorize(['sparePartManager']), sparePartController.deleteSparePart);

// 盘点备件 - 只有备件管理员可以操作
router.put('/:id/inventory', auth, authorize(['sparePartManager']), sparePartController.inventorySparePart);

module.exports = router;