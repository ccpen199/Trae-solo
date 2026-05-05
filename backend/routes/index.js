const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const carController = require('../controllers/carController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString()
    }
  });
});

// 认证相关
router.post('/auth/sms-code', authController.sendSmsCode);
router.post('/auth/login', authController.loginWithCode);
router.get('/auth/me', authenticate, authController.getCurrentUser);
router.put('/auth/me', authenticate, authController.updateUser);

// 车型相关
router.get('/car/brands', carController.getBrands);
router.get('/car/series/:brandId', carController.getSeriesByBrand);
router.get('/car/specs/:seriesId', carController.getSpecsBySeries);
router.get('/car/models/:specId', carController.getModelsBySpec);
router.get('/car/model/:modelId', carController.getModelDetail);

// 用户车辆相关
router.get('/user-cars', authenticate, carController.getUserCars);
router.post('/user-cars', authenticate, carController.addUserCar);
router.put('/user-cars/:carId', authenticate, carController.updateUserCar);
router.delete('/user-cars/:carId', authenticate, carController.deleteUserCar);

module.exports = router;
