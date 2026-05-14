const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const shops = db.prepare('SELECT * FROM shops ORDER BY created_at DESC').all();

    res.json({ success: true, data: shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ success: false, message: '获取店铺失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(req.params.id);

    if (!shop) {
      return res.status(404).json({ success: false, message: '店铺不存在' });
    }

    const coupons = db.prepare(`
      SELECT * FROM coupon_types WHERE shop_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `).all(shop.id);

    res.json({ success: true, data: { ...shop, coupons } });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ success: false, message: '获取店铺失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { name, description, logo_url, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '店铺名称必填' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO shops (id, name, description, logo_url, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description, logo_url, address);

    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);

    res.json({ success: true, data: shop });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ success: false, message: '创建店铺失败' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  try {
    const { name, description, logo_url, address } = req.body;

    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(req.params.id);

    if (!shop) {
      return res.status(404).json({ success: false, message: '店铺不存在' });
    }

    db.prepare(`
      UPDATE shops SET name = ?, description = ?, logo_url = ?, address = ?
      WHERE id = ?
    `).run(name || shop.name, description ?? shop.description, logo_url ?? shop.logo_url, address ?? shop.address, req.params.id);

    const updatedShop = db.prepare('SELECT * FROM shops WHERE id = ?').get(req.params.id);

    res.json({ success: true, data: updatedShop });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ success: false, message: '更新店铺失败' });
  }
});

module.exports = router;
