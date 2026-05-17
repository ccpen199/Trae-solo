const { db } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const getQuestionTypes = (req, res) => {
  try {
    const types = db.prepare('SELECT * FROM question_types WHERE is_active = 1 ORDER BY sort_order, id').all();
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('获取问题类型错误:', error);
    res.json({ success: false, message: '获取问题类型失败' });
  }
};

const createQuickConsultOrder = (req, res) => {
  try {
    const { question_type_id } = req.body;
    
    if (!question_type_id) {
      return res.json({ success: false, message: '请选择问题类型' });
    }

    const questionType = db.prepare('SELECT * FROM question_types WHERE id = ?').get(question_type_id);
    if (!questionType) {
      return res.json({ success: false, message: '问题类型不存在' });
    }

    const orderId = uuidv4();
    const order = {
      id: orderId,
      user_id: req.user.id,
      type: 'quick',
      question_type_id,
      amount: questionType.base_price,
      status: 'paid'
    };

    db.prepare(`
      INSERT INTO orders (id, user_id, type, question_type_id, amount, status, started_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(order.id, order.user_id, order.type, order.question_type_id, order.amount, order.status);

    db.prepare(`
      INSERT INTO consultations (order_id, user_id, type, status, expire_at)
      VALUES (?, ?, ?, 'waiting', DATETIME(CURRENT_TIMESTAMP, '+5 minutes'))
    `).run(orderId, req.user.id, 'quick');

    setTimeout(() => {
      try {
        const consult = db.prepare('SELECT * FROM consultations WHERE order_id = ?').get(orderId);
        if (consult && consult.status === 'waiting') {
          const lawyer = db.prepare('SELECT * FROM lawyers WHERE status = ? ORDER BY RANDOM() LIMIT 1').get('active');
          const lawyerId = lawyer ? lawyer.id : 1;
          
          db.prepare('UPDATE consultations SET status = ?, lawyer_id = ? WHERE id = ?').run('in_progress', lawyerId, consult.id);
          db.prepare('UPDATE orders SET is_free = 1, status = ?, lawyer_id = ? WHERE id = ?').run('in_progress', lawyerId, orderId);
          
          db.prepare(`
            INSERT INTO messages (consultation_id, sender_id, sender_type, type, content, created_at)
            VALUES (?, ?, 'lawyer', 'text', ?, CURRENT_TIMESTAMP)
          `).run(consult.id, lawyerId, '您好！由于等待超时，本次咨询已为您免费升级，我是您的专属律师，请问有什么可以帮您？');
        }
      } catch (err) {
        console.error('自动分配律师失败:', err.message);
      }
    }, 5000);

    res.json({
      success: true,
      data: { orderId, ...order }
    });
  } catch (error) {
    console.error('创建快速咨询订单错误:', error);
    res.json({ success: false, message: '创建订单失败，请重试' });
  }
};

const createTextConsultOrder = (req, res) => {
  try {
    const { question_type_id, description, images = [] } = req.body;
    
    if (!question_type_id || !description) {
      return res.json({ success: false, message: '请填写完整信息' });
    }

    const questionType = db.prepare('SELECT * FROM question_types WHERE id = ?').get(question_type_id);
    if (!questionType) {
      return res.json({ success: false, message: '问题类型不存在' });
    }

    const orderId = uuidv4();
    const expireAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO orders (id, user_id, type, question_type_id, amount, status, description, images, started_at)
      VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, CURRENT_TIMESTAMP)
    `).run(orderId, req.user.id, 'text', question_type_id, questionType.base_price, description, JSON.stringify(images));

    db.prepare(`
      INSERT INTO consultations (order_id, user_id, type, status, expire_at)
      VALUES (?, ?, ?, 'waiting', ?)
    `).run(orderId, req.user.id, 'text', expireAt);

    res.json({
      success: true,
      data: { orderId }
    });
  } catch (error) {
    console.error('创建图文咨询订单错误:', error);
    res.json({ success: false, message: '创建订单失败，请重试' });
  }
};

