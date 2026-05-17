const { get, run } = require('../models/database');
const { success, error } = require('../utils/response');
const { logOperation } = require('../services/operationLog');

const register = async (req, res, next) => {
  try {
    const { phone, registerAgreement, commissionAgreement } = req.body;
    
    if (!phone) {
      return res.status(400).json(error('手机号不能为空'));
    }

    if (!registerAgreement || !commissionAgreement) {
      return res.status(400).json(error('请同意相关协议'));
    }

    const whitelist = await get('SELECT * FROM whitelist WHERE phone = ? AND status = 1', [phone]);
    if (!whitelist) {
      return res.status(403).json(error('您不在白名单中，无法注册'));
    }

    const existingUser = await get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.json(success({
        userId: existingUser.id,
        phone: existingUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        merchantName: existingUser.merchant_name
      }, '已注册'));
    }

    const result = await run(
      'INSERT INTO users (phone, merchant_name, store_id, register_agreement, commission_agreement, status) VALUES (?, ?, ?, ?, ?, ?)',
      [phone, whitelist.merchant_name, whitelist.store_id, 1, 1, 1]
    );

    const userId = result.lastID;

    await run('INSERT INTO credit_info (user_id) VALUES (?)', [userId]);

    logOperation(userId, 'register', 'user', { phone });

    res.json(success({
      userId,
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      merchantName: whitelist.merchant_name
    }, '注册成功'));
  } catch (err) {
    next(err);
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    const user = req.user;

    res.json(success({
      id: user.id,
      phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      merchantName: user.merchant_name,
      storeId: user.store_id,
      status: user.status,
      createdAt: user.created_at
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  getUserInfo
};
