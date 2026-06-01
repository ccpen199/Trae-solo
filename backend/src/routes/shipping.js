const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { calculatePrice } = require('../utils/pricing');
const { calculateBlockHash } = require('../utils/hash');

const router = express.Router();

const couriers = [
  { id: 1, name: '张师傅', phone: '13800138001', rating: 4.9, delivery_rate: 98.5, current_location: '朝阳区', status: 'online', total_orders: 1250 },
  { id: 2, name: '李师傅', phone: '13800138002', rating: 4.8, delivery_rate: 97.2, current_location: '海淀区', status: 'online', total_orders: 980 },
  { id: 3, name: '王师傅', phone: '13800138003', rating: 4.7, delivery_rate: 96.8, current_location: '西城区', status: 'busy', total_orders: 1100 },
  { id: 4, name: '刘师傅', phone: '13800138004', rating: 4.9, delivery_rate: 99.1, current_location: '东城区', status: 'online', total_orders: 1560 },
  { id: 5, name: '陈师傅', phone: '13800138005', rating: 4.6, delivery_rate: 95.5, current_location: '丰台区', status: 'offline', total_orders: 870 }
];

router.post('/calculate-price', (req, res) => {
  try {
    const { weight, volume, item_type, insured_value, timeline, courier } = req.body;

    if (!weight || weight <= 0) {
      return res.status(400).json({ error: '请输入有效的重量' });
    }

    const priceResult = calculatePrice({
      weight: parseFloat(weight),
      volume: volume ? parseFloat(volume) : 0,
      itemType: item_type,
      insuredValue: insured_value ? parseFloat(insured_value) : 0,
      timeline: timeline || 'standard',
      courier
    });

    res.json({
      success: true,
      data: priceResult
    });
  } catch (err) {
    console.error('计算价格错误:', err);
    res.status(500).json({ error: '计算价格失败' });
  }
});

router.post('/create-order', authenticateToken, (req, res) => {
  try {
    const {
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      weight, volume, item_type, insured_value, timeline, courier
    } = req.body;

    if (!sender_name || !sender_phone || !sender_address ||
        !receiver_name || !receiver_phone || !receiver_address || !weight) {
      return res.status(400).json({ error: '请填写完整的寄件信息' });
    }

    const priceResult = calculatePrice({
      weight: parseFloat(weight),
      volume: volume ? parseFloat(volume) : 0,
      itemType: item_type,
      insuredValue: insured_value ? parseFloat(insured_value) : 0,
      timeline: timeline || 'standard',
      courier
    });

    const trackingNumber = `${courier ? courier.substring(0, 2).toUpperCase() : 'SF'}${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = db.prepare(`
      INSERT INTO shipping_orders (
        user_id, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address,
        weight, volume, item_type, insured_value, timeline,
        price, courier, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      parseFloat(weight), volume ? parseFloat(volume) : 0, item_type,
      insured_value ? parseFloat(insured_value) : 0, timeline || 'standard',
      priceResult.total_price, priceResult.courier, 'created'
    );

    const orderId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO parcels (
        tracking_number, courier, sender, receiver, receiver_phone,
        status, weight, volume, estimated_delivery, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trackingNumber, priceResult.courier, sender_name, receiver_name, receiver_phone,
      'pending', parseFloat(weight), volume ? parseFloat(volume) : 0,
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      req.user.id
    );

    const order = db.prepare('SELECT * FROM shipping_orders WHERE id = ?').get(orderId);

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        order,
        tracking_number: trackingNumber,
        price_breakdown: priceResult
      }
    });
  } catch (err) {
    console.error('创建订单错误:', err);
    res.status(500).json({ error: '创建订单失败' });
  }
});

