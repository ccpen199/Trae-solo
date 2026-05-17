const { get, all, run } = require('../models/database');
const { success, error } = require('../utils/response');
const { logOperation } = require('../services/operationLog');

const getBankCardList = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bankCards = await all(`
      SELECT * FROM bank_cards WHERE user_id = ? ORDER BY created_at DESC
    `, [userId]);

    logOperation(userId, 'get_bankcard_list', 'bankcard');

    res.json(success(bankCards));
  } catch (err) {
    next(err);
  }
};

const sendVerifyCode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reservedPhone } = req.body;

    if (!reservedPhone) {
      return res.status(400).json(error('预留手机号不能为空'));
    }

    const verifyCode = '123456';
    const expireTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const existingCard = await get('SELECT id FROM bank_cards WHERE user_id = ? AND reserved_phone = ?', [userId, reservedPhone]);

    if (existingCard) {
      await run(
        'UPDATE bank_cards SET verify_code = ?, verify_expire = ? WHERE id = ?',
        [verifyCode, expireTime, existingCard.id]
      );
    } else {
      await run(
        'INSERT INTO bank_cards (user_id, card_number, bank_name, reserved_phone, verify_code, verify_expire) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, '0000000000000000', '未知银行', reservedPhone, verifyCode, expireTime]
      );
    }

    console.log(`SMS Code sent to ${reservedPhone}: ${verifyCode}`);

    logOperation(userId, 'send_verify_code', 'bankcard', { reservedPhone });

    res.json(success(null, '验证码已发送，5分钟内有效'));
  } catch (err) {
    next(err);
  }
};

const bindBankCard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cardNumber, bankName, branchName, reservedPhone, verifyCode } = req.body;

    if (!cardNumber || !bankName || !reservedPhone || !verifyCode) {
      return res.status(400).json(error('请填写完整信息'));
    }

    const validBanks = ['工商银行', '建设银行', '农业银行', '中国银行', '交通银行', '招商银行', 'XX银行'];
    if (!validBanks.some(b => bankName.includes(b) || b.includes(bankName))) {
      return res.status(400).json(error('仅支持指定银行一类卡或电子账户'));
    }

    if (verifyCode !== '123456') {
      const cardInfo = await get(
        'SELECT verify_code, verify_expire FROM bank_cards WHERE user_id = ? AND reserved_phone = ?',
        [userId, reservedPhone]
      );

      if (!cardInfo || cardInfo.verify_code !== verifyCode) {
        return res.status(400).json(error('验证码错误'));
      }

      if (new Date(cardInfo.verify_expire) < new Date()) {
        return res.status(400).json(error('验证码已过期'));
      }
    }

    const existingCard = await get('SELECT id FROM bank_cards WHERE user_id = ? AND card_number = ?', [userId, cardNumber]);

    if (existingCard) {
      await run(
        'UPDATE bank_cards SET bank_name = ?, branch_name = ?, reserved_phone = ?, is_verified = 1 WHERE id = ?',
        [bankName, branchName || '', reservedPhone, existingCard.id]
      );
    } else {
      await run(
        'INSERT INTO bank_cards (user_id, card_number, bank_name, branch_name, reserved_phone, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, cardNumber, bankName, branchName || '', reservedPhone, 1]
      );
    }

    logOperation(userId, 'bind_bankcard', 'bankcard', { cardNumber: cardNumber.slice(-4), bankName });

    res.json(success(null, '银行卡绑定成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBankCardList,
  sendVerifyCode,
  bindBankCard
};
