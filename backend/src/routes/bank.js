const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const validBanks = ['XX银行', '工商银行', '建设银行', '农业银行'];
const validCardTypes = ['一类卡', '电子账户'];

router.get('/info', authMiddleware, (req, res) => {
  const entStmt = db.prepare('SELECT * FROM enterprise_info WHERE user_id = ?');
  const enterprise = entStmt.get(req.userId);

  res.json({
    code: 200,
    data: {
      bankCard: enterprise?.bank_card || '',
      bankName: enterprise?.bank_name || '',
      bankMobile: enterprise?.bank_mobile || '',
      bound: !!(enterprise?.bank_card && enterprise?.bank_name)
    }
  });
});

router.post('/bind', authMiddleware, (req, res) => {
  const { bankCard, bankName, bankMobile, verifyCode } = req.body;

  if (!bankCard || !bankName || !bankMobile || !verifyCode) {
    return res.json({ code: 400, message: '请填写完整信息' });
  }

  if (!validBanks.some(b => bankName.includes(b))) {
    return res.json({ code: 400, message: '仅支持XX银行一类卡或电子账户' });
  }

  if (!/^\d{16,19}$/.test(bankCard)) {
    return res.json({ code: 400, message: '银行卡号格式不正确' });
  }

  if (verifyCode !== '123456') {
    return res.json({ code: 400, message: '验证码错误' });
  }

  db.prepare(`
    UPDATE enterprise_info 
    SET bank_card = ?, bank_name = ?, bank_mobile = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE user_id = ?
  `).run(bankCard, bankName, bankMobile, req.userId);

  res.json({ code: 200, message: '账户绑定成功' });
});

router.post('/send-code', authMiddleware, (req, res) => {
  const { mobile } = req.body;
  if (!/^1\d{10}$/.test(mobile)) {
    return res.json({ code: 400, message: '手机号格式不正确' });
  }
  res.json({ code: 200, message: '验证码已发送，测试验证码：123456' });
});

module.exports = router;