const getConsultationDetail = (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id);
    if (!order) {
      return res.json({ success: false, message: '订单不存在' });
    }

    let consultation = db.prepare(`
      SELECT *, 
        (strftime('%s', 'now') - strftime('%s', created_at)) as elapsed_seconds
      FROM consultations 
      WHERE order_id = ?
    `).get(orderId);
    
    if (!consultation) {
      return res.json({ success: false, message: '咨询记录不存在' });
    }
    
    if (consultation.status === 'waiting' && !consultation.lawyer_id && consultation.elapsed_seconds >= 5) {
      try {
        let lawyer = db.prepare('SELECT * FROM lawyers WHERE status = ? ORDER BY RANDOM() LIMIT 1').get('active');
        
        if (!lawyer) {
          lawyer = db.prepare('SELECT * FROM lawyers LIMIT 1').get();
        }
        
        const lawyerId = lawyer ? lawyer.id : 1;
        
        db.prepare('UPDATE consultations SET status = ?, lawyer_id = ? WHERE id = ?').run('in_progress', lawyerId, consultation.id);
        db.prepare('UPDATE orders SET status = ?, lawyer_id = ?, is_free = 1 WHERE id = ?').run('in_progress', lawyerId, orderId);
        
        consultation = db.prepare('SELECT * FROM consultations WHERE order_id = ?').get(orderId);
        
        db.prepare(`
          INSERT INTO messages (consultation_id, sender_id, sender_type, type, content, created_at)
          VALUES (?, ?, 'lawyer', 'text', ?, CURRENT_TIMESTAMP)
        `).run(consultation.id, lawyerId, '您好！由于等待超时，本次咨询已为您免费升级，我是您的专属律师，请问有什么可以帮您？');
      } catch (assignError) {
        console.error('分配律师错误:', assignError);
        db.prepare('UPDATE consultations SET status = ? WHERE id = ?').run('in_progress', consultation.id);
        db.prepare('UPDATE orders SET status = ?, is_free = 1 WHERE id = ?').run('in_progress', orderId);
        consultation = db.prepare('SELECT * FROM consultations WHERE order_id = ?').get(orderId);
      }
    }
    
    let messages = [];
    try {
      messages = db.prepare('SELECT * FROM messages WHERE consultation_id = ? ORDER BY created_at').all(consultation.id);
    } catch (msgErr) {
      console.error('获取消息失败:', msgErr);
    }
    
    let lawyer = null;
    if (consultation.lawyer_id) {
      try {
        lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(consultation.lawyer_id);
      } catch (lawyerErr) {
        console.error('获取律师信息失败:', lawyerErr);
      }
    }

    let questionType = null;
    if (order.question_type_id) {
      try {
        questionType = db.prepare('SELECT * FROM question_types WHERE id = ?').get(order.question_type_id);
      } catch (qtErr) {
        console.error('获取问题类型失败:', qtErr);
      }
    }

    res.json({
      success: true,
      data: {
        order,
        consultation,
        messages,
        lawyer,
        questionType
      }
    });
  } catch (error) {
    console.error('获取咨询详情错误:', error);
    res.json({ success: false, message: '获取详情失败: ' + error.message });
  }
};

const sendMessage = (req, res) => {
  try {
    const { consultationId } = req.params;
    const { content, type = 'text' } = req.body;
    
    if (!content) {
      return res.json({ success: false, message: '消息内容不能为空' });
    }

    const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(consultationId);
    if (!consultation) {
      return res.json({ success: false, message: '咨询不存在' });
    }

    if (consultation.user_id !== req.user.id) {
      return res.json({ success: false, message: '无权限操作' });
    }

    const result = db.prepare(`
      INSERT INTO messages (consultation_id, sender_id, sender_type, type, content)
      VALUES (?, ?, 'user', ?, ?)
    `).run(consultationId, req.user.id, type, content);

    db.prepare('UPDATE consultations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(consultationId);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    if (consultation.lawyer_id) {
      setTimeout(() => {
        db.prepare(`
          INSERT INTO messages (consultation_id, sender_id, sender_type, type, content)
          VALUES (?, ?, 'lawyer', 'text', ?)
        `).run(consultationId, consultation.lawyer_id, '您好，我正在查看您的问题，请稍候...');
      }, 1000);
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.json({ success: false, message: '发送失败，请重试' });
  }
};

const submitReview = (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, content, complaint } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.json({ success: false, message: '请选择有效评分' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id);
    if (!order) {
      return res.json({ success: false, message: '订单不存在' });
    }

    db.prepare(`
      INSERT INTO reviews (order_id, user_id, lawyer_id, rating, content, complaint)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, req.user.id, order.lawyer_id || 0, rating, content || '', complaint || '');

    db.prepare("UPDATE orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderId);
    db.prepare("UPDATE consultations SET status = 'completed' WHERE order_id = ?").run(orderId);

    res.json({
      success: true,
      message: '评价提交成功'
    });
  } catch (error) {
    console.error('提交评价错误:', error);
    res.json({ success: false, message: '提交失败，请重试' });
  }
};

module.exports = {
  getQuestionTypes,
  createQuickConsultOrder,
  createTextConsultOrder,
  getConsultationDetail,
  sendMessage,
  submitReview
};
