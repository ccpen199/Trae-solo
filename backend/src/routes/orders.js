const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.post('/', (req, res) => {
  try {
    const { 
      order_type, 
      pickup_city, 
      pickup_address, 
      dropoff_address, 
      scheduled_time, 
      car_type_id, 
      passenger_name, 
      passenger_phone 
    } = req.body;

    if (!order_type || !pickup_city || !pickup_address || !dropoff_address) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要的订单信息' 
      });
    }

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_type, pickup_city, pickup_address, dropoff_address, scheduled_time, car_type_id, passenger_name, passenger_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertOrder.run(
      order_type, 
      pickup_city, 
      pickup_address, 
      dropoff_address, 
      scheduled_time || null, 
      car_type_id || null, 
      passenger_name || null, 
      passenger_phone || null
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ 
      success: true, 
      message: order_type === 'elderly' ? '呼叫成功！司机正在赶来，请稍等' : '订单创建成功',
      data: order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const orders = db.prepare(`
      SELECT o.*, ct.name as car_type_name
      FROM orders o
      LEFT JOIN car_types ct ON o.car_type_id = ct.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, ct.name as car_type_name
      FROM orders o
      LEFT JOIN car_types ct ON o.car_type_id = ct.id
      WHERE o.id = ?
    `).get(id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
