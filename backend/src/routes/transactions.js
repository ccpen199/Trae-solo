const express = require('express');
const Transaction = require('../models/Transaction');
const StudentAccount = require('../models/StudentAccount');
const { authenticateAdmin, authenticateStudent, requireRole } = require('../middleware/auth');
const { generateTransactionId } = require('../utils/generateId');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status, paymentMethod, startDate, endDate, studentId, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (studentId) query.studentId = studentId;
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { thirdPartyTransactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('accountId', 'name studentId')
      .populate('operatorId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics', authenticateAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    const query = Object.keys(dateQuery).length > 0 ? { createdAt: dateQuery } : {};

    const totalCount = await Transaction.countDocuments({ ...query, status: 'success' });
    
    const totalAmount = await Transaction.aggregate([
      { $match: { ...query, status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const rechargeAmount = await Transaction.aggregate([
      { $match: { ...query, type: 'recharge', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const consumptionAmount = await Transaction.aggregate([
      { $match: { ...query, type: 'consumption', status: 'success' } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
    ]);

    const typeStats = await Transaction.aggregate([
      { $match: { ...query, status: 'success' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const dailyStats = await Transaction.aggregate([
      { $match: { ...query, status: 'success' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          recharge: { $sum: { $cond: [{ $eq: ['$type', 'recharge'] }, '$amount', 0] } },
          consumption: { $sum: { $cond: [{ $eq: ['$type', 'consumption'] }, { $abs: '$amount' }, 0] } }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    const unreconciledCount = await Transaction.countDocuments({
      type: 'recharge',
      status: 'success',
      'bankReconciliation.reconciled': false
    });

    const unreconciledAmount = await Transaction.aggregate([
      { $match: { type: 'recharge', status: 'success', 'bankReconciliation.reconciled': false } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalCount,
        totalAmount: totalAmount[0]?.total || 0,
        rechargeAmount: rechargeAmount[0]?.total || 0,
        consumptionAmount: consumptionAmount[0]?.total || 0,
        netFlow: (rechargeAmount[0]?.total || 0) - (consumptionAmount[0]?.total || 0),
        typeStats,
        dailyStats: dailyStats.reverse(),
        unreconciled: {
          count: unreconciledCount,
          amount: unreconciledAmount[0]?.total || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('accountId', 'name studentId phone')
      .populate('operatorId', 'name');

    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易记录不存在' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/refund', authenticateAdmin, requireRole('super_admin', 'admin', 'finance'), async (req, res, next) => {
  try {
    const { reason, amount } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易记录不存在' });
    }

    if (transaction.status !== 'success' || transaction.type !== 'recharge') {
      return res.status(400).json({ success: false, message: '该交易不支持退款' });
    }

    if (transaction.isReversed) {
      return res.status(400).json({ success: false, message: '该交易已退款' });
    }

    const refundAmount = amount || Math.abs(transaction.amount);
    if (refundAmount > Math.abs(transaction.amount)) {
      return res.status(400).json({ success: false, message: '退款金额不能超过原交易金额' });
    }

    const student = await StudentAccount.findById(transaction.accountId);
    if (!student) {
      return res.status(404).json({ success: false, message: '学生账户不存在' });
    }

    if (student.balance < refundAmount) {
      return res.status(400).json({ success: false, message: '账户余额不足' });
    }

    const refundTransactionId = generateTransactionId();
    const newBalance = parseFloat((student.balance - refundAmount).toFixed(2));

    const refundTransaction = new Transaction({
      transactionId: refundTransactionId,
      studentId: student.studentId,
      accountId: student._id,
      type: 'refund',
      amount: -refundAmount,
      balanceAfter: newBalance,
      paymentMethod: transaction.paymentMethod,
      status: 'success',
      channel: 'admin',
      operatorId: req.admin._id,
      remark: reason,
      isReversed: true,
      reversedTransactionId: transaction.transactionId,
      completedAt: Date.now()
    });
    await refundTransaction.save();

    student.balance = newBalance;
    student.totalRecharge = parseFloat((student.totalRecharge - refundAmount).toFixed(2));
    student.updatedAt = Date.now();
    await student.save();

    transaction.isReversed = true;
    transaction.status = 'refunded';
    await transaction.save();

    res.json({
      success: true,
      message: '退款成功',
      data: {
        refundTransactionId,
        refundAmount,
        balance: newBalance
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bank-reconciliation', authenticateAdmin, requireRole('super_admin', 'admin', 'finance'), async (req, res, next) => {
  try {
    const { transactionIds, reconcileDate, batchId } = req.body;

    const result = await Transaction.updateMany(
      { _id: { $in: transactionIds }, type: 'recharge', status: 'success' },
      {
        'bankReconciliation.reconciled': true,
        'bankReconciliation.reconcileDate': new Date(reconcileDate),
        'bankReconciliation.reconcileBatchId': batchId,
        settlementStatus: 'settled',
        settlementDate: new Date(reconcileDate)
      }
    );

    res.json({
      success: true,
      message: `成功对账 ${result.modifiedCount} 条记录`
    });
  } catch (error) {
    next(error);
  }
});

router.get('/bank-reconciliation/pending', authenticateAdmin, requireRole('super_admin', 'admin', 'finance'), async (req, res, next) => {
  try {
    const pendingTransactions = await Transaction.find({
      type: 'recharge',
      status: 'success',
      'bankReconciliation.reconciled': false
    }).sort({ createdAt: 1 });

    const totalAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions: pendingTransactions,
        totalAmount,
        totalCount: pendingTransactions.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
