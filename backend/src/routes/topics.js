const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Topic, Reply, Board, User, sequelize } = require('../models');
const { requireAuth, isOwnerOrAdmin, isModerator } = require('../middleware/auth');
const logService = require('../services/logService');
const { getCache } = require('../config/redis');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, sort = 'lastReply', boardId, userId, keyword } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const where = {
      isVisible: true,
      status: { [Op.ne]: 'deleted' }
    };

    if (boardId) where.boardId = boardId;
    if (userId) where.userId = userId;
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }

    let order = [['lastReplyAt', 'DESC']];
    if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sort === 'hot') {
      order = [['replyCount', 'DESC'], ['viewCount', 'DESC']];
    } else if (sort === 'views') {
      order = [['viewCount', 'DESC']];
    }

    const { count, rows: topics } = await Topic.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Board,
          as: 'board',
          attributes: ['id', 'name']
        }
      ],
      order,
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        topics,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取主题列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/hot', async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const topics = await Topic.findAll({
      where: {
        isVisible: true,
        status: { [Op.ne]: 'deleted' },
        createdAt: { [Op.gte]: daysAgo }
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [
        ['replyCount', 'DESC'],
        ['viewCount', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('获取热门主题错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topics = await Topic.findAll({
      where: {
        isVisible: true,
        status: { [Op.ne]: 'deleted' }
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Board,
          as: 'board',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('获取最新主题错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { incrementView = 'true' } = req.query;

    const topic = await Topic.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'signature', 'createdAt']
        },
        {
          model: Board,
          as: 'board',
          attributes: ['id', 'name', 'description', 'isPublic']
        }
      ]
    });

    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (!topic.board.isPublic && !req.user) {
      return res.status(403).json({
        success: false,
        message: '该主题需要登录才能访问'
      });
    }

    if (incrementView === 'true') {
      const cache = await getCache();
      const viewKey = `topic:${id}:views`;
      
      try {
        const cachedViews = await cache.get(viewKey);
        let newCount = cachedViews ? parseInt(cachedViews) + 1 : topic.viewCount + 1;
        await cache.set(viewKey, newCount.toString(), { EX: 60 });
        
        if (newCount % 10 === 0) {
          await topic.update({ viewCount: newCount });
        }
      } catch (cacheError) {
        await topic.increment('viewCount');
      }
    }

    res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error('获取主题详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, sort = 'asc' } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const topic = await Topic.findByPk(id, {
      attributes: ['id', 'title', 'replyCount']
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    const order = sort === 'desc' ? [['createdAt', 'DESC']] : [['createdAt', 'ASC']];

    const { count, rows: replies } = await Reply.findAndCountAll({
      where: {
        topicId: id,
        isVisible: true,
        status: 'normal',
        parentReplyId: { [Op.is]: null }
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'signature']
        },
        {
          model: Reply,
          as: 'children',
          where: { isVisible: true, status: 'normal' },
          required: false,
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar']
          }],
          order: [['createdAt', 'ASC']]
        }
      ],
      order,
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        topic,
        replies,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取主题回复错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('标题长度应为2-200个字符'),
  body('content').trim().isLength({ min: 10 }).withMessage('内容长度至少10个字符'),
  body('boardId').notEmpty().withMessage('请选择所属版块')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { title, content, boardId } = req.body;

    const board = await Board.findByPk(boardId);
    if (!board || !board.isVisible) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    if (!board.isPublic && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '该版块不允许普通用户发帖'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const topic = await Topic.create({
        title,
        content,
        boardId,
        userId: req.user.id,
        username: req.user.username,
        status: 'normal',
        lastReplyAt: new Date(),
        ip: req.ip || req.connection?.remoteAddress
      }, { transaction });

      await Board.update(
        {
          topicCount: sequelize.literal('"topicCount" + 1'),
          lastTopicId: topic.id,
          lastTopicTitle: topic.title,
          lastTopicUserId: topic.userId,
          lastTopicUsername: topic.username,
          lastReplyAt: new Date()
        },
        { where: { id: boardId }, transaction }
      );

      await transaction.commit();

      await logService.logCreateTopic(req, topic);

      res.json({
        success: true,
        message: '发帖成功',
        data: topic
      });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('创建主题错误:', error);
    res.status(500).json({
      success: false,
      message: '发帖失败，请稍后重试'
    });
  }
});

router.put('/:id', requireAuth, [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('content').optional().trim().isLength({ min: 10 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (!isOwnerOrAdmin(req, topic.userId) && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '无权编辑此主题'
      });
    }

    if (topic.status === 'locked' && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '主题已被锁定，无法编辑'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    await topic.update(updateData);

    await logService.logUpdateTopic(req, topic);

    res.json({
      success: true,
      message: '更新成功',
      data: topic
    });
  } catch (error) {
    console.error('更新主题错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (!isOwnerOrAdmin(req, topic.userId) && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '无权删除此主题'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      await topic.update(
        { isVisible: false, status: 'deleted' },
        { transaction }
      );

      await Board.update(
        { topicCount: sequelize.literal('GREATEST("topicCount" - 1, 0)') },
        { where: { id: topic.boardId }, transaction }
      );

      await Reply.update(
        { isVisible: false, status: 'deleted' },
        { where: { topicId: id }, transaction }
      );

      await transaction.commit();

      await logService.logDeleteTopic(req, topic);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('删除主题错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;
