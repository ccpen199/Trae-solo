const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, FeedbackStatus, Role } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, priority, page = 1, pageSize = 20 } = req.query;
    const user = req.user;

    let where = {};

    if (user.role === Role.STUDENT) {
      where.authorId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = parseInt(priority);
    }

    const total = await prisma.feedback.count({ where });

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true
          }
        },
        processor: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    const processedFeedbacks = feedbacks.map(fb => {
      const fbObj = { ...fb };
      if (fb.isAnonymous && user.role === Role.STUDENT) {
        fbObj.author = null;
      }
      return fbObj;
    });

    res.json({
      success: true,
      data: {
        list: processedFeedbacks,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const pending = await prisma.feedback.count({
      where: { status: FeedbackStatus.PENDING }
    });
    
    const processing = await prisma.feedback.count({
      where: { status: FeedbackStatus.PROCESSING }
    });
    
    const resolved = await prisma.feedback.count({
      where: { status: FeedbackStatus.RESOLVED }
    });
    
    const closed = await prisma.feedback.count({
      where: { status: FeedbackStatus.CLOSED }
    });

    const total = pending + processing + resolved + closed;

    res.json({
      success: true,
      data: {
        total,
        pending,
        processing,
        resolved,
        closed
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true,
            department: true
          }
        },
        processor: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '反馈记录不存在'
      });
    }

    if (req.user.role === Role.STUDENT && feedback.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此反馈'
      });
    }

    if (feedback.isAnonymous && req.user.role === Role.STUDENT) {
      feedback.author = null;
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, content, priority, isAnonymous } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的反馈信息'
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        title,
        content,
        priority: priority || 1,
        isAnonymous: isAnonymous || false,
        status: FeedbackStatus.PENDING,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '反馈已提交',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, priority, isAnonymous } = req.body;

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '反馈记录不存在'
      });
    }

    if (feedback.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此反馈'
      });
    }

    if (feedback.status !== FeedbackStatus.PENDING && feedback.status !== FeedbackStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        message: '此反馈已处理，无法修改'
      });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        title: title || feedback.title,
        content: content || feedback.content,
        priority: priority !== undefined ? priority : feedback.priority,
        isAnonymous: isAnonymous !== undefined ? isAnonymous : feedback.isAnonymous
      }
    });

    res.json({
      success: true,
      message: '反馈已更新',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/process', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '反馈记录不存在'
      });
    }

    const validStatuses = [FeedbackStatus.PROCESSING, FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        status: status || FeedbackStatus.PROCESSING,
        processorId: req.user.id,
        response: response || feedback.response,
        updatedAt: new Date()
      },
      include: {
        processor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '反馈已处理',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '反馈记录不存在'
      });
    }

    if (feedback.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此反馈'
      });
    }

    await prisma.feedback.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '反馈已删除'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
