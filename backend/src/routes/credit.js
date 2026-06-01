const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/init');

const router = express.Router();

router.post('/check-eligibility', authenticateToken, [
  body('productId').isInt().withMessage('产品ID不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { productId } = req.body;
  
  const eligible = Math.random() > 0.1;
  
  res.json({
    success: true,
    data: { eligible, message: eligible ? '准入校验通过' : '暂时不符合申请条件' }
  });
});

router.post('/', authenticateToken, [
  body('productId').isInt().withMessage('产品ID不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { productId } = req.body;
  const userId = req.user.id;

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(400).json({ success: false, message: '产品不存在' });
    }

    const result = db.prepare(
      'INSERT INTO credit_applications (user_id, product_id, status) VALUES (?, ?, ?)'
    ).run(userId, productId, 'pending');
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid, status: 'pending' },
      message: '授信申请已创建'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '创建授信申请失败' });
  }
});

router.put('/:id/id-card', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { idCardFront, idCardBack, ocrData } = req.body;
  const userId = req.user.id;

  try {
    const result = db.prepare(
      'UPDATE credit_applications SET id_card_front = ?, id_card_back = ?, ocr_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).run(idCardFront, idCardBack, JSON.stringify(ocrData || {}), id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '授信申请不存在' });
    }
    res.json({ success: true, message: '身份证信息已保存' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '保存身份证信息失败' });
  }
});

router.put('/:id/personal-info', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const personalInfo = req.body;

  try {
    const result = db.prepare(
      'UPDATE credit_applications SET personal_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).run(JSON.stringify(personalInfo), id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '授信申请不存在' });
    }
    res.json({ success: true, message: '个人信息已保存' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '保存个人信息失败' });
  }
});

router.put('/:id/contact-info', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const contactInfo = req.body;

  try {
    const result = db.prepare(
      'UPDATE credit_applications SET contact_info = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).run(JSON.stringify(contactInfo), 'reviewing', id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '授信申请不存在' });
    }

    setTimeout(() => {
      const approved = Math.random() > 0.3;
      const status = approved ? 'approved' : 'rejected';
      const approvedAmount = approved ? (Math.random() * 100000 + 50000).toFixed(2) : null;
      
      db.prepare(
        'UPDATE credit_applications SET status = ?, approved_amount = ?, approved_term = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(status, approvedAmount, 12, approved ? null : '综合评分不足', id);
    }, 3000);

    res.json({ success: true, data: { status: 'reviewing' }, message: '申请已提交，审核中' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '提交申请失败' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  try {
    const applications = db.prepare(
      'SELECT ca.*, p.name as product_name, p.max_amount, p.min_amount FROM credit_applications ca LEFT JOIN products p ON ca.product_id = p.id WHERE ca.user_id = ? ORDER BY ca.created_at DESC'
    ).all(userId);
    
    res.json({ success: true, data: applications || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取授信列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const application = db.prepare(
      'SELECT ca.*, p.name as product_name, p.status as product_status, p.max_amount, p.min_amount, p.interest_rate FROM credit_applications ca LEFT JOIN products p ON ca.product_id = p.id WHERE ca.id = ? AND ca.user_id = ?'
    ).get(id, userId);

    if (!application) {
      return res.status(404).json({ success: false, message: '授信申请不存在' });
    }
    
    application.ocr_data = application.ocr_data ? JSON.parse(application.ocr_data) : null;
    application.personal_info = application.personal_info ? JSON.parse(application.personal_info) : null;
    application.contact_info = application.contact_info ? JSON.parse(application.contact_info) : null;
    
    res.json({ success: true, data: application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取授信详情失败' });
  }
});

module.exports = router;
