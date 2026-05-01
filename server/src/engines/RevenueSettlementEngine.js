const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

class RevenueSettlementEngine {
  constructor(options = {}) {
    this.config = {
      feePercentage: parseFloat(options.feePercentage || process.env.SETTLEMENT_FEE_PERCENTAGE || 0.1),
      minAmount: parseFloat(options.minAmount || process.env.SETTLEMENT_MIN_AMOUNT || 10),
      maxDailyWithdraw: 10000,
      maxMonthlyWithdraw: 50000,
      autoSettlementThreshold: 50,
      settlementDelayDays: 3
    };

    this.settlementRules = {
      question_reward: {
        description: '问题悬赏结算',
        feePercentage: 0.1,
        autoRelease: true,
        settlementDelay: 0
      },
      accepted_answer: {
        description: '采纳回答结算',
        feePercentage: 0.1,
        autoRelease: true,
        settlementDelay: 3 * 24 * 60 * 60 * 1000
      },
      knowledge_contribution: {
        description: '知识库贡献奖励',
        feePercentage: 0,
        autoRelease: true,
        settlementDelay: 0
      },
      expert_bonus: {
        description: '专家奖励',
        feePercentage: 0.05,
        autoRelease: true,
        settlementDelay: 0
      }
    };
  }

  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = uuidv4().substring(0, 8);
    return `TX-${timestamp}-${random}`.toUpperCase();
  }

  async createEscrow(questionId, options = {}) {
    const question = await Question.findById(questionId).populate('author');
    if (!question) {
      throw new Error('Question not found');
    }

    const { reward } = question;
    if (!reward || (reward.points <= 0 && reward.money <= 0)) {
      throw new Error('No reward specified for this question');
    }

    const author = question.author;

    if (reward.money > 0 && author.balance < reward.money) {
      throw new Error('Insufficient balance for money reward');
    }

    if (reward.points > 0 && author.points < reward.points) {
      throw new Error('Insufficient points for points reward');
    }

    const escrowTransactions = [];

    if (reward.money > 0) {
      const moneyEscrow = new Transaction({
        transactionId: this.generateTransactionId(),
        transactionType: 'reward_escrow',
        status: 'pending',
        fromUser: author._id,
        toUser: null,
        amount: reward.money,
        currency: 'CNY',
        fee: 0,
        netAmount: reward.money,
        relatedEntity: {
          type: 'question',
          id: question._id
        },
        settlementEngine: {
          engineVersion: '1.0',
          ruleSet: 'question_reward',
          processedAt: new Date()
        },
        reason: `问题悬赏托管: ${question.title.substring(0, 50)}`
      });

      await moneyEscrow.save();
      escrowTransactions.push(moneyEscrow);

      author.balance -= reward.money;
      moneyEscrow.addAudit('escrow_created', author._id, 'user', {
        originalBalance: author.balance + reward.money,
        newBalance: author.balance
      });
      moneyEscrow.updateStatus('completed', '托管成功', author._id, 'user');
    }

    if (reward.points > 0) {
      const pointsEscrow = new Transaction({
        transactionId: this.generateTransactionId(),
        transactionType: 'reward_escrow',
        status: 'pending',
        fromUser: author._id,
        toUser: null,
        amount: 0,
        currency: 'points',
        points: reward.points,
        fee: 0,
        netAmount: 0,
        relatedEntity: {
          type: 'question',
          id: question._id
        },
        settlementEngine: {
          engineVersion: '1.0',
          ruleSet: 'question_reward',
          processedAt: new Date()
        },
        reason: `积分悬赏托管: ${question.title.substring(0, 50)}`
      });

      await pointsEscrow.save();
      escrowTransactions.push(pointsEscrow);

      author.points -= reward.points;
      pointsEscrow.addAudit('points_escrow_created', author._id, 'user', {
        originalPoints: author.points + reward.points,
        newPoints: author.points
      });
      pointsEscrow.updateStatus('completed', '积分托管成功', author._id, 'user');
    }

    question.reward.isEscrowed = true;
    await question.save();
    await author.save();

    return {
      question,
      escrowTransactions,
      totalEscrowed: {
        money: reward.money,
        points: reward.points
      }
    };
  }

  async settleAcceptedAnswer(questionId, answerId, options = {}) {
    const question = await Question.findById(questionId).populate('author');
    const answer = await Answer.findById(answerId).populate('author');

    if (!question || !answer) {
      throw new Error('Question or Answer not found');
    }

    if (!question.reward.isEscrowed) {
      throw new Error('Reward is not escrowed yet');
    }

    const { reward } = question;
    const answerAuthor = answer.author;
    const questionAuthor = question.author;

    const settlementTransactions = [];
    const notifications = [];

    if (reward.money > 0) {
      const feePercentage = this.config.feePercentage;
      const feeAmount = reward.money * feePercentage;
      const netAmount = reward.money - feeAmount;

      const settlement = new Transaction({
        transactionId: this.generateTransactionId(),
        transactionType: 'reward_settlement',
        status: 'processing',
        fromUser: null,
        toUser: answerAuthor._id,
        amount: reward.money,
        currency: 'CNY',
        fee: feeAmount,
        feePercent: feePercentage,
        netAmount: netAmount,
        relatedEntity: {
          type: 'answer',
          id: answer._id
        },
        settlementEngine: {
          engineVersion: '1.0',
          ruleSet: 'accepted_answer',
          calculationDetails: {
            originalReward: reward.money,
            feePercentage,
            feeAmount,
            netAmount
          },
          processedAt: new Date()
        },
        metadata: {
          questionId: question.questionId,
          answerId: answer.answerId,
          rewardType: 'money'
        },
        reason: `回答被采纳赏金结算: ${question.title.substring(0, 50)}`
      });

      await settlement.save();
      settlementTransactions.push(settlement);

      answerAuthor.balance += netAmount;
      answerAuthor.metadata.acceptedAnswerCount = (answerAuthor.metadata.acceptedAnswerCount || 0) + 1;

      settlement.addAudit('settlement_completed', null, 'system', {
        receiverId: answerAuthor._id,
        receiverName: answerAuthor.username,
        originalReward: reward.money,
        feeAmount,
        netAmount
      });
      settlement.updateStatus('completed', '结算完成', null, 'system');

      const platformFee = new Transaction({
        transactionId: this.generateTransactionId(),
        transactionType: 'platform_fee',
        status: 'completed',
        fromUser: null,
        toUser: null,
        amount: feeAmount,
        currency: 'CNY',
        fee: 0,
        netAmount: feeAmount,
        relatedEntity: {
          type: 'transaction',
          id: settlement._id
        },
        metadata: {
          parentTransactionId: settlement.transactionId,
          questionId: question.questionId,
          answerId: answer.answerId
        },
        reason: `平台服务费 (${(feePercentage * 100).toFixed(0)}%)`
      });

      await platformFee.save();
      settlementTransactions.push(platformFee);

      notifications.push({
        to: answerAuthor._id,
        type: 'transaction_complete',
        title: '赏金到账通知',
        content: `您回答的问题"${question.title}"被采纳，获得赏金 ${netAmount.toFixed(2)} 元（已扣除 ${feeAmount.toFixed(2)} 元平台服务费）。`
      });
    }

    if (reward.points > 0) {
      const pointsSettlement = new Transaction({
        transactionId: this.generateTransactionId(),
        transactionType: 'reward_settlement',
        status: 'processing',
        fromUser: null,
        toUser: answerAuthor._id,
        amount: 0,
        currency: 'points',
        points: reward.points,
        fee: 0,
        feePercent: 0,
        netAmount: 0,
        relatedEntity: {
          type: 'answer',
          id: answer._id
        },
        settlementEngine: {
          engineVersion: '1.0',
          ruleSet: 'accepted_answer',
          calculationDetails: {
            pointsReward: reward.points
          },
          processedAt: new Date()
        },
        metadata: {
          questionId: question.questionId,
          answerId: answer.answerId,
          rewardType: 'points'
        },
        reason: `积分悬赏结算: ${question.title.substring(0, 50)}`
      });

      await pointsSettlement.save();
      settlementTransactions.push(pointsSettlement);

      answerAuthor.points += reward.points;
      answerAuthor.metadata.answerCount = (answerAuthor.metadata.answerCount || 0) + 1;

      pointsSettlement.addAudit('points_settlement_completed', null, 'system', {
        receiverId: answerAuthor._id,
        receiverName: answerAuthor.username,
        pointsReward: reward.points
      });
      pointsSettlement.updateStatus('completed', '积分结算完成', null, 'system');

      notifications.push({
        to: answerAuthor._id,
        type: 'transaction_complete',
        title: '积分到账通知',
        content: `您回答的问题"${question.title}"被采纳，获得积分 ${reward.points} 分。`
      });
    }

    await answerAuthor.save();

    question.status = 'solved';
    question.workflowStatus = 'result_confirmation';
    await question.save();

    for (const notificationData of notifications) {
      const notification = new Notification({
        notificationId: uuidv4(),
        recipient: notificationData.to,
        notificationType: notificationData.type,
        priority: 'high',
        title: notificationData.title,
        content: notificationData.content,
        data: {
          questionId: question.questionId,
          answerId: answer.answerId,
          transactions: settlementTransactions.map(t => t.transactionId)
        },
        relatedEntity: {
          type: 'Transaction',
          id: settlementTransactions[0]?._id
        },
        channels: ['in_app', 'email'],
        source: 'system'
      });
      await notification.save();
    }

    return {
      question,
      answer,
      settlementTransactions,
      totalSettled: {
        money: reward.money,
        points: reward.points
      },
      notificationsSent: notifications.length
    };
  }

  async rollbackEscrow(questionId, reason = '问题关闭') {
    const question = await Question.findById(questionId).populate('author');
    if (!question) {
      throw new Error('Question not found');
    }

    if (!question.reward.isEscrowed) {
      throw new Error('No escrow to rollback');
    }

    const author = question.author;
    const { reward } = question;
    const rollbackTransactions = [];

    const escrowTransactions = await Transaction.find({
      'relatedEntity.id': question._id,
      'relatedEntity.type': 'question',
      transactionType: 'reward_escrow',
      status: 'completed'
    });

    for (const escrow of escrowTransactions) {
      if (escrow.currency === 'CNY' && escrow.amount > 0) {
        const rollback = new Transaction({
          transactionId: this.generateTransactionId(),
          transactionType: 'reward_rollback',
          status: 'processing',
          fromUser: null,
          toUser: author._id,
          amount: escrow.amount,
          currency: 'CNY',
          fee: 0,
          netAmount: escrow.amount,
          relatedEntity: {
            type: 'transaction',
            id: escrow._id
          },
          reason: `托管回滚: ${reason}`
        });

        await rollback.save();
        rollbackTransactions.push(rollback);

        author.balance += escrow.amount;
        rollback.updateStatus('completed', '回滚成功', null, 'system');
      }

      if (escrow.currency === 'points' && escrow.points > 0) {
        const pointsRollback = new Transaction({
          transactionId: this.generateTransactionId(),
          transactionType: 'reward_rollback',
          status: 'processing',
          fromUser: null,
          toUser: author._id,
          amount: 0,
          currency: 'points',
          points: escrow.points,
          fee: 0,
          netAmount: 0,
          relatedEntity: {
            type: 'transaction',
            id: escrow._id
          },
          reason: `积分托管回滚: ${reason}`
        });

        await pointsRollback.save();
        rollbackTransactions.push(pointsRollback);

        author.points += escrow.points;
        pointsRollback.updateStatus('completed', '积分回滚成功', null, 'system');
      }
    }

    question.reward.isEscrowed = false;
    await question.save();
    await author.save();

    return {
      question,
      rollbackTransactions,
      totalRolledBack: {
        money: reward.money,
        points: reward.points
      }
    };
  }

  async processWithdraw(userId, amount, paymentMethod, options = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (amount < this.config.minAmount) {
      throw new Error(`Minimum withdrawal amount is ${this.config.minAmount}`);
    }

    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdraws = await Transaction.aggregate([
      {
        $match: {
          fromUser: user._id,
          transactionType: 'withdraw',
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dailyTotal = dailyWithdraws[0]?.total || 0;
    if (dailyTotal + amount > this.config.maxDailyWithdraw) {
      throw new Error(`Daily withdrawal limit exceeded. Remaining: ${(this.config.maxDailyWithdraw - dailyTotal).toFixed(2)}`);
    }

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyWithdraws = await Transaction.aggregate([
      {
        $match: {
          fromUser: user._id,
          transactionType: 'withdraw',
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyTotal = monthlyWithdraws[0]?.total || 0;
    if (monthlyTotal + amount > this.config.maxMonthlyWithdraw) {
      throw new Error(`Monthly withdrawal limit exceeded. Remaining: ${(this.config.maxMonthlyWithdraw - monthlyTotal).toFixed(2)}`);
    }

    const withdraw = new Transaction({
      transactionId: this.generateTransactionId(),
      transactionType: 'withdraw',
      status: 'processing',
      fromUser: user._id,
      toUser: null,
      amount: amount,
      currency: 'CNY',
      fee: 0,
      netAmount: amount,
      paymentMethod,
      metadata: {
        bankAccount: options.bankAccount,
        bankName: options.bankName,
        accountHolder: options.accountHolder
      },
      reason: `提现申请: ${amount.toFixed(2)} 元`
    });

    await withdraw.save();

    user.balance -= amount;
    await user.save();

    withdraw.addAudit('withdraw_requested', user._id, 'user', {
      originalBalance: user.balance + amount,
      newBalance: user.balance,
      paymentMethod
    });

    setTimeout(async () => {
      const tx = await Transaction.findById(withdraw._id);
      if (tx && tx.status === 'processing') {
        tx.updateStatus('completed', '提现成功', null, 'system');
        tx.processedAt = new Date();
        await tx.save();

        const notification = new Notification({
          notificationId: uuidv4(),
          recipient: user._id,
          notificationType: 'transaction_complete',
          priority: 'high',
          title: '提现成功',
          content: `您的提现申请已处理成功，金额 ${amount.toFixed(2)} 元已到账。`,
          data: { transactionId: tx.transactionId },
          channels: ['in_app', 'email'],
          source: 'system'
        });
        await notification.save();
      }
    }, 2000);

    return {
      transaction: withdraw,
      newBalance: user.balance,
      estimatedProcessingTime: '24小时内'
    };
  }

  async getUserTransactions(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      transactionType = null,
      status = null,
      startDate = null,
      endDate = null
    } = options;

    const query = {
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    };

    if (transactionType) {
      query.transactionType = transactionType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('fromUser', 'username profile.nickname')
      .populate('toUser', 'username profile.nickname');

    const total = await Transaction.countDocuments(query);

    return {
      transactions,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  async getUserBalance(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const pendingTransactions = await Transaction.find({
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ],
      status: 'processing'
    });

    const pendingIncoming = pendingTransactions
      .filter(t => t.toUser?.toString() === userId.toString())
      .reduce((sum, t) => sum + (t.netAmount || t.amount), 0);

    const pendingOutgoing = pendingTransactions
      .filter(t => t.fromUser?.toString() === userId.toString())
      .reduce((sum, t) => sum + (t.netAmount || t.amount), 0);

    return {
      userId: user._id,
      username: user.username,
      balance: user.balance,
      points: user.points,
      pending: {
        incoming: pendingIncoming,
        outgoing: pendingOutgoing
      },
      available: {
        balance: Math.max(0, user.balance - pendingOutgoing),
        points: user.points
      }
    };
  }

  async getTransactionStats(userId, options = {}) {
    const { startDate, endDate } = options;

    const matchQuery = {
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            transactionType: '$transactionType',
            status: '$status',
            currency: '$currency'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPoints: { $sum: '$points' },
          totalFee: { $sum: '$fee' }
        }
      }
    ]);

    const summary = {
      totalTransactions: stats.reduce((sum, s) => sum + s.count, 0),
      byType: {},
      byStatus: {},
      byCurrency: {}
    };

    for (const stat of stats) {
      const { transactionType, status, currency } = stat._id;

      if (!summary.byType[transactionType]) {
        summary.byType[transactionType] = { count: 0, amount: 0, points: 0 };
      }
      summary.byType[transactionType].count += stat.count;
      summary.byType[transactionType].amount += stat.totalAmount;
      summary.byType[transactionType].points += stat.totalPoints;

      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, amount: 0 };
      }
      summary.byStatus[status].count += stat.count;
      summary.byStatus[status].amount += stat.totalAmount;

      if (!summary.byCurrency[currency]) {
        summary.byCurrency[currency] = { count: 0, amount: 0, points: 0 };
      }
      summary.byCurrency[currency].count += stat.count;
      summary.byCurrency[currency].amount += stat.totalAmount;
      summary.byCurrency[currency].points += stat.totalPoints;
    }

    return summary;
  }
}

module.exports = RevenueSettlementEngine;
