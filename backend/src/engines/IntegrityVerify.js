const AuditLog = require('../models/AuditLog');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Project = require('../models/Project');
const Registration = require('../models/Registration');
const bidSecurity = require('./BidSecurity');
const { Op } = require('sequelize');

class IntegrityVerify {
  constructor() {
    this.riskRules = {
      abnormalPriceFluctuation: { threshold: 20, level: 'high' },
      frequentBidding: { threshold: 5, timeWindow: 60000, level: 'medium' },
      sameIpMultipleBidders: { level: 'critical' },
      lateBid: { threshold: 300000, level: 'medium' },
      unusualBidPattern: { level: 'high' }
    };
  }

  async logOperation(operation, req = null) {
    const {
      operationType,
      operationName,
      userId,
      userRole,
      resourceType,
      resourceId,
      beforeData,
      afterData,
      description
    } = operation;

    const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';

    const timestamp = Date.now();
    const signatureData = {
      userId,
      operationType,
      resourceType,
      resourceId,
      beforeDataHash: beforeData ? bidSecurity.hash(beforeData) : null,
      afterDataHash: afterData ? bidSecurity.hash(afterData) : null,
      timestamp
    };

    const { signature } = bidSecurity.generateSignature(signatureData, timestamp);

    const lastLog = await AuditLog.findOne({
      order: [['createdAt', 'DESC']]
    });

    const chainHash = bidSecurity.generateChainHash(
      { ...signatureData, signature },
      lastLog?.chainHash
    );

    const riskLevel = await this.evaluateRisk(operation);

    const auditLog = await AuditLog.create({
      operationType,
      operationName,
      userId,
      userRole,
      resourceType,
      resourceId,
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
      operationDescription: description,
      ipAddress,
      userAgent,
      operationSignature: signature,
      previousLogId: lastLog?.id,
      chainHash,
      riskLevel: riskLevel.level,
      riskReason: riskLevel.reason,
      operationTime: new Date(timestamp)
    });

    return auditLog;
  }

  async evaluateRisk(operation) {
    const { operationType, resourceType, resourceId, userId, afterData } = operation;
    let riskLevel = 'low';
    let riskReason = null;

    if (operationType === 'BID_PLACE' && afterData) {
      const { amount, projectId, bidderId } = afterData;
      
      const recentBids = await Bid.findAll({
        where: {
          projectId,
          bidderId,
          bidTime: { [Op.gte]: new Date(Date.now() - 60000) }
        }
      });

      if (recentBids.length >= this.riskRules.frequentBidding.threshold) {
        riskLevel = 'medium';
        riskReason = `1分钟内出价 ${recentBids.length} 次，超过阈值`;
      }

      if (amount && parseFloat(amount) > 0) {
        const highestBid = await Bid.findOne({
          where: { projectId, status: 'normal' },
          order: [['amount', 'DESC']]
        });

        if (highestBid && parseFloat(highestBid.amount) > 0) {
          const changePercent = ((parseFloat(amount) - parseFloat(highestBid.amount)) / parseFloat(highestBid.amount)) * 100;
          if (changePercent > this.riskRules.abnormalPriceFluctuation.threshold) {
            riskLevel = 'high';
            riskReason = `价格涨幅异常: ${changePercent.toFixed(2)}%，超过阈值`;
          }
        }
      }
    }

    if (operationType === 'DEPOSIT_REFUND' && afterData?.refundReason) {
      if (!afterData.refundReason.includes('未中标')) {
        riskLevel = 'medium';
        riskReason = '非标准原因的保证金退回操作';
      }
    }

    if (operationType === 'PROJECT_UPDATE' && afterData?.status) {
      const validTransitions = {
        'draft': ['announcing'],
        'announcing': ['registration'],
        'registration': ['bidding'],
        'bidding': ['completed'],
        'completed': ['finished']
      };

      if (beforeData?.status && afterData.status) {
        if (!validTransitions[beforeData.status]?.includes(afterData.status)) {
          riskLevel = 'high';
          riskReason = `非法状态转换: ${beforeData.status} -> ${afterData.status}`;
        }
      }
    }

    return { level: riskLevel, reason: riskReason };
  }

