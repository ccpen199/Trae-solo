const { Project, User, Registration, Bid } = require('../models');
const bidSecurity = require('../engines/BidSecurity');
const integrityVerify = require('../engines/IntegrityVerify');
const auctionBid = require('../engines/AuctionBid');
const escrowControl = require('../engines/EscrowControl');
const { Op } = require('sequelize');

exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      budget,
      deposit,
      depositAmount,
      registrationDeadline,
      registrationEndDate,
      biddingStartTime,
      biddingStartDate,
      biddingEndTime,
      biddingEndDate,
      branchCenter,
      location,
      category
    } = req.body;

    const projectNumber = bidSecurity.generateProjectNumber('XM');
    
    const actualDepositAmount = depositAmount || deposit || 5000;
    
    const now = new Date();
    const registrationDeadlineVal = registrationDeadline || registrationEndDate 
      ? new Date(registrationDeadline || registrationEndDate)
      : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const biddingStartTimeVal = biddingStartTime || biddingStartDate
      ? new Date(biddingStartTime || biddingStartDate)
      : new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    const biddingEndTimeVal = biddingEndTime || biddingEndDate
      ? new Date(biddingEndTime || biddingEndDate)
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const project = await Project.create({
      projectNumber,
      name,
      description,
      budget,
      depositAmount: actualDepositAmount,
      status: 'draft',
      registrationDeadline: registrationDeadlineVal,
      biddingStartTime: biddingStartTimeVal,
      biddingEndTime: biddingEndTimeVal,
      tendererId: req.user.id,
      branchCenter: branchCenter || location || '公共资源交易中心',
      category: category || '货物类'
    });

    await integrityVerify.logOperation({
      operationType: 'PROJECT_CREATE',
      operationName: '创建项目',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Project',
      resourceId: project.id,
      afterData: {
        id: project.id,
        projectNumber: project.projectNumber,
        name: project.name,
        status: project.status
      },
      description: `招标方创建项目: ${project.name}，编号: ${projectNumber}`
    }, req);

    res.status(201).json({
      success: true,
      message: '项目创建成功',
      data: project
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({
      success: false,
      message: '创建项目失败',
      error: error.message
    });
  }
};

exports.publishProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId, {
      include: [{ model: User, as: 'tenderer' }]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    if (project.tendererId !== req.user.id && req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: '无权限操作此项目'
      });
    }

    if (project.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `项目状态异常，当前状态: ${project.status}`
      });
    }

    const beforeData = {
      id: project.id,
      status: project.status
    };

    await project.update({
      status: 'announcing',
      announcementTime: new Date()
    });

    await integrityVerify.logOperation({
      operationType: 'PROJECT_PUBLISH',
      operationName: '发布项目公告',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Project',
      resourceId: project.id,
      beforeData,
      afterData: {
        id: project.id,
        status: project.status,
        announcementTime: project.announcementTime
      },
      description: `项目 ${project.name} 发布公告，状态变更为公告中`
    }, req);

    res.json({
      success: true,
      message: '项目发布成功，状态已置为公告中',
      data: project
    });
  } catch (error) {
    console.error('发布项目错误:', error);
    res.status(500).json({
      success: false,
      message: '发布项目失败',
      error: error.message
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { status, category, branchCenter, search } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (branchCenter) {
      where.branchCenter = branchCenter;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { projectNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    if (req.user.role === 'tenderer') {
      where.tendererId = req.user.id;
    }

    const projects = await Project.findAll({
      where,
      include: [
        { model: User, as: 'tenderer', attributes: ['id', 'username', 'realName', 'organization'] },
        { model: User, as: 'winningBidder', attributes: ['id', 'username', 'realName', 'organization'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'tenderer', attributes: ['id', 'username', 'realName', 'organization'] },
        { model: User, as: 'winningBidder', attributes: ['id', 'username', 'realName', 'organization'] },
        { 
          model: Registration, 
          as: 'registrations',
          include: [{ model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization'] }]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    const statistics = await auctionBid.getBidStatistics(projectId);

    res.json({
      success: true,
      data: {
        ...project.toJSON(),
        bidStatistics: statistics
      }
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
      error: error.message
    });
  }
};

exports.startBidding = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    if (project.status !== 'registration') {
      return res.status(400).json({
        success: false,
        message: `项目状态异常，当前状态: ${project.status}`
      });
    }

    const beforeData = {
      id: project.id,
      status: project.status
    };

    await project.update({
      status: 'bidding'
    });

    await integrityVerify.logOperation({
      operationType: 'PROJECT_START_BIDDING',
      operationName: '开始竞价',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Project',
      resourceId: project.id,
      beforeData,
      afterData: {
        id: project.id,
        status: 'bidding'
      },
      description: `项目 ${project.name} 开始竞价`
    }, req);

    res.json({
      success: true,
      message: '竞价已开始',
      data: project
    });
  } catch (error) {
    console.error('开始竞价错误:', error);
    res.status(500).json({
      success: false,
      message: '开始竞价失败',
      error: error.message
    });
  }
};

exports.endBidding = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await auctionBid.endAuction(projectId);

    const project = await Project.findByPk(projectId);

    const registrations = await Registration.findAll({
      where: { projectId, isWinner: false }
    });

    for (const registration of registrations) {
      try {
        await escrowControl.refundDeposit(registration.id, '未中标退回');
      } catch (err) {
        console.error(`退回保证金失败: ${registration.id}`, err);
      }
    }

    await integrityVerify.logOperation({
      operationType: 'PROJECT_END_BIDDING',
      operationName: '结束竞价',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Project',
      resourceId: projectId,
      afterData: {
        projectId,
        winningBid: result.winningBid,
        status: 'completed'
      },
      description: `项目竞价结束，中标者ID: ${result.winningBid.bidderId}，金额: ${result.winningBid.amount}`
    }, req);

    res.json({
      success: true,
      message: '竞价已结束，未中标者保证金已退回',
      data: {
        project,
        winningBid: result.winningBid
      }
    });
  } catch (error) {
    console.error('结束竞价错误:', error);
    res.status(500).json({
      success: false,
      message: '结束竞价失败',
      error: error.message
    });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    const validTransitions = {
      'draft': ['announcing'],
      'announcing': ['registration'],
      'registration': ['bidding'],
      'bidding': ['completed'],
      'completed': ['finished']
    };

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    if (!validTransitions[project.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `非法状态转换: ${project.status} -> ${status}`
      });
    }

    const beforeData = {
      id: project.id,
      status: project.status
    };

    await project.update({ status });

    await integrityVerify.logOperation({
      operationType: 'PROJECT_UPDATE_STATUS',
      operationName: '更新项目状态',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Project',
      resourceId: project.id,
      beforeData,
      afterData: {
        id: project.id,
        status: project.status
      },
      description: `项目状态更新: ${beforeData.status} -> ${status}`
    }, req);

    res.json({
      success: true,
      message: '状态更新成功',
      data: project
    });
  } catch (error) {
    console.error('更新项目状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新项目状态失败',
      error: error.message
    });
  }
};
