const { get, all, run } = require('../models/database');
const { success, error } = require('../utils/response');
const { logOperation } = require('../services/operationLog');

const getAdvanceList = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const applications = await all(`
      SELECT 
        a.*,
        CASE 
          WHEN a.status = 0 THEN '待审核'
          WHEN a.status = 1 THEN '审核通过'
          WHEN a.status = 2 THEN '已放款'
          WHEN a.status = 3 THEN '已拒绝'
          ELSE '未知'
        END as status_text,
        CASE 
          WHEN a.repay_status = 0 THEN '待还款'
          WHEN a.repay_status = 1 THEN '已还款'
          ELSE '未知'
        END as repay_status_text
      FROM advance_applications a
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [userId]);

    logOperation(userId, 'get_advance_list', 'advance');

    res.json(success(applications));
  } catch (err) {
    next(err);
  }
};

const submitAdvanceApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commissionId, applyAmount, faceVerified, contractRead, signatureAuth } = req.body;

    if (!commissionId || !applyAmount) {
      return res.status(400).json(error('请选择佣金批次并填写申请金额'));
    }

    if (!faceVerified || !contractRead || !signatureAuth) {
      return res.status(400).json(error('请完成人脸识别、阅读合同并签字授权'));
    }

    const pendingApplication = await get(`
      SELECT * FROM advance_applications 
      WHERE user_id = ? AND status IN (0, 1)
    `, [userId]);

    if (pendingApplication) {
      return res.status(400).json(error('您有正在审核中的申请，请等待审核完成'));
    }

    const commission = await get('SELECT * FROM commissions WHERE id = ? AND user_id = ?', [commissionId, userId]);
    if (!commission) {
      return res.status(404).json(error('佣金记录不存在'));
    }

    if (!commission.has_invoice) {
      return res.status(400).json(error('该佣金批次尚未开具发票，无法申请垫付'));
    }

    if (applyAmount > commission.pending_amount) {
      return res.status(400).json(error('申请金额不能超过待结佣金金额'));
    }

    const creditInfo = await get('SELECT * FROM credit_info WHERE user_id = ?', [userId]);
    if (!creditInfo || creditInfo.status !== 2) {
      return res.status(400).json(error('您尚未完成授信审核，请先完成授信'));
    }

    if (applyAmount > creditInfo.available_limit) {
      return res.status(400).json(error('申请金额超出可用额度'));
    }

    const bankCards = await all('SELECT * FROM bank_cards WHERE user_id = ? AND is_verified = 1', [userId]);
    if (bankCards.length === 0) {
      return res.status(400).json(error('请先绑定银行卡'));
    }

    const result = await run(
      `INSERT INTO advance_applications 
      (user_id, commission_id, batch_no, apply_amount, face_verified, contract_read, signature_auth, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        commissionId,
        commission.batch_no,
        applyAmount,
        faceVerified ? 1 : 0,
        contractRead ? 1 : 0,
        signatureAuth ? 1 : 0,
        1
      ]
    );

    await run(
      `UPDATE commissions 
      SET pending_amount = pending_amount - ?, 
          advanced_amount = advanced_amount + ?,
          status = CASE WHEN pending_amount - ? = 0 THEN 3 ELSE 2 END
      WHERE id = ?`,
      [applyAmount, applyAmount, applyAmount, commissionId]
    );

    await run(
      `UPDATE credit_info 
      SET available_limit = available_limit - ?
      WHERE user_id = ?`,
      [applyAmount, userId]
    );

    logOperation(userId, 'submit_advance_application', 'advance', { commissionId, applyAmount });

    res.json(success({ applicationId: result.lastID }, '垫付申请提交成功，已自动审核通过'));
  } catch (err) {
    next(err);
  }
};

const getAdvancePreCheck = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commissionId } = req.query;

    const pendingApplication = await get(`
      SELECT * FROM advance_applications 
      WHERE user_id = ? AND status IN (0, 1)
    `, [userId]);

    const creditInfo = await get('SELECT * FROM credit_info WHERE user_id = ?', [userId]);
    const bankCards = await all('SELECT * FROM bank_cards WHERE user_id = ? AND is_verified = 1', [userId]);

    let commissionInfo = null;
    if (commissionId) {
      commissionInfo = await get('SELECT * FROM commissions WHERE id = ? AND user_id = ?', [commissionId, userId]);
    }

    logOperation(userId, 'get_advance_precheck', 'advance', { commissionId });

    res.json(success({
      hasPendingApplication: !!pendingApplication,
      creditStatus: creditInfo?.status || 0,
      creditLimit: creditInfo?.credit_limit || 0,
      availableLimit: creditInfo?.available_limit || 0,
      hasBankCard: bankCards.length > 0,
      commissionInfo,
      canApply: !pendingApplication && creditInfo?.status === 2 && bankCards.length > 0 && (!commissionId || commissionInfo?.has_invoice)
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdvanceList,
  submitAdvanceApplication,
  getAdvancePreCheck
};
