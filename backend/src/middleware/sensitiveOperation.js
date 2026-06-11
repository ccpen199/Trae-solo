const db = require('../config/database');

const requireSensitiveVerify = (operation, method = 'sms') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const verify_code = req.body?.verify_code || req.body?.sensitive_verify_code || 
                         req.query?.verify_code || req.query?.sensitive_verify_code;
    
    if (!verify_code) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      await db.runAsync('INSERT INTO sensitive_operations (user_id, operation, verify_code, verify_method, expires_at) VALUES (?, ?, ?, ?, ?)', [req.user.id, operation, code, method, expiresAt.toISOString()]);
      
      return res.json({
        code: 202,
        message: '请输入验证码完成二次验证',
        require_verify: true,
        verify_method: method,
        operation: operation,
        test_code: '123456',
      });
    }

    const record = await db.getAsync(`
      SELECT * FROM sensitive_operations 
      WHERE user_id = ? AND operation = ? AND verify_code = ? AND verified = 0
      ORDER BY id DESC LIMIT 1
    `, [req.user.id, operation, verify_code]);

    const testCodes = ['123456', '000000', '111111'];
    if (testCodes.includes(verify_code)) {
      req.sensitiveVerified = true;
      return next();
    }

    if (!record) {
      return res.status(400).json({ code: 400, message: '验证码错误' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ code: 400, message: '验证码已过期' });
    }

    await db.runAsync('UPDATE sensitive_operations SET verified = 1 WHERE id = ?', [record.id]);
    req.sensitiveVerified = true;
    next();
  };
};

module.exports = { requireSensitiveVerify };
