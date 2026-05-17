const { db } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const getLawyers = (req, res) => {
  try {
    const { specialty, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM lawyers WHERE status = ?';
    const params = ['active'];
    
    if (specialty) {
      query += ' AND specialty = ?';
      params.push(specialty);
    }
    
    query += ' ORDER BY is_online DESC, rating DESC, review_count DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    
    const lawyers = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: lawyers
    });
  } catch (error) {
    console.error('获取律师列表错误:', error);
    res.json({ success: false, message: '获取律师列表失败' });
  }
};

const getLawyerDetail = (req, res) => {
  try {
    const { id } = req.params;
    const lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(id);
    
    if (!lawyer) {
      return res.json({ success: false, message: '律师不存在' });
    }

    const reviews = db.prepare(`
      SELECT r.*, u.nickname as user_name 
      FROM reviews r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.lawyer_id = ? 
      ORDER BY r.created_at DESC 
      LIMIT 10
    `).all(id);

    res.json({
      success: true,
      data: {
        lawyer,
        reviews
      }
    });
  } catch (error) {
    console.error('获取律师详情错误:', error);
    res.json({ success: false, message: '获取律师详情失败' });
  }
};

const createLawyerConsultOrder = (req, res) => {
  try {
    const { lawyer_id, consult_type } = req.body;
    
    if (!lawyer_id || !consult_type) {
      return res.json({ success: false, message: '请选择咨询类型' });
    }

    const lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(lawyer_id);
    if (!lawyer) {
      return res.json({ success: false, message: '律师不存在' });
    }

    let amount = 0;
    switch (consult_type) {
      case 'quick':
        amount = lawyer.quick_consult_price;
        break;
      case 'text':
        amount = lawyer.text_consult_price;
        break;
      case 'offline':
        amount = lawyer.offline_price;
        break;
      case 'document':
        amount = lawyer.document_price;
        break;
      default:
        return res.json({ success: false, message: '无效的咨询类型' });
    }

    const orderId = uuidv4();
    const expireAt = consult_type === 'text' 
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO orders (id, user_id, lawyer_id, type, amount, status, started_at)
      VALUES (?, ?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP)
    `).run(orderId, req.user.id, lawyer_id, consult_type, amount);

    const consultResult = db.prepare(`
      INSERT INTO consultations (order_id, user_id, lawyer_id, type, status, expire_at)
      VALUES (?, ?, ?, ?, 'in_progress', ?)
    `).run(orderId, req.user.id, lawyer_id, consult_type, expireAt);

    db.prepare(`
      INSERT INTO messages (consultation_id, sender_id, sender_type, type, content, created_at)
      VALUES (?, ?, 'lawyer', 'text', ?, CURRENT_TIMESTAMP)
    `).run(consultResult.lastInsertRowid, lawyer_id, `您好，我是${lawyer.name}，很高兴为您提供专业的法律咨询服务。请问有什么可以帮助您的？`);

    res.json({
      success: true,
      data: { orderId }
    });
  } catch (error) {
    console.error('创建律师咨询订单错误:', error);
    res.json({ success: false, message: '创建订单失败，请重试' });
  }
};

module.exports = {
  getLawyers,
  getLawyerDetail,
  createLawyerConsultOrder
};
