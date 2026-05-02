const { Bid, Project, Registration, User } = require('../models');
const auctionBid = require('../engines/AuctionBid');
const integrityVerify = require('../engines/IntegrityVerify');
const { Op } = require('sequelize');

exports.placeBid = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { amount, registrationId } = req.body;
    const bidderId = req.user.id;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    if (project.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        message: `项目不在竞价阶段，当前状态: ${project.status}`
      });
    }

    const registration = await Registration.findByPk(registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    if (registration.bidderId !== bidderId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此报名记录'
      });
    }

    if (!registration.biddingRight) {
      return res.status(400).json({
        success: false,
        message: '未获得竞价权限，请先完成保证金锁定和资格审核'
      });
    }

    if (registration.depositStatus !== 'activated') {
      return res.status(400).json({
        success: false,
        message: `保证金未激活，当前状态: ${registration.depositStatus}`
      });
    }

    const result = await auctionBid.placeBid({
      projectId,
      bidderId,
      amount,
      registrationId
    });

    await integrityVerify.logOperation({
      operationType: 'BID_PLACE',
      operationName: '提交竞价',
      userId: bidderId,
      userRole: req.user.role,
      resourceType: 'Bid',
      resourceId: result.bid.id,
      afterData: {
        id: result.bid.id,
        bidNumber: result.bid.bidNumber,
        amount: result.bid.amount,
        projectId,
        status: result.bid.status
      },
      description: `竞买人提交竞价，金额: ${amount}，项目: ${projectId}，状态: ${result.isAbnormal ? '异常' : '正常'}`
    }, req);

    if (result.isAbnormal) {
      await integrityVerify.logOperation({
        operationType: 'ABNORMAL_BID_DETECTED',
        operationName: '异常竞价检测',
        userId: req.user.id,
        userRole: 'system',
        resourceType: 'Bid',
        resourceId: result.bid.id,
        afterData: {
          bidId: result.bid.id,
          amount,
          abnormalReason: result.abnormalReason
        },
        description: `检测到异常竞价: ${result.abnormalReason}`
      }, req);
    }

    res.status(201).json({
      success: true,
      message: result.isAbnormal 
        ? '竞价已提交，但存在异常，已推送监管' 
        : '竞价提交成功',
      data: {
        bid: result.bid,
        isAbnormal: result.isAbnormal,
        abnormalReason: result.abnormalReason
      }
    });
  } catch (error) {
    console.error('提交竞价错误:', error);
    res.status(500).json({
      success: false,
      message: '提交竞价失败',
      error: error.message
    });
  }
};

exports.getBidHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 100, includeAbnormal = false, bidderId } = req.query;

    const options = {
      limit: parseInt(limit),
      includeAbnormal: includeAbnormal === 'true',
      bidderId: bidderId || (req.user.role === 'bidder' ? req.user.id : undefined)
    };

    const bids = await auctionBid.getBidHistory(projectId, options);

    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('获取竞价历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取竞价历史失败',
      error: error.message
    });
  }
};

exports.getRealTimeRanking = async (req, res) => {
  try {
    const { projectId } = req.params;

    const ranking = await auctionBid.getRealTimeRanking(projectId);

    res.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('获取实时排名错误:', error);
    res.status(500).json({
      success: false,
      message: '获取实时排名失败',
      error: error.message
    });
  }
};

exports.getBidStatistics = async (req, res) => {
  try {
    const { projectId } = req.params;

    const statistics = await auctionBid.getBidStatistics(projectId);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('获取竞价统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取竞价统计失败',
      error: error.message
    });
  }
};

exports.getAbnormalBids = async (req, res) => {
  try {
    const { projectId } = req.params;

    const abnormalBids = await auctionBid.getAbnormalBids(projectId);

    res.json({
      success: true,
      data: abnormalBids
    });
  } catch (error) {
    console.error('获取异常竞价错误:', error);
    res.status(500).json({
      success: false,
      message: '获取异常竞价失败',
      error: error.message
    });
  }
};

exports.getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findByPk(bidId, {
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] },
        { model: Project, as: 'project' },
        { model: Registration, as: 'registration' }
      ]
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: '竞价记录不存在'
      });
    }

    res.json({
      success: true,
      data: bid
    });
  } catch (error) {
    console.error('获取竞价详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取竞价详情失败',
      error: error.message
    });
  }
};

exports.verifyBidSignature = async (req, res) => {
  try {
    const { bidId } = req.params;

    const result = await integrityVerify.verifyBidSignature(bidId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('验证竞价签名错误:', error);
    res.status(500).json({
      success: false,
      message: '验证竞价签名失败',
      error: error.message
    });
  }
};

exports.getMyBids = async (req, res) => {
  try {
    const bidderId = req.user.id;
    const { projectId, status } = req.query;

    const where = { bidderId };
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const bids = await Bid.findAll({
      where,
      include: [
        { model: Project, as: 'project' },
        { model: Registration, as: 'registration' }
      ],
      order: [['bidTime', 'DESC']]
    });

    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('获取我的竞价列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取竞价列表失败',
      error: error.message
    });
  }
};
