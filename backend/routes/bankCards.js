const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

const bankBinMap = {
  '622202': { bank: '工商银行', type: 'debit' },
  '622700': { bank: '建设银行', type: 'debit' },
  '622848': { bank: '农业银行', type: 'debit' },
  '621661': { bank: '中国银行', type: 'debit' },
  '622588': { bank: '招商银行', type: 'debit' },
  '622622': { bank: '民生银行', type: 'debit' },
  '622556': { bank: '交通银行', type: 'debit' },
  '622150': { bank: '邮政储蓄', type: 'debit' },
  '436742': { bank: '建设银行', type: 'credit' },
  '552245': { bank: '建设银行', type: 'credit' },
  '524094': { bank: '工商银行', type: 'credit' },
};

const identifyBank = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  for (const [bin, info] of Object.entries(bankBinMap)) {
    if (cleanNumber.startsWith(bin)) {
      return info;
    }
  }
  return { bank: '未知银行', type: 'debit' };
};

router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const cards = db.prepare('SELECT * FROM bank_cards WHERE user_id = ? AND is_active = 1').all(userId);
    res.success(cards);
  } catch (err) {
    res.error('获取银行卡列表失败', err.message);
  }
});

router.post('/identify', (req, res) => {
  try {
    const { cardNumber } = req.body;
    
    if (!cardNumber) {
      return res.error('请输入卡号');
    }
    
    const info = identifyBank(cardNumber);
    res.success(info);
  } catch (err) {
    res.error('识别银行卡失败', err.message);
  }
});

router.post('/bind', (req, res) => {
  try {
    const { userId, cardNumber, cardHolder } = req.body;
    
    if (!userId || !cardNumber || !cardHolder) {
      return res.error('参数不完整');
    }
    
    const info = identifyBank(cardNumber);
    
    if (info.type === 'credit') {
      return res.error('不支持绑定信用卡');
    }
    
    const cardId = uuidv4();
    db.prepare(`
      INSERT INTO bank_cards (id, user_id, card_number, bank_name, card_type, card_holder)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cardId, userId, cardNumber.replace(/\s/g, ''), info.bank, info.type, cardHolder);
    
    res.success({ id: cardId, ...info }, '绑卡成功');
  } catch (err) {
    res.error('绑卡失败', err.message);
  }
});

router.delete('/:cardId', (req, res) => {
  try {
    const { cardId } = req.params;
    const result = db.prepare('UPDATE bank_cards SET is_active = 0 WHERE id = ?').run(cardId);
    
    if (result.changes === 0) {
      return res.error('银行卡不存在', null, 404);
    }
    
    res.success(null, '解绑成功');
  } catch (err) {
    res.error('解绑失败', err.message);
  }
});

module.exports = router;
