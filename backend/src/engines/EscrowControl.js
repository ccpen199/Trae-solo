const { Op } = require('sequelize');
const Registration = require('../models/Registration');
const Project = require('../models/Project');
const User = require('../models/User');

class EscrowControl {
  constructor() {
    this.bankSimulation = new Map();
  }

  async lockDeposit(registrationId, amount) {
    const registration = await Registration.findByPk(registrationId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!registration) {
      throw new Error('报名记录不存在');
    }

    if (registration.depositStatus !== 'pending') {
      throw new Error(`保证金状态异常，当前状态: ${registration.depositStatus}`);
    }

    const bankTransactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    this.bankSimulation.set(bankTransactionId, {
      registrationId,
      amount,
      status: 'locked',
      lockedAt: new Date()
    });

    await registration.update({
      depositStatus: 'locked',
      depositLockedAt: new Date(),
      bankTransactionId
    });

    return {
      success: true,
      message: '保证金锁定成功',
      bankTransactionId,
      registrationId
    };
  }

  async activateBiddingRight(registrationId) {
    const registration = await Registration.findByPk(registrationId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!registration) {
      throw new Error('报名记录不存在');
    }

    if (registration.depositStatus !== 'locked') {
      throw new Error(`保证金未锁定，当前状态: ${registration.depositStatus}`);
    }

    if (registration.qualificationStatus !== 'approved') {
      throw new Error(`资格审核未通过，当前状态: ${registration.qualificationStatus}`);
    }

    await registration.update({
      depositStatus: 'activated',
      depositActivatedAt: new Date(),
      biddingRight: true
    });

    return {
      success: true,
      message: '竞价权已激活',
      biddingRight: true
    };
  }

  async refundDeposit(registrationId, reason = '未中标退回') {
    const registration = await Registration.findByPk(registrationId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!registration) {
      throw new Error('报名记录不存在');
    }

    if (registration.isWinner) {
      throw new Error('中标者保证金不予退回');
    }

    const validStatuses = ['activated', 'locked'];
    if (!validStatuses.includes(registration.depositStatus)) {
      throw new Error(`保证金状态不允许退回，当前状态: ${registration.depositStatus}`);
    }

    if (registration.bankTransactionId) {
      const bankRecord = this.bankSimulation.get(registration.bankTransactionId);
      if (bankRecord) {
        bankRecord.status = 'refunded';
        bankRecord.refundedAt = new Date();
        bankRecord.refundReason = reason;
      }
    }

    await registration.update({
      depositStatus: 'refunded',
      depositRefundedAt: new Date(),
      biddingRight: false
    });

    return {
      success: true,
      message: '保证金退回成功',
      refundReason: reason
    };
  }

  async deductDeposit(registrationId, reason = '履约保证金扣除') {
    const registration = await Registration.findByPk(registrationId);

    if (!registration) {
      throw new Error('报名记录不存在');
    }

    if (!registration.isWinner) {
      throw new Error('只有中标者才能扣除保证金');
    }

    await registration.update({
      depositStatus: 'deducted',
      biddingRight: false
    });

    return {
      success: true,
      message: '保证金扣除成功',
      reason
    };
  }

  async getDepositStatus(registrationId) {
    const registration = await Registration.findByPk(registrationId, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ]
    });

    if (!registration) {
      throw new Error('报名记录不存在');
    }

    const depositInfo = {
      registrationId: registration.id,
      registrationNumber: registration.registrationNumber,
      projectId: registration.projectId,
      projectName: registration.project?.name,
      bidder: {
        id: registration.bidder?.id,
        username: registration.bidder?.username,
        realName: registration.bidder?.realName,
        organization: registration.bidder?.organization
      },
      depositStatus: registration.depositStatus,
      biddingRight: registration.biddingRight,
      bankTransactionId: registration.bankTransactionId,
      depositLockedAt: registration.depositLockedAt,
      depositActivatedAt: registration.depositActivatedAt,
      depositRefundedAt: registration.depositRefundedAt
    };

    if (registration.bankTransactionId) {
      const bankRecord = this.bankSimulation.get(registration.bankTransactionId);
      if (bankRecord) {
        depositInfo.depositAmount = bankRecord.amount;
        depositInfo.bankStatus = bankRecord.status;
      }
    }

    return depositInfo;
  }

  async getProjectDepositStatus(projectId) {
    const registrations = await Registration.findAll({
      where: { projectId },
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ],
      order: [['registrationTime', 'DESC']]
    });

    const statusCount = {
      pending: 0,
      locked: 0,
      activated: 0,
      refunded: 0,
      deducted: 0
    };

    const depositList = registrations.map(reg => {
      statusCount[reg.depositStatus]++;
      return {
        registrationId: reg.id,
        registrationNumber: reg.registrationNumber,
        bidder: {
          id: reg.bidder?.id,
          username: reg.bidder?.username,
          realName: reg.bidder?.realName,
          organization: reg.bidder?.organization
        },
        depositStatus: reg.depositStatus,
        biddingRight: reg.biddingRight,
        isWinner: reg.isWinner,
        registrationTime: reg.registrationTime
      };
    });

    return {
      projectId,
      totalRegistrations: registrations.length,
      statusCount,
      depositList
    };
  }

  async getDepositStatistics() {
    const statusCounts = await Registration.findAll({
      attributes: [
        'depositStatus',
        [Registration.sequelize.fn('COUNT', Registration.sequelize.col('id')), 'count']
      ],
      group: ['depositStatus']
    });

    const statistics = {
      pending: 0,
      locked: 0,
      activated: 0,
      refunded: 0,
      deducted: 0,
      total: 0
    };

    statusCounts.forEach(item => {
      const status = item.dataValues.depositStatus;
      const count = parseInt(item.dataValues.count);
      statistics[status] = count;
      statistics.total += count;
    });

    return statistics;
  }
}

module.exports = new EscrowControl();
