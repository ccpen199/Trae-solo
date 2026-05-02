const { Op } = require('sequelize');
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Registration = require('../models/Registration');
const User = require('../models/User');
const bidSecurity = require('./BidSecurity');

class AuctionBid {
  constructor() {
    this.activeAuctions = new Map();
    this.priceFluctuationThreshold = 20;
    this.minBidIncrement = 100;
  }

  async placeBid(bidData) {
    const { projectId, bidderId, amount, registrationId } = bidData;

    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    if (project.status !== 'bidding') {
      throw new Error(`项目不在竞价阶段，当前状态: ${project.status}`);
    }

    const registration = await Registration.findByPk(registrationId);
    if (!registration) {
      throw new Error('报名记录不存在');
    }

    if (!registration.biddingRight) {
      throw new Error('没有竞价权限');
    }

    if (registration.depositStatus !== 'activated') {
      throw new Error('保证金未激活');
    }

    const lastBid = await this.getLastBid(projectId, bidderId);
    if (lastBid && amount <= parseFloat(lastBid.amount)) {
      throw new Error('出价必须高于上一次出价');
    }

    const currentHighestBid = await this.getCurrentHighestBid(projectId);
    if (currentHighestBid && amount <= parseFloat(currentHighestBid.amount)) {
      const minIncrement = this.calculateMinIncrement(parseFloat(currentHighestBid.amount));
      if (amount < parseFloat(currentHighestBid.amount) + minIncrement) {
        throw new Error(`出价至少需要增加 ${minIncrement} 元`);
      }
    }

    const priceFluctuation = await this.checkPriceFluctuation(projectId, amount);
    let status = 'normal';
    let abnormalReason = null;

    if (priceFluctuation.isAbnormal) {
      status = 'abnormal';
      abnormalReason = priceFluctuation.reason;
    }

    const bidNumber = bidSecurity.generateBidNumber();
    const bidTime = new Date();

    const signatureData = {
      projectId,
      bidderId,
      amount,
      bidTime: bidTime.getTime()
    };
    const { signature } = bidSecurity.generateBidSignature(signatureData);

    const bid = await Bid.create({
      projectId,
      bidderId,
      registrationId,
      bidNumber,
      amount,
      bidTime,
      status,
      abnormalReason,
      previousBidId: lastBid?.id,
      priceDifference: lastBid ? amount - parseFloat(lastBid.amount) : null,
      priceChangePercent: lastBid 
        ? ((amount - parseFloat(lastBid.amount)) / parseFloat(lastBid.amount) * 100).toFixed(2)
        : null,
      operationSignature: signature
    });

    await this.updateBidRanks(projectId);

    const bidResult = {
      success: true,
      bid: await this.formatBidWithRank(bid),
      isAbnormal: priceFluctuation.isAbnormal,
      abnormalReason: priceFluctuation.reason
    };

    return bidResult;
  }

  async checkPriceFluctuation(projectId, newAmount) {
    const recentBids = await Bid.findAll({
      where: {
        projectId,
        status: 'normal'
      },
      order: [['bidTime', 'DESC']],
      limit: 5
    });

    if (recentBids.length === 0) {
      return { isAbnormal: false };
    }

    const currentHighest = Math.max(...recentBids.map(b => parseFloat(b.amount)));
    const changePercent = ((newAmount - currentHighest) / currentHighest) * 100;

    if (changePercent > this.priceFluctuationThreshold) {
      return {
        isAbnormal: true,
        reason: `价格波动异常，涨幅超过 ${this.priceFluctuationThreshold}%，当前涨幅: ${changePercent.toFixed(2)}%`
      };
    }

    if (recentBids.length >= 2) {
      const timeDiff = recentBids[0].bidTime - recentBids[1].bidTime;
      if (timeDiff < 1000) {
        return {
          isAbnormal: true,
          reason: `出价频率异常，两次出价间隔仅 ${timeDiff}ms`
        };
      }
    }

    return { isAbnormal: false };
  }

  calculateMinIncrement(currentPrice) {
    if (currentPrice < 10000) return 100;
    if (currentPrice < 100000) return 500;
    if (currentPrice < 1000000) return 1000;
    return 5000;
  }

  async updateBidRanks(projectId) {
    const bids = await Bid.findAll({
      where: {
        projectId,
        status: { [Op.ne]: 'invalid' }
      },
      order: [['amount', 'DESC'], ['bidTime', 'ASC']]
    });

    for (let i = 0; i < bids.length; i++) {
      await bids[i].update({ rank: i + 1 });
    }
  }

