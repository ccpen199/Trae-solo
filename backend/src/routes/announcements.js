const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireMonitor, AnnouncementType, Role } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type, targetClass, page = 1, pageSize = 10 } = req.query;
    const user = req.user;

    const where = {
      isPublished: true
    };

    if (type) {
      where.type = type;
    }

    if (targetClass) {
      where.targetClass = targetClass;
    } else if (user.classId) {
      where.OR = [
        { targetClass: null },
        { targetClass: user.classId }
      ];
    }

    const total = await prisma.announcement.count({ where });
    
    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: {
        list: announcements,
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

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    await prisma.announcement.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { title, content, type, targetClass, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || AnnouncementType.DEPARTMENT,
        targetClass,
        isPinned: isPinned || false,
        isPublished: true,
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
      message: '发布成功',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, type, targetClass, isPinned, isPublished } = req.body;

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    if (req.user.role !== Role.ADMIN && announcement.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此公告'
      });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        type,
        targetClass,
        isPinned,
        isPublished
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

    res.json({
      success: true,
      message: '更新成功',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireMonitor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    if (req.user.role !== Role.ADMIN && announcement.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此公告'
      });
    }

    await prisma.announcement.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