  async verifyChainIntegrity(startLogId = null) {
    const where = {};
    if (startLogId) {
      where.id = { [Op.gte]: startLogId };
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'ASC']]
    });

    const inconsistencies = [];
    let previousChainHash = null;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      const signatureData = {
        userId: log.userId,
        operationType: log.operationType,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        beforeDataHash: log.beforeData ? bidSecurity.hash(JSON.parse(log.beforeData)) : null,
        afterDataHash: log.afterData ? bidSecurity.hash(JSON.parse(log.afterData)) : null,
        timestamp: log.operationTime.getTime()
      };

      const { signature } = bidSecurity.generateSignature(
        signatureData,
        log.operationTime.getTime()
      );

      if (signature !== log.operationSignature) {
        inconsistencies.push({
          logId: log.id,
          type: 'signature_mismatch',
          message: '操作签名不一致，数据可能被篡改',
          timestamp: log.operationTime
        });
      }

      const expectedChainHash = bidSecurity.generateChainHash(
        { ...signatureData, signature: log.operationSignature },
        previousChainHash
      );

      if (i > 0 && expectedChainHash !== log.chainHash) {
        inconsistencies.push({
          logId: log.id,
          type: 'chain_break',
          message: '链式哈希断裂，日志链可能被篡改',
          timestamp: log.operationTime
        });
      }

      previousChainHash = log.chainHash;
    }

    return {
      isIntegrity: inconsistencies.length === 0,
      inconsistencies,
      totalLogs: logs.length,
      verifiedAt: new Date()
    };
  }

  async getBidTraceGraph(projectId) {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const bids = await Bid.findAll({
      where: { projectId },
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ],
      order: [['bidTime', 'ASC']]
    });

    const nodes = [];
    const edges = [];
    const bidMap = new Map();

    bids.forEach((bid, index) => {
      const nodeId = `bid_${bid.id}`;
      bidMap.set(bid.id, nodeId);

      nodes.push({
        id: nodeId,
        type: 'bid',
        amount: parseFloat(bid.amount),
        rank: bid.rank,
        bidder: bid.bidder,
        bidTime: bid.bidTime,
        status: bid.status,
        abnormalReason: bid.abnormalReason,
        signature: bid.operationSignature
      });

      if (bid.previousBidId && bidMap.has(bid.previousBidId)) {
        edges.push({
          source: bidMap.get(bid.previousBidId),
          target: nodeId,
          type: 'succession',
          priceDifference: bid.priceDifference,
          priceChangePercent: bid.priceChangePercent
        });
      }
    });

    const bidders = new Set();
    bids.forEach(bid => {
      if (bid.bidderId) {
        bidders.add(bid.bidderId);
      }
    });

    const bidderTraces = [];
    bidders.forEach(bidderId => {
      const bidderBids = bids
        .filter(b => b.bidderId === bidderId)
        .sort((a, b) => new Date(a.bidTime) - new Date(b.bidTime));
      
      if (bidderBids.length > 0) {
        bidderTraces.push({
          bidder: bidderBids[0].bidder,
          bidCount: bidderBids.length,
          bids: bidderBids.map(b => ({
            id: b.id,
            amount: parseFloat(b.amount),
            bidTime: b.bidTime,
            status: b.status
          }))
        });
      }
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        projectNumber: project.projectNumber,
        status: project.status
      },
      nodes,
      edges,
      bidderTraces,
      totalBids: bids.length,
      verifiedAt: new Date()
    };
  }

  async getRiskAuditReport(startDate, endDate) {
    const where = {
      operationTime: {
        [Op.between]: [startDate, endDate]
      }
    };

    const logs = await AuditLog.findAll({
      where,
      order: [['operationTime', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'realName', 'role'] }
      ]
    });

    const riskSummary = {
      total: logs.length,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      byType: {},
      highRiskLogs: []
    };

    logs.forEach(log => {
      riskSummary[log.riskLevel]++;
      
      if (!riskSummary.byType[log.operationType]) {
        riskSummary.byType[log.operationType] = { total: 0, high: 0 };
      }
      riskSummary.byType[log.operationType].total++;
      
      if (['high', 'critical'].includes(log.riskLevel)) {
        riskSummary.byType[log.operationType].high++;
        riskSummary.highRiskLogs.push({
          id: log.id,
          operationType: log.operationType,
          operationName: log.operationName,
          riskLevel: log.riskLevel,
          riskReason: log.riskReason,
          user: log.user,
          operationTime: log.operationTime,
          resourceType: log.resourceType,
          resourceId: log.resourceId
        });
      }
    });

    return {
      period: { start: startDate, end: endDate },
      summary: riskSummary,
      generatedAt: new Date()
    };
  }

  async verifyBidSignature(bidId) {
    const bid = await Bid.findByPk(bidId);
    if (!bid) {
      throw new Error('出价记录不存在');
    }

    const signatureData = {
      projectId: bid.projectId,
      bidderId: bid.bidderId,
      amount: bid.amount,
      bidTime: bid.bidTime.getTime()
    };

    const { signature } = bidSecurity.generateBidSignature(signatureData);

    const isValid = signature === bid.operationSignature;

    return {
      isValid,
      bidId: bid.id,
      expectedSignature: signature,
      actualSignature: bid.operationSignature,
      verifiedAt: new Date()
    };
  }

  async getOperationHistory(resourceType, resourceId) {
    const logs = await AuditLog.findAll({
      where: {
        resourceType,
        resourceId
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'realName', 'role'] }
      ],
      order: [['operationTime', 'DESC']]
    });

    return logs.map(log => ({
      id: log.id,
      operationType: log.operationType,
      operationName: log.operationName,
      user: log.user,
      operationTime: log.operationTime,
      riskLevel: log.riskLevel,
      riskReason: log.riskReason,
      operationSignature: log.operationSignature,
      chainHash: log.chainHash
    }));
  }
}

module.exports = new IntegrityVerify();
