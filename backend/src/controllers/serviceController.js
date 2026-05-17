const { getDB } = require('../models/db');

async function getServices(req, res) {
  try {
    const db = getDB();
    const services = db.prepare('SELECT * FROM services WHERE status = ? ORDER BY created_at DESC').all('active');

    res.json({ success: true, services });
  } catch (error) {
    console.error('获取服务列表失败:', error);
    res.status(500).json({ success: false, message: '获取服务列表失败' });
  }
}

async function createServiceOrder(req, res) {
  try {
    const { serviceId } = req.body;

    const db = getDB();
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

    if (!service) {
      return res.status(404).json({ success: false, message: '服务不存在' });
    }

    const result = db.prepare(`
      INSERT INTO service_orders (user_id, service_id, status, amount)
      VALUES (?, ?, 'pending', ?)
    `).run(req.user.id, serviceId, service.price || 0);

    res.json({ success: true, message: '服务订单创建成功', orderId: result.lastInsertRowid });
  } catch (error) {
    console.error('创建服务订单失败:', error);
    res.status(500).json({ success: false, message: '创建服务订单失败' });
  }
}

async function getMyServiceOrders(req, res) {
  try {
    const db = getDB();
    const orders = db.prepare(`
      SELECT so.*, s.title, s.description, s.type
      FROM service_orders so
      JOIN services s ON so.service_id = s.id
      WHERE so.user_id = ?
      ORDER BY so.created_at DESC
    `).all(req.user.id);

    res.json({ success: true, orders });
  } catch (error) {
    console.error('获取服务订单失败:', error);
    res.status(500).json({ success: false, message: '获取服务订单失败' });
  }
}

async function createConsultation(req, res) {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: '请输入咨询标题' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO consultations (user_id, title, content, status)
      VALUES (?, ?, ?, 'pending')
    `).run(req.user.id, title, content || '');

    res.json({ success: true, message: '咨询提交成功', consultationId: result.lastInsertRowid });
  } catch (error) {
    console.error('提交咨询失败:', error);
    res.status(500).json({ success: false, message: '提交咨询失败' });
  }
}

async function getMyConsultations(req, res) {
  try {
    const db = getDB();
    const consultations = db.prepare(`
      SELECT * FROM consultations 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ success: true, consultations });
  } catch (error) {
    console.error('获取咨询列表失败:', error);
    res.status(500).json({ success: false, message: '获取咨询列表失败' });
  }
}

module.exports = { getServices, createServiceOrder, getMyServiceOrders, createConsultation, getMyConsultations };
