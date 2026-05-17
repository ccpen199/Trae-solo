const { get, all } = require('../models/database');
const { success, error } = require('../utils/response');
const { logOperation } = require('../services/operationLog');

const getCommissionList = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const commissions = await all(`
      SELECT 
        c.*,
        CASE 
          WHEN c.status = 1 THEN '待结佣金'
          WHEN c.status = 2 THEN '部分垫付'
          WHEN c.status = 3 THEN '已结清'
          ELSE '未知'
        END as status_text
      FROM commissions c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);

    const totalPending = commissions.reduce((sum, c) => sum + c.pending_amount, 0);
    const totalAdvanced = commissions.reduce((sum, c) => sum + c.advanced_amount, 0);

    logOperation(userId, 'get_commission_list', 'commission');

    res.json(success({
      list: commissions,
      totalPending,
      totalAdvanced
    }));
  } catch (err) {
    next(err);
  }
};

const getCommissionDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const commission = await get(`
      SELECT 
        c.*,
        CASE 
          WHEN c.status = 1 THEN '待结佣金'
          WHEN c.status = 2 THEN '部分垫付'
          WHEN c.status = 3 THEN '已结清'
          ELSE '未知'
        END as status_text
      FROM commissions c
      WHERE c.id = ? AND c.user_id = ?
    `, [id, userId]);

    if (!commission) {
      return res.status(404).json(error('佣金记录不存在'));
    }

    logOperation(userId, 'get_commission_detail', 'commission', { id });

    res.json(success(commission));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCommissionList,
  getCommissionDetail
};
