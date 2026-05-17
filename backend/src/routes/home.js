const express = require('express');
const db = require('../db');
const dayjs = require('dayjs');

const router = express.Router();

router.get('/data', (req, res) => {
  try {
    const banners = [
      { id: 1, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', title: '夏日减脂季', link: '/promotion/summer' },
      { id: 2, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', title: '新人专享优惠', link: '/promotion/newbie' },
      { id: 3, image: 'https://images.unsplash.com/photo-1540497077202-7c8a39991a8e?w=800', title: '私教体验课', link: '/coaches' }
    ];

    const categories = [
      { id: 1, name: '团课预约', icon: '📅', link: '/group-classes' },
      { id: 2, name: '私教预约', icon: '🏋️', link: '/coaches' },
      { id: 3, name: '购买会员卡', icon: '💳', link: '/cards' },
      { id: 4, name: '我的预约', icon: '📋', link: '/my/bookings' },
      { id: 5, name: '门店查询', icon: '📍', link: '/stores' },
      { id: 6, name: '优惠券', icon: '🎫', link: '/my/coupons' },
      { id: 7, name: '运动数据', icon: '📊', link: '/my/stats' },
      { id: 8, name: '更多服务', icon: '⋯', link: '/services' }
    ];

    const hotClasses = db.prepare(`
      SELECT gc.*, gcs.start_time, gcs.coach_name, s.name as store_name
      FROM group_classes gc
      LEFT JOIN group_class_schedules gcs ON gc.id = gcs.class_id
      LEFT JOIN stores s ON gcs.store_id = s.id
      WHERE gc.status = 1 AND gcs.status = 1
      GROUP BY gc.id
      LIMIT 4
    `).all();

    const recommendCoaches = db.prepare(`
      SELECT * FROM coaches WHERE status = 1 ORDER BY rating DESC LIMIT 3
    `).all();

    res.json({
      success: true,
      data: {
        banners,
        categories,
        hotClasses,
        recommendCoaches
      }
    });
  } catch (error) {
    console.error('获取首页数据错误:', error);
    res.json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/stores', (req, res) => {
  try {
    const stores = db.prepare('SELECT * FROM stores WHERE status = 1').all();
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('获取门店列表错误:', error);
    res.json({
      success: false,
      message: '获取门店列表失败'
    });
  }
});

module.exports = router;