router.post('/schedule-pickup', authenticateToken, (req, res) => {
  try {
    const { order_id, scheduled_time, courier_id } = req.body;

    if (!order_id || !scheduled_time) {
      return res.status(400).json({ error: '订单ID和预约时间不能为空' });
    }

    const order = db.prepare('SELECT * FROM shipping_orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'created') {
      return res.status(400).json({ error: '订单状态不支持预约' });
    }

    const courier = couriers.find(c => c.id === parseInt(courier_id)) || couriers[0];

    db.prepare(`
      UPDATE shipping_orders 
      SET scheduled_pickup = ?, courier = ?, status = ?
      WHERE id = ?
    `).run(scheduled_time, courier.name, 'paid', order_id);

    const updatedOrder = db.prepare('SELECT * FROM shipping_orders WHERE id = ?').get(order_id);

    res.json({
      success: true,
      message: '预约成功',
      data: {
        order: updatedOrder,
        courier: {
          name: courier.name,
          phone: courier.phone,
          rating: courier.rating
        },
        scheduled_time
      }
    });
  } catch (err) {
    console.error('预约揽收错误:', err);
    res.status(500).json({ error: '预约失败' });
  }
});

router.post('/large-item', authenticateToken, (req, res) => {
  try {
    const {
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      weight, volume, item_type, insured_value,
      special_handling, disassemble_service, carry_floor
    } = req.body;

    if (!sender_name || !sender_phone || !sender_address ||
        !receiver_name || !receiver_phone || !receiver_address ||
        !weight || !volume) {
      return res.status(400).json({ error: '请填写完整的大件信息' });
    }

    const basePrice = calculatePrice({
      weight: parseFloat(weight),
      volume: parseFloat(volume),
      itemType: item_type || 'large',
      insuredValue: insured_value ? parseFloat(insured_value) : 0,
      timeline: 'standard'
    });

    let largeItemFee = 0;
    if (special_handling) largeItemFee += 50;
    if (disassemble_service) largeItemFee += 100;
    if (carry_floor) largeItemFee += carry_floor * 10;

    const totalPrice = Math.round((basePrice.total_price + largeItemFee) * 100) / 100;
    const trackingNumber = `DB${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = db.prepare(`
      INSERT INTO shipping_orders (
        user_id, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address,
        weight, volume, item_type, insured_value, timeline,
        price, courier, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      parseFloat(weight), parseFloat(volume), item_type || 'large',
      insured_value ? parseFloat(insured_value) : 0, 'standard',
      totalPrice, '德邦快递', 'created'
    );

    const orderId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO parcels (
        tracking_number, courier, sender, receiver, receiver_phone,
        status, weight, volume, estimated_delivery, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trackingNumber, '德邦快递', sender_name, receiver_name, receiver_phone,
      'pending', parseFloat(weight), parseFloat(volume),
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      req.user.id
    );

    const order = db.prepare('SELECT * FROM shipping_orders WHERE id = ?').get(orderId);

    res.status(201).json({
      success: true,
      message: '大件订单创建成功',
      data: {
        order,
        tracking_number: trackingNumber,
        price_breakdown: {
          ...basePrice,
          large_item_fee: largeItemFee,
          special_handling_fee: special_handling ? 50 : 0,
          disassemble_fee: disassemble_service ? 100 : 0,
          carry_fee: carry_floor ? carry_floor * 10 : 0,
          total_price: totalPrice
        }
      }
    });
  } catch (err) {
    console.error('大件寄送错误:', err);
    res.status(500).json({ error: '大件寄送下单失败' });
  }
});

router.get('/couriers', (req, res) => {
  try {
    const { status, location } = req.query;

    let filteredCouriers = [...couriers];

    if (status) {
      filteredCouriers = filteredCouriers.filter(c => c.status === status);
    }

    if (location) {
      filteredCouriers = filteredCouriers.filter(c => c.current_location.includes(location));
    }

    res.json({
      success: true,
      count: filteredCouriers.length,
      data: filteredCouriers
    });
  } catch (err) {
    console.error('获取快递员列表错误:', err);
    res.status(500).json({ error: '获取快递员列表失败' });
  }
});

router.get('/orders', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM shipping_orders WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const orders = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM shipping_orders WHERE user_id = ?';
    const countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取订单列表错误:', err);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

module.exports = router;
