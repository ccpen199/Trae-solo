const integrityVerify = require('../engines/IntegrityVerify');
const escrowControl = require('../engines/EscrowControl');
const { AuditLog, User, Project, Bid, Registration } = require('../models');
const { Op } = require('sequelize');

exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      operationType, 
      userId, 
      resourceType, 
      riskLevel, 
      startDate, 
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    const where = {};
    if (operationType) {
      where.operationType = operationType;
    }
    if (userId) {
      where.userId = userId;
    }
    if (resourceType) {
      where.resourceType = resourceType;
    }
    if (riskLevel) {
      where.riskLevel = riskLevel;
    }
    if (startDate || endDate) {
      where.operationTime = {};
      if (startDate) {
        where.operationTime[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.operationTime[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'realName', 'role'] }
      ],
      order: [['operationTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        total: count,
        logs,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('获取审计日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志失败',
      error: error.message
    });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await AuditLog.findByPk(logId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'realName', 'role'] },
        { model: AuditLog, as: 'previousLog', attributes: ['id', 'operationType', 'operationTime', 'chainHash'] }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '审计日志不存在'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('获取审计日志详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志详情失败',
      error: error.message
    });
  }
};

exports.verifyChainIntegrity = async (req, res) => {
  try {
    const { startLogId } = req.query;

    const result = await integrityVerify.verifyChainIntegrity(startLogId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('验证链式完整性错误:', error);
    res.status(500).json({
      success: false,
      message: '验证链式完整性失败',
      error: error.message
    });
  }
};

exports.getBidTraceGraph = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await integrityVerify.getBidTraceGraph(projectId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取竞价轨迹图错误:', error);
    res.status(500).json({
      success: false,
      message: '获取竞价轨迹图失败',
      error: error.message
    });
  }
};

exports.getRiskAuditReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const result = await integrityVerify.getRiskAuditReport(start, end);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取风险审计报告错误:', error);
    res.status(500).json({
      success: false,
      message: '获取风险审计报告失败',
      error: error.message
    });
  }
};

exports.getOperationHistory = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    const result = await integrityVerify.getOperationHistory(resourceType, resourceId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取操作历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取操作历史失败',
      error: error.message
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await AuditLog.count({
      where: {
        operationTime: { [Op.gte]: today }
      }
    });

    const highRiskLogs = await AuditLog.count({
      where: {
        riskLevel: { [Op.in]: ['high', 'critical'] }
      }
    });

    const totalProjects = await Project.count();
    const activeProjects = await Project.count({
      where: {
        status: { [Op.in]: ['announcing', 'registration', 'bidding'] }
      }
    });

    const totalBidders = await User.count({
      where: { role: 'bidder' }
    });

    const depositStats = await escrowControl.getDepositStatistics();

    res.json({
      success: true,
      data: {
        todayLogs,
        highRiskLogs,
        totalProjects,
        activeProjects,
        totalBidders,
        depositStats
      }
    });
  } catch (error) {
    console.error('获取仪表板统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

exports.getHighRiskLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const logs = await AuditLog.findAll({
      where: {
        riskLevel: { [Op.in]: ['high', 'critical'] }
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'realName', 'role'] }
      ],
      order: [['operationTime', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('获取高风险日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取高风险日志失败',
      error: error.message
    });
  }
};

exports.verifyAllSignatures = async (req, res) => {
  try {
    const bids = await Bid.findAll();
    const results = [];

    for (const bid of bids) {
      try {
        const verifyResult = await integrityVerify.verifyBidSignature(bid.id);
        results.push({
          bidId: bid.id,
          bidNumber: bid.bidNumber,
          isValid: verifyResult.isValid
        });
      } catch (err) {
        results.push({
          bidId: bid.id,
          bidNumber: bid.bidNumber,
          isValid: false,
          error: err.message
        });
      }
    }

    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;

    res.json({
      success: true,
      data: {
        total: results.length,
        valid: validCount,
        invalid: invalidCount,
        details: results
      }
    });
  } catch (error) {
    console.error('验证所有签名错误:', error);
    res.status(500).json({
      success: false,
      message: '验证签名失败',
      error: error.message
    });
  }
};
