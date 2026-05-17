const { get, all } = require('../models/database');
const { success, error } = require('../utils/response');
const { logOperation } = require('../services/operationLog');

const checkWhitelist = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json(error('手机号不能为空'));
    }

    const whitelist = await get('SELECT * FROM whitelist WHERE phone = ? AND status = 1', [phone]);
    
    logOperation(null, 'check_whitelist', 'whitelist', { phone });

    if (!whitelist) {
      return res.json(success({
        isWhitelisted: false,
        contactPhone: '400-123-4567'
      }, '暂无法使用该服务'));
    }

    const user = await get('SELECT * FROM users WHERE phone = ?', [phone]);

    res.json(success({
      isWhitelisted: true,
      merchantName: whitelist.merchant_name,
      storeId: whitelist.store_id,
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      isRegistered: !!user,
      userId: user?.id
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkWhitelist
};
