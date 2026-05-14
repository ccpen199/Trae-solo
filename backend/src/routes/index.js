const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const homeRoutes = require('./home');
const productRoutes = require('./product');
const cartRoutes = require('./cart');
const orderRoutes = require('./order');
const groupRoutes = require('./group');
const favoriteRoutes = require('./favorite');
const followRoutes = require('./follow');
const liveRoutes = require('./live');
const dynamicRoutes = require('./dynamic');
const userRoutes = require('./user');
const addressRoutes = require('./address');
const activityRoutes = require('./activity');
const messageRoutes = require('./message');
const adminRoutes = require('./admin');

router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/product', productRoutes);
router.use('/cart', cartRoutes);
router.use('/order', orderRoutes);
router.use('/group', groupRoutes);
router.use('/favorite', favoriteRoutes);
router.use('/follow', followRoutes);
router.use('/live', liveRoutes);
router.use('/dynamic', dynamicRoutes);
router.use('/user', userRoutes);
router.use('/address', addressRoutes);
router.use('/activity', activityRoutes);
router.use('/message', messageRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