  async getLastBid(projectId, bidderId) {
    return await Bid.findOne({
      where: {
        projectId,
        bidderId,
        status: { [Op.ne]: 'invalid' }
      },
      order: [['bidTime', 'DESC']]
    });
  }

  async getCurrentHighestBid(projectId) {
    return await Bid.findOne({
      where: {
        projectId,
        status: { [Op.ne]: 'invalid' }
      },
      order: [['amount', 'DESC'], ['bidTime', 'ASC']]
    });
  }

  async formatBidWithRank(bid) {
    const bidData = bid.toJSON();
    const allBids = await Bid.findAll({
      where: {
        projectId: bidData.projectId,
        status: { [Op.ne]: 'invalid' }
      },
      order: [['amount', 'DESC'], ['bidTime', 'ASC']]
    });

    const rank = allBids.findIndex(b => b.id === bidData.id) + 1;
    return { ...bidData, rank };
  }

  async getBidHistory(projectId, options = {}) {
    const { limit = 100, bidderId, includeAbnormal = false } = options;

    const where = { projectId };
    if (!includeAbnormal) {
      where.status = 'normal';
    }
    if (bidderId) {
      where.bidderId = bidderId;
    }

    const bids = await Bid.findAll({
      where,
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ],
      order: [['bidTime', 'DESC']],
      limit
    });

    return bids.map(bid => ({
      id: bid.id,
      bidNumber: bid.bidNumber,
      amount: bid.amount,
      rank: bid.rank,
      bidTime: bid.bidTime,
      status: bid.status,
      abnormalReason: bid.abnormalReason,
      bidder: bid.bidder ? {
        id: bid.bidder.id,
        username: bid.bidder.username,
        realName: bid.bidder.realName,
        organization: bid.bidder.organization
      } : null
    }));
  }

  async getBidStatistics(projectId) {
    const totalBids = await Bid.count({ where: { projectId } });
    const normalBids = await Bid.count({ where: { projectId, status: 'normal' } });
    const abnormalBids = await Bid.count({ where: { projectId, status: 'abnormal' } });

    const highestBid = await this.getCurrentHighestBid(projectId);
    const lowestBid = await Bid.findOne({
      where: { projectId, status: 'normal' },
      order: [['amount', 'ASC']]
    });

    const distinctBidders = await Bid.findAll({
      where: { projectId },
      attributes: ['bidderId'],
      group: ['bidderId']
    });

    return {
      projectId,
      totalBids,
      normalBids,
      abnormalBids,
      bidderCount: distinctBidders.length,
      highestBid: highestBid ? {
        amount: highestBid.amount,
        bidderId: highestBid.bidderId,
        bidTime: highestBid.bidTime
      } : null,
      lowestBid: lowestBid ? {
        amount: lowestBid.amount,
        bidderId: lowestBid.bidderId,
        bidTime: lowestBid.bidTime
      } : null
    };
  }

  async getAbnormalBids(projectId) {
    const bids = await Bid.findAll({
      where: {
        projectId,
        status: 'abnormal'
      },
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ],
      order: [['bidTime', 'DESC']]
    });

    return bids.map(bid => ({
      id: bid.id,
      bidNumber: bid.bidNumber,
      amount: bid.amount,
      bidTime: bid.bidTime,
      abnormalReason: bid.abnormalReason,
      bidder: bid.bidder
    }));
  }

  async endAuction(projectId) {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const highestBid = await this.getCurrentHighestBid(projectId);
    if (!highestBid) {
      throw new Error('没有有效出价，无法结束竞价');
    }

    await highestBid.update({ isWinningBid: true });

    const registration = await Registration.findOne({
      where: {
        projectId,
        bidderId: highestBid.bidderId
      }
    });

    if (registration) {
      await registration.update({ isWinner: true });
    }

    await project.update({
      status: 'completed',
      winningBidderId: highestBid.bidderId,
      winningAmount: highestBid.amount
    });

    return {
      success: true,
      projectId,
      winningBid: {
        id: highestBid.id,
        amount: highestBid.amount,
        bidderId: highestBid.bidderId,
        bidTime: highestBid.bidTime
      }
    };
  }

  async getRealTimeRanking(projectId) {
    const bids = await Bid.findAll({
      where: {
        projectId,
        status: { [Op.ne]: 'invalid' }
      },
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ],
      order: [['amount', 'DESC'], ['bidTime', 'ASC']]
    });

    return bids.map((bid, index) => ({
      rank: index + 1,
      bidder: bid.bidder,
      amount: bid.amount,
      bidTime: bid.bidTime,
      bidNumber: bid.bidNumber
    }));
  }
}

module.exports = new AuctionBid();
