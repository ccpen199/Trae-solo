const express = require('express');
const { db } = require('../database');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const statusMap = {
  pending: '待发货',
  shipped: '已发货',
  transit: '运输中',
  delivered: '已签收'
};

router.get('/list', authMiddleware, (req, res) => {
  try {
    const logistics = db.prepare(`
      SELECT * FROM logistics 
      WHERE user_id = ? AND status != 'delivered'
      ORDER BY updated_at DESC
    `).all(req.user.id);

    const withTracking = logistics.map(item => {
      const tracking = db.prepare(`
        SELECT * FROM logistics_tracking 
        WHERE logistics_id = ? 
        ORDER BY tracking_time DESC
      `).all(item.id);

      return {
        ...item,
        status_text: statusMap[item.status] || item.status,
        tracking
      };
    });

    return res.json(success(withTracking));
  } catch (err) {
    console.error('获取物流列表失败:', err);
    return res.status(500).json(error('获取物流信息失败'));
  }
});

router.get('/all', authMiddleware, (req, res) => {
  try {
    const { type = 'incomplete' } = req.query;
    let query = 'SELECT * FROM logistics WHERE user_id = ?';
    const params = [req.user.id];

    if (type === 'incomplete') {
      query += " AND status != 'delivered'";
    } else if (type === 'completed') {
      query += " AND status = 'delivered'";
    }

    query += ' ORDER BY updated_at DESC';

    const logistics = db.prepare(query).all(...params);

    const withTracking = logistics.map(item => {
      const tracking = db.prepare(`
        SELECT * FROM logistics_tracking 
        WHERE logistics_id = ? 
        ORDER BY tracking_time DESC
      `).all(item.id);

      return {
        ...item,
        status_text: statusMap[item.status] || item.status,
        tracking
      };
    });

    return res.json(success(withTracking));
  } catch (err) {
    console.error('获取物流列表失败:', err);
    return res.status(500).json(error('获取物流信息失败'));
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const logistics = db.prepare(`
      SELECT * FROM logistics WHERE id = ? AND user_id = ?
    `).get(id, req.user.id);

    if (!logistics) {
      return res.status(404).json(error('物流信息不存在'));
    }

    const tracking = db.prepare(`
      SELECT * FROM logistics_tracking 
      WHERE logistics_id = ? 
      ORDER BY tracking_time DESC
    `).all(id);

    return res.json(success({
      ...logistics,
      status_text: statusMap[logistics.status] || logistics.status,
      tracking
    }));
  } catch (err) {
    console.error('获取物流详情失败:', err);
    return res.status(500).json(error('获取物流详情失败'));
  }
});

router.post('/create', authMiddleware, (req, res) => {
  try {
    const { order_no, product_name, courier_company, tracking_no, status, receiver_name, receiver_phone, receiver_address } = req.body;

    if (!order_no || !product_name) {
      return res.status(400).json(error('订单号和商品名称不能为空'));
    }

    const insertStmt = db.prepare(`
      INSERT INTO logistics (
        user_id, order_no, product_name, courier_company, tracking_no, 
        status, receiver_name, receiver_phone, receiver_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      req.user.id,
      order_no,
      product_name,
      courier_company || null,
      tracking_no || null,
      status || 'pending',
      receiver_name || null,
      receiver_phone || null,
      receiver_address || null
    );

    const logistics = db.prepare('SELECT * FROM logistics WHERE id = ?').get(result.lastInsertRowid);

    return res.json(success(logistics, '物流信息添加成功'));
  } catch (err) {
    console.error('添加物流失败:', err);
    return res.status(500).json(error('添加物流失败'));
  }
});

router.put('/update/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, courier_company, tracking_no, status, current_location, receiver_name, receiver_phone, receiver_address } = req.body;

    const logistics = db.prepare('SELECT * FROM logistics WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!logistics) {
      return res.status(404).json(error('物流信息不存在'));
    }

    db.prepare(`
      UPDATE logistics SET 
        product_name = COALESCE(?, product_name),
        courier_company = COALESCE(?, courier_company),
        tracking_no = COALESCE(?, tracking_no),
        status = COALESCE(?, status),
        current_location = COALESCE(?, current_location),
        receiver_name = COALESCE(?, receiver_name),
        receiver_phone = COALESCE(?, receiver_phone),
        receiver_address = COALESCE(?, receiver_address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      product_name || null,
      courier_company || null,
      tracking_no || null,
      status || null,
      current_location || null,
      receiver_name || null,
      receiver_phone || null,
      receiver_address || null,
      id,
      req.user.id
    );

    if (current_location) {
      db.prepare(`
        INSERT INTO logistics_tracking (logistics_id, location, description)
        VALUES (?, ?, ?)
      `).run(id, current_location, `物流更新：${current_location}`);
    }

    const updatedLogistics = db.prepare('SELECT * FROM logistics WHERE id = ?').get(id);

    return res.json(success(updatedLogistics, '物流信息已更新'));
  } catch (err) {
    console.error('更新物流失败:', err);
    return res.status(500).json(error('更新物流失败'));
  }
});

router.post('/:id/tracking', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { location, description } = req.body;

    const logistics = db.prepare('SELECT * FROM logistics WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!logistics) {
      return res.status(404).json(error('物流信息不存在'));
    }

    if (!description) {
      return res.status(400).json(error('物流轨迹描述不能为空'));
    }

    const result = db.prepare(`
      INSERT INTO logistics_tracking (logistics_id, location, description)
      VALUES (?, ?, ?)
    `).run(id, location || null, description);

    const tracking = db.prepare('SELECT * FROM logistics_tracking WHERE id = ?').get(result.lastInsertRowid);

    return res.json(success(tracking, '轨迹添加成功'));
  } catch (err) {
    console.error('添加物流轨迹失败:', err);
    return res.status(500).json(error('添加轨迹失败'));
  }
});

module.exports = router;
