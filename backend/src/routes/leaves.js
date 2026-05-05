const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, requireStudent, LeaveStatus, LeaveType, Role } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function calculateDays(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.round(diffDays * 10) / 10;
}

async function findApprover(leaveDays, userDepartment, userClassId) {
  let approverRole;
  
  if (leaveDays <= 3) {
    approverRole = Role.CLASS_MONITOR;
  } else if (leaveDays <= 7) {
    approverRole = Role.TEACHER;
  } else {
    approverRole = Role.ADMIN;
  }

  let whereConditions = [];

  if (approverRole === Role.CLASS_MONITOR && userClassId) {
    whereConditions.push({
      role: approverRole,
      classId: userClassId
    });
    whereConditions.push({
      role: approverRole
    });
  } else if (userDepartment) {
    whereConditions.push({
      role: approverRole,
      department: userDepartment
    });
  }

  whereConditions.push({
    role: approverRole
  });

  whereConditions.push({
    role: Role.ADMIN
  });

  for (const where of whereConditions) {
    const approvers = await prisma.user.findMany({
      where
    });

    if (approvers.length > 0) {
      const randomIndex = Math.floor(Math.random() * approvers.length);
      return approvers[randomIndex];
    }
  }

  return null;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const user = req.user;

    let where = {};

    if (user.role === Role.STUDENT) {
      where.applicantId = user.id;
    } else {
      where.OR = [
        { approverId: user.id },
        { applicantId: user.id }
      ];
    }

    if (status) {
      where.status = status;
    }

    const total = await prisma.leave.count({ where });

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        parentLeave: {
          select: {
            id: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: {
        list: leaves,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/pending', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    const where = {
      OR: [
        { status: LeaveStatus.PENDING },
        { status: LeaveStatus.EXTENDING }
      ],
      approverId: req.user.id
    };

    const total = await prisma.leave.count({ where });

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: {
        list: leaves,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true,
            department: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        parentLeave: true,
        childLeaves: true
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (req.user.role === Role.STUDENT && leave.applicantId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此请假记录'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireStudent, async (req, res, next) => {
  try {
    const { leaveType, reason, startTime, endTime, attachmentUrl } = req.body;

    if (!reason || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的请假信息'
      });
    }

    const days = calculateDays(startTime, endTime);
    
    if (days <= 0) {
      return res.status(400).json({
        success: false,
        message: '请假结束时间必须晚于开始时间'
      });
    }

    const approver = await findApprover(days, req.user.department, req.user.classId);

    const leave = await prisma.leave.create({
      data: {
        applicantId: req.user.id,
        approverId: approver ? approver.id : null,
        leaveType: leaveType || LeaveType.PERSONAL,
        reason,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        days,
        status: LeaveStatus.PENDING,
        attachmentUrl
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '请假申请已提交',
      data: leave
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { leaveType, reason, startTime, endTime, attachmentUrl } = req.body;

    const leave = await prisma.leave.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (leave.applicantId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此请假申请'
      });
    }

    if (leave.status !== LeaveStatus.DRAFT && leave.status !== LeaveStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: '只有草稿或待审批状态的请假申请可以修改'
      });
    }

    let days = leave.days;
    let approverId = leave.approverId;

    if (startTime && endTime) {
      days = calculateDays(startTime, endTime);
      if (days <= 0) {
        return res.status(400).json({
          success: false,
          message: '请假结束时间必须晚于开始时间'
        });
      }
      const approver = await findApprover(days, req.user.department, req.user.classId);
      approverId = approver ? approver.id : null;
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        leaveType: leaveType || leave.leaveType,
        reason: reason || leave.reason,
        startTime: startTime ? new Date(startTime) : leave.startTime,
        endTime: endTime ? new Date(endTime) : leave.endTime,
        days,
        approverId,
        attachmentUrl: attachmentUrl || leave.attachmentUrl
      }
    });

    res.json({
      success: true,
      message: '请假申请已更新',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (leave.applicantId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此请假申请'
      });
    }

    if (leave.status === LeaveStatus.CANCELLED || leave.status === LeaveStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: '此请假申请无法取消'
      });
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED }
    });

    res.json({
      success: true,
      message: '请假申请已取消',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/extend', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, startTime, endTime } = req.body;

    const parentLeave = await prisma.leave.findUnique({
      where: { id }
    });

    if (!parentLeave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (parentLeave.applicantId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此请假申请'
      });
    }

    if (parentLeave.status !== LeaveStatus.APPROVED) {
      return res.status(400).json({
        success: false,
        message: '只有已审批通过的请假申请可以续假'
      });
    }

    const days = calculateDays(startTime, endTime);
    
    if (days <= 0) {
      return res.status(400).json({
        success: false,
        message: '续假结束时间必须晚于开始时间'
      });
    }

    const approver = await findApprover(days, req.user.department, req.user.classId);

    const extendLeave = await prisma.leave.create({
      data: {
        applicantId: req.user.id,
        approverId: approver ? approver.id : null,
        leaveType: parentLeave.leaveType,
        reason: reason || '续假申请',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        days,
        status: LeaveStatus.EXTENDING,
        parentLeaveId: id
      }
    });

    res.status(201).json({
      success: true,
      message: '续假申请已提交',
      data: extendLeave
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const leave = await prisma.leave.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (leave.approverId !== req.user.id && req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        message: '无权限审批此请假申请'
      });
    }

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.EXTENDING) {
      return res.status(400).json({
        success: false,
        message: '此请假申请无法审批'
      });
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approverId: req.user.id,
        approvalComment: comment
      }
    });

    res.json({
      success: true,
      message: '审批通过',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reject', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const leave = await prisma.leave.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (leave.approverId !== req.user.id && req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        message: '无权限审批此请假申请'
      });
    }

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.EXTENDING) {
      return res.status(400).json({
        success: false,
        message: '此请假申请无法审批'
      });
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approverId: req.user.id,
        approvalComment: comment
      }
    });

    res.json({
      success: true,
      message: '审批拒绝',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/checkin', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: '请假记录不存在'
      });
    }

    if (leave.approverId !== req.user.id && req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此请假申请'
      });
    }

    if (leave.status !== LeaveStatus.APPROVED) {
      return res.status(400).json({
        success: false,
        message: '只有已审批通过的请假申请可以销假'
      });
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.COMPLETED,
        checkInTime: new Date()
      }
    });

    res.json({
      success: true,
      message: '销假成功',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
