const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { auth, authorize } = require('../middleware/auth');

// 综合统计 - 只有设备管理员可以查看
router.get('/', auth, authorize(['admin']), statisticsController.getStatistics);

// 设备故障率统计 - 只有设备管理员可以查看
router.get('/failure-rate', auth, authorize(['admin']), statisticsController.getEquipmentFailureRate);

// MTBF 统计 - 只有设备管理员可以查看
router.get('/mtbf', auth, authorize(['admin']), statisticsController.getMTBF);

// MTTR 统计 - 只有设备管理员可以查看
router.get('/mttr', auth, authorize(['admin']), statisticsController.getMTTR);

// 维保成本统计 - 只有设备管理员可以查看
router.get('/maintenance-cost', auth, authorize(['admin']), statisticsController.getMaintenanceCost);

// 设备健康度评分 - 只有设备管理员可以查看
router.get('/health-score', auth, authorize(['admin']), statisticsController.getEquipmentHealthScore);

module.exports = router;