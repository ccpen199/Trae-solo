const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const houseRoutes = require('./houseRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const messageRoutes = require('./messageRoutes');
const demandRoutes = require('./demandRoutes');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '蚂蚁短租 API 服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth', authRoutes);
router.use('/houses', houseRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/demands', demandRoutes);

module.exports = router;
