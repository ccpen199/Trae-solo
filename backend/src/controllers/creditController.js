const { get, run } = require('../models/database');
const { success, error } = require('../utils/response');
const { logOperation } = require('../services/operationLog');
const dayjs = require('dayjs');

const getCreditInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const creditInfo = await get('SELECT * FROM credit_info WHERE user_id = ?', [userId]);

    logOperation(userId, 'get_credit_info', 'credit');

    res.json(success(creditInfo));
  } catch (err) {
    next(err);
  }
};

const submitCreditApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyName, creditCode, legalName, idCard, authAgreement } = req.body;

    if (!companyName || !creditCode || !legalName || !idCard || !authAgreement) {
      return res.status(400).json(error('请填写完整信息并同意授权协议'));
    }

    const today = dayjs().format('YYYY-MM-DD');
    let creditInfo = await get('SELECT * FROM credit_info WHERE user_id = ?', [userId]);

    if (creditInfo?.last_verify_date === today && creditInfo?.verify_attempts >= 5) {
      return res.status(429).json(error('今日验证次数已达上限，请明日再试'));
    }

    const attempts = creditInfo?.last_verify_date === today ? (creditInfo.verify_attempts || 0) + 1 : 1;

    const verifySuccess = Math.random() > 0.2;

    if (creditInfo) {
      await run(
        `UPDATE credit_info 
        SET company_name = ?, credit_code = ?, legal_name = ?, id_card = ?, 
            auth_agreement = ?, verify_attempts = ?, last_verify_date = ?,
            status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [companyName, creditCode, legalName, idCard,
          authAgreement ? 1 : 0, attempts, today,
          verifySuccess ? 2 : 0, userId]
      );
    } else {
      const result = await run(
        `INSERT INTO credit_info (user_id, company_name, credit_code, legal_name, id_card, auth_agreement, verify_attempts, last_verify_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, companyName, creditCode, legalName, idCard, authAgreement ? 1 : 0, attempts, today, verifySuccess ? 2 : 0]
      );
    }

    if (verifySuccess) {
      await run(
        `UPDATE credit_info 
        SET status = 2, credit_limit = 500000, available_limit = 500000
        WHERE user_id = ?`,
        [userId]
      );
    }

    logOperation(userId, 'submit_credit_application', 'credit', req.body);

    if (verifySuccess) {
      res.json(success(null, '授信审核通过，额度50万元'));
    } else {
      res.status(400).json(error('企业信息或四要素验证失败，请检查后重试'));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCreditInfo,
  submitCreditApplication
};
