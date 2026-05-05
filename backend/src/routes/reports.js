const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, LeaveStatus, Role } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/leaves', authenticate, async (req, res, next) => {
  try {
    const { studentId, status, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const user = req.user;

    let where = {};

    if (user.role === Role.STUDENT) {
      where.applicantId = user.id;
    } else if (studentId) {
      where.applicantId = studentId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.OR = [
        {
          startTime: {}
        },
        {
          endTime: {}
        }
      ];
      if (startDate) {
        where.OR[0].startTime.gte = new Date(startDate);
        where.OR[1].endTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.OR[0].startTime.lte = new Date(endDate + 'T23:59:59');
        where.OR[1].endTime.lte = new Date(endDate + 'T23:59:59');
      }
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
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    const statusStats = {
      total,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    };

    leaves.forEach(leave => {
      if (leave.status === LeaveStatus.PENDING || leave.status === LeaveStatus.EXTENDING) {
        statusStats.pending++;
      } else if (leave.status === LeaveStatus.APPROVED) {
        statusStats.approved++;
      } else if (leave.status === LeaveStatus.REJECTED) {
        statusStats.rejected++;
      } else if (leave.status === LeaveStatus.COMPLETED) {
        statusStats.completed++;
      }
    });

    res.json({
      success: true,
      data: {
        list: leaves,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        stats: statusStats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/evaluations', authenticate, async (req, res, next) => {
  try {
    const { studentId, semester, page = 1, pageSize = 20 } = req.query;
    const user = req.user;

    let targetStudentId = studentId;
    if (user.role === Role.STUDENT || user.role === Role.CLASS_MONITOR) {
      targetStudentId = user.id;
    }

    if (!targetStudentId) {
      return res.status(400).json({
        success: false,
        message: '请指定学生ID'
      });
    }

    const where = {
      studentId: targetStudentId
    };

    if (semester) {
      where.semester = semester;
    }

    const total = await prisma.evaluation.count({ where });

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true
          }
        },
        evaluator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { semester: 'desc' },
        { type: 'asc' }
      ],
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    const semesters = await prisma.evaluation.findMany({
      where: { studentId: targetStudentId },
      distinct: ['semester'],
      select: { semester: true },
      orderBy: { semester: 'desc' }
    });

    const summary = {};
    for (const sem of semesters) {
      const semEvals = evaluations.filter(e => e.semester === sem.semester);
      const totalScore = semEvals.reduce((sum, e) => sum + e.score, 0);
      const totalMax = semEvals.reduce((sum, e) => sum + e.maxScore, 0);
      summary[sem.semester] = {
        totalScore,
        totalMax,
        average: totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0,
        count: semEvals.length
      };
    }

    res.json({
      success: true,
      data: {
        list: evaluations,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        semesters: semesters.map(s => s.semester),
        summary
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/class-fees', authenticate, async (req, res, next) => {
  try {
    const { classId, type, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const user = req.user;

    let targetClassId = classId;
    if (!targetClassId && (user.role === Role.STUDENT || user.role === Role.CLASS_MONITOR)) {
      targetClassId = user.classId;
    }

    if (!targetClassId) {
      return res.status(400).json({
        success: false,
        message: '请指定班级ID'
      });
    }

    const where = {
      classId: targetClassId
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59');
      }
    }

    const total = await prisma.classFeeRecord.count({ where });

    const records = await prisma.classFeeRecord.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    const allRecords = await prisma.classFeeRecord.findMany({
      where: { classId: targetClassId }
    });

    const totalIncome = allRecords
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = Math.abs(
      allRecords
        .filter(r => r.amount < 0)
        .reduce((sum, r) => sum + r.amount, 0)
    );
    const currentBalance = allRecords.length > 0 
      ? allRecords[allRecords.length - 1].balance 
      : 0;

    const monthlyStats = {};
    allRecords.forEach(record => {
      const month = record.createdAt.toISOString().substring(0, 7);
      if (!monthlyStats[month]) {
        monthlyStats[month] = { month, income: 0, expense: 0 };
      }
      if (record.amount > 0) {
        monthlyStats[month].income += record.amount;
      } else {
        monthlyStats[month].expense += Math.abs(record.amount);
      }
    });

    res.json({
      success: true,
      data: {
        list: records,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        summary: {
          currentBalance,
          totalIncome,
          totalExpense,
          transactionCount: allRecords.length
        },
        monthlyStats: Object.values(monthlyStats).sort((a, b) => b.month.localeCompare(a.month))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard-stats', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const pendingLeaves = await prisma.leave.count({
      where: {
        OR: [
          { status: LeaveStatus.PENDING },
          { status: LeaveStatus.EXTENDING }
        ],
        approverId: req.user.id
      }
    });

    const pendingFeedbacks = await prisma.feedback.count({
      where: { status: 'PENDING' }
    });

    const publishedAnnouncements = await prisma.announcement.count({
      where: { isPublished: true }
    });

    const totalStudents = await prisma.user.count({
      where: {
        OR: [
          { role: Role.STUDENT },
          { role: Role.CLASS_MONITOR }
        ]
      }
    });

    const recentLeaves = await prisma.leave.findMany({
      where: {
        OR: [
          { applicantId: req.user.id },
          { approverId: req.user.id }
        ]
      },
      include: {
        applicant: { select: { name: true } },
        approver: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentAnnouncements = await prisma.announcement.findMany({
      where: { isPublished: true },
      include: {
        author: { select: { name: true } }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    res.json({
      success: true,
      data: {
        pendingLeaves,
        pendingFeedbacks,
        publishedAnnouncements,
        totalStudents,
        recentLeaves,
        recentAnnouncements
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/student-dashboard', authenticate, async (req, res, next) => {
  try {
    const user = req.user;

    const myLeaves = await prisma.leave.count({
      where: { applicantId: user.id }
    });

    const myPendingLeaves = await prisma.leave.count({
      where: {
        applicantId: user.id,
        OR: [
          { status: LeaveStatus.PENDING },
          { status: LeaveStatus.EXTENDING }
        ]
      }
    });

    const myApprovedLeaves = await prisma.leave.count({
      where: {
        applicantId: user.id,
        status: LeaveStatus.APPROVED
      }
    });

    const myFeedbacks = await prisma.feedback.count({
      where: { authorId: user.id }
    });

    const myEvaluations = await prisma.evaluation.findMany({
      where: { studentId: user.id },
      orderBy: { semester: 'desc' }
    });

    const semesterGroups = {};
    myEvaluations.forEach(evalItem => {
      if (!semesterGroups[evalItem.semester]) {
        semesterGroups[evalItem.semester] = {
          semester: evalItem.semester,
          totalScore: 0,
          maxScore: 0,
          count: 0
        };
      }
      semesterGroups[evalItem.semester].totalScore += evalItem.score;
      semesterGroups[evalItem.semester].maxScore += evalItem.maxScore;
      semesterGroups[evalItem.semester].count++;
    });

    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetClass: null },
          { targetClass: user.classId }
        ]
      },
      include: {
        author: { select: { name: true } }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    const classFeeSummary = user.classId ? {
      currentBalance: 0,
      recentRecords: []
    } : null;

    if (user.classId) {
      const lastRecord = await prisma.classFeeRecord.findFirst({
        where: { classId: user.classId },
        orderBy: { createdAt: 'desc' }
      });

      if (lastRecord) {
        classFeeSummary.currentBalance = lastRecord.balance;
      }

      const recentFeeRecords = await prisma.classFeeRecord.findMany({
        where: { classId: user.classId },
        include: {
          operator: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      classFeeSummary.recentRecords = recentFeeRecords;
    }

    res.json({
      success: true,
      data: {
        leaveStats: {
          total: myLeaves,
          pending: myPendingLeaves,
          approved: myApprovedLeaves
        },
        feedbackStats: {
          total: myFeedbacks
        },
        evaluationSummary: Object.values(semesterGroups).map(sg => ({
          ...sg,
          average: sg.maxScore > 0 ? Math.round((sg.totalScore / sg.maxScore) * 1000) / 10 : 0
        })),
        recentAnnouncements,
        classFeeSummary
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
