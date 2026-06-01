const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../db');
const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    if (!userId) {
      return res.error('用户ID不能为空');
    }
    
    if (amount !== undefined && amount !== null) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0.01 || numAmount > 5000) {
        return res.error('金额必须在0.01元到5000元之间');
      }
    }
    
    const qrId = uuidv4();
    const qrData = JSON.stringify({
      id: qrId,
      userId,
      amount: amount ? parseFloat(amount) : null,
      timestamp: Date.now()
    });
    
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    db.prepare(`
      INSERT INTO qr_codes (id, user_id, amount, description, code_data, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(qrId, userId, amount ? parseFloat(amount) : null, description || '', qrData, 'active', Date.now() + 30 * 60 * 1000);
    
    res.success({
      id: qrId,
      qrImage,
      amount: amount ? parseFloat(amount) : null,
      description: description || ''
    });
  } catch (err) {
    res.error('生成二维码失败', err.message);
  }
});

router.get('/:qrId', (req, res) => {
  try {
    const { qrId } = req.params;
    const qrCode = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(qrId);
    
    if (!qrCode) {
      return res.error('二维码不存在', null, 404);
    }
    
    if (qrCode.status !== 'active') {
      return res.error('二维码已失效');
    }
    
    if (qrCode.expires_at && qrCode.expires_at < Date.now()) {
      return res.error('二维码已过期');
    }
    
    const user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(qrCode.user_id);
    
    res.success({
      ...qrCode,
      payee: user
    });
  } catch (err) {
    res.error('获取二维码信息失败', err.message);
  }
});

router.get('/user/:userId/latest', (req, res) => {
  try {
    const { userId } = req.params;
    const qrCode = db.prepare(`
      SELECT * FROM qr_codes 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `).get(userId);
    
    res.success(qrCode || null);
  } catch (err) {
    res.error('获取最新二维码失败', err.message);
  }
});

module.exports = router;
