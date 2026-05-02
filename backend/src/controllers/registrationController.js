const { Registration, Project, User } = require('../models');
const bidSecurity = require('../engines/BidSecurity');
const escrowControl = require('../engines/EscrowControl');
const integrityVerify = require('../engines/IntegrityVerify');
const { Op } = require('sequelize');

exports.registerForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const bidderId = req.user.id;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    if (!['announcing', 'registration'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: `项目不在报名阶段，当前状态: ${project.status}`
      });
    }

    const now = new Date();
    if (now > new Date(project.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: '报名已截止'
      });
    }

    const existingRegistration = await Registration.findOne({
      where: { projectId, bidderId }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: '您已报名此项目'
      });
    }

    const registrationNumber = bidSecurity.generateRegistrationNumber();

    const registration = await Registration.create({
      projectId,
      bidderId,
      registrationNumber,
      depositStatus: 'pending',
      biddingRight: false,
      qualificationStatus: 'pending',
      isWinner: false
    });

    await integrityVerify.logOperation({
      operationType: 'REGISTRATION_CREATE',
      operationName: '报名项目',
      userId: bidderId,
      userRole: req.user.role,
      resourceType: 'Registration',
      resourceId: registration.id,
      afterData: {
        id: registration.id,
        registrationNumber: registration.registrationNumber,
        projectId,
        depositStatus: 'pending'
      },
      description: `竞买人报名项目 ${projectId}，报名编号: ${registrationNumber}`
    }, req);

    res.status(201).json({
      success: true,
      message: '报名成功，请锁定保证金',
      data: {
        registration,
        depositAmount: project.depositAmount
      }
    });
  } catch (error) {
    console.error('报名错误:', error);
    res.status(500).json({
      success: false,
      message: '报名失败',
      error: error.message
    });
  }
};

exports.lockDeposit = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findByPk(registrationId, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'bidder' }
      ]
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    if (registration.bidderId !== req.user.id && 
        !['supervisor', 'finance'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此报名记录'
      });
    }

    if (registration.depositStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `保证金状态异常，当前状态: ${registration.depositStatus}`
      });
    }

    const result = await escrowControl.lockDeposit(
      registrationId,
      registration.project.depositAmount
    );

    await integrityVerify.logOperation({
      operationType: 'DEPOSIT_LOCK',
      operationName: '锁定保证金',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Registration',
      resourceId: registrationId,
      beforeData: {
        depositStatus: 'pending'
      },
      afterData: {
        depositStatus: 'locked',
        bankTransactionId: result.bankTransactionId
      },
      description: `锁定保证金，金额: ${registration.project.depositAmount}，交易流水号: ${result.bankTransactionId}`
    }, req);

    res.json({
      success: true,
      message: '保证金锁定成功',
      data: {
        registration: await Registration.findByPk(registrationId),
        bankTransactionId: result.bankTransactionId
      }
    });
  } catch (error) {
    console.error('锁定保证金错误:', error);
    res.status(500).json({
      success: false,
      message: '锁定保证金失败',
      error: error.message
    });
  }
};

exports.activateBiddingRight = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findByPk(registrationId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    if (registration.qualificationStatus !== 'approved') {
      await registration.update({
        qualificationStatus: 'approved',
        qualificationApprovedBy: req.user.id,
        qualificationApprovedAt: new Date()
      });
    }

    const result = await escrowControl.activateBiddingRight(registrationId);

    await integrityVerify.logOperation({
      operationType: 'BIDDING_RIGHT_ACTIVATE',
      operationName: '激活竞价权',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Registration',
      resourceId: registrationId,
      beforeData: {
        depositStatus: registration.depositStatus,
        biddingRight: registration.biddingRight
      },
      afterData: {
        depositStatus: 'activated',
        biddingRight: true
      },
      description: `激活竞价权，报名ID: ${registrationId}`
    }, req);

    res.json({
      success: true,
      message: '竞价权已激活，可参与竞价',
      data: {
        registration: await Registration.findByPk(registrationId),
        biddingRight: result.biddingRight
      }
    });
  } catch (error) {
    console.error('激活竞价权错误:', error);
    res.status(500).json({
      success: false,
      message: '激活竞价权失败',
      error: error.message
    });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const bidderId = req.user.id;
    const { status, projectStatus } = req.query;

    const where = { bidderId };
    if (status) {
      where.depositStatus = status;
    }

    const include = [
      { 
        model: Project, 
        as: 'project',
        include: [
          { model: User, as: 'tenderer', attributes: ['id', 'username', 'realName', 'organization'] }
        ]
      }
    ];

    if (projectStatus) {
      include[0].where = { status: projectStatus };
    }

    const registrations = await Registration.findAll({
      where,
      include,
      order: [['registrationTime', 'DESC']]
    });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('获取我的报名列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报名列表失败',
      error: error.message
    });
  }
};

exports.getProjectRegistrations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { depositStatus, qualificationStatus } = req.query;

    const where = { projectId };
    if (depositStatus) {
      where.depositStatus = depositStatus;
    }
    if (qualificationStatus) {
      where.qualificationStatus = qualificationStatus;
    }

    const registrations = await Registration.findAll({
      where,
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'realName', 'organization', 'phone', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'username', 'realName'] }
      ],
      order: [['registrationTime', 'DESC']]
    });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('获取项目报名列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报名列表失败',
      error: error.message
    });
  }
};

exports.approveQualification = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { approved } = req.body;

    const registration = await Registration.findByPk(registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    const beforeData = {
      qualificationStatus: registration.qualificationStatus
    };

    await registration.update({
      qualificationStatus: approved ? 'approved' : 'rejected',
      qualificationApprovedBy: req.user.id,
      qualificationApprovedAt: new Date()
    });

    await integrityVerify.logOperation({
      operationType: 'QUALIFICATION_APPROVE',
      operationName: approved ? '资格审核通过' : '资格审核拒绝',
      userId: req.user.id,
      userRole: req.user.role,
      resourceType: 'Registration',
      resourceId: registrationId,
      beforeData,
      afterData: {
        qualificationStatus: approved ? 'approved' : 'rejected'
      },
      description: `资格审核${approved ? '通过' : '拒绝'}，报名ID: ${registrationId}`
    }, req);

    res.json({
      success: true,
      message: `资格审核${approved ? '通过' : '拒绝'}成功`,
      data: registration
    });
  } catch (error) {
    console.error('资格审核错误:', error);
    res.status(500).json({
      success: false,
      message: '资格审核失败',
      error: error.message
    });
  }
};

exports.getDepositStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const depositStatus = await escrowControl.getDepositStatus(registrationId);

    res.json({
      success: true,
      data: depositStatus
    });
  } catch (error) {
    console.error('获取保证金状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取保证金状态失败',
      error: error.message
    });
  }
};
