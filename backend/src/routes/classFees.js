const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireMonitor, Role } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

async function getCurrentBalance(classId) {
  const lastRecord = await prisma.classFeeRecord.findFirst({
    where: { classId },
    orderBy: { createdAt: 'desc' }
  });
  return lastRecord ? lastRecord.balance : 0;
}

router.get('/', authenticate, async (req, res, next) => {
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

    const currentBalance = await getCurrentBalance(targetClassId);

    const stats = await prisma.classFeeRecord.aggregate({
      where: { classId: targetClassId },
      _sum: {
        amount: true
      }
    });

    const incomeRecords = await prisma.classFeeRecord.findMany({
      where: { classId: targetClassId, amount: { gt: 0 } }
    });
    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);

    const expenseRecords = await prisma.classFeeRecord.findMany({
      where: { classId: targetClassId, amount: { lt: 0 } }
    });
    const totalExpense = Math.abs(expenseRecords.reduce((sum, r) => sum + r.amount, 0));

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
          totalExpense
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { classId } = req.query;
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

    const currentBalance = await getCurrentBalance(targetClassId);

    const incomeRecords = await prisma.classFeeRecord.findMany({
      where: { classId: targetClassId, amount: { gt: 0 } }
    });
    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);

    const expenseRecords = await prisma.classFeeRecord.findMany({
      where: { classId: targetClassId, amount: { lt: 0 } }
    });
    const totalExpense = Math.abs(expenseRecords.reduce((sum, r) => sum + r.amount, 0));

    const recentRecords = await prisma.classFeeRecord.findMany({
      where: { classId: targetClassId },
      include: {
        operator: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        currentBalance,
        totalIncome,
        totalExpense,
        recentRecords
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.classFeeRecord.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '班费记录不存在'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
});

router.post('/income', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { classId, amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的收入金额'
      });
    }

    let targetClassId = classId;
    if (!targetClassId && req.user.classId) {
      targetClassId = req.user.classId;
    }

    if (!targetClassId) {
      return res.status(400).json({
        success: false,
        message: '请指定班级'
      });
    }

    const currentBalance = await getCurrentBalance(targetClassId);
    const newBalance = currentBalance + parseFloat(amount);

    const record = await prisma.classFeeRecord.create({
      data: {
        classId: targetClassId,
        amount: parseFloat(amount),
        type: 'INCOME',
        description: description || '班费收入',
        operatorId: req.user.id,
        balance: newBalance
      },
      include: {
        operator: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '收入记录已创建',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

router.post('/expense', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { classId, amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的支出金额'
      });
    }

    let targetClassId = classId;
    if (!targetClassId && req.user.classId) {
      targetClassId = req.user.classId;
    }

    if (!targetClassId) {
      return res.status(400).json({
        success: false,
        message: '请指定班级'
      });
    }

    const currentBalance = await getCurrentBalance(targetClassId);
    
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `班费余额不足，当前余额: ${currentBalance}`
      });
    }

    const newBalance = currentBalance - parseFloat(amount);

    const record = await prisma.classFeeRecord.create({
      data: {
        classId: targetClassId,
        amount: -parseFloat(amount),
        type: 'EXPENSE',
        description: description || '班费支出',
        operatorId: req.user.id,
        balance: newBalance
      },
      include: {
        operator: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '支出记录已创建',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const record = await prisma.classFeeRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '班费记录不存在'
      });
    }

    if (record.operatorId !== req.user.id && req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此记录'
      });
    }

    const updated = await prisma.classFeeRecord.update({
      where: { id },
      data: { description }
    });

    res.json({
      success: true,
      message: '记录已更新',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.classFeeRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '班费记录不存在'
      });
    }

    if (req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以删除班费记录'
      });
    }

    await prisma.classFeeRecord.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '记录已删除'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
