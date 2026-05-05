const { validationResult } = require('express-validator');
const store = require('../data/store');

const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    const topic = await store.topics.findByPk(id, {
      include: [
        { as: 'author' },
        { model: { name: 'Board' } }
      ]
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    await store.topics.increment('viewCount', { where: { id: parseInt(id) } });

    const { count, rows: replies } = await store.replies.findAndCountAll({
      where: { topicId: parseInt(id), status: 1 },
      order: [['created_at', 'ASC']],
      include: [
        { as: 'author' }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    res.json({
      success: true,
      data: {
        topic: {
          ...topic,
          viewCount: (topic.viewCount || 0) + 1
        },
        replies: {
          list: replies,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取主题详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const createTopic = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { title, content, boardId } = req.body;
    const userId = req.user.id;

    const board = await store.boards.findByPk(boardId);
    if (!board || board.status !== 1) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    const topic = await store.topics.create({
      title,
      content,
      boardId: parseInt(boardId),
      userId
    });

    const fullTopic = {
      ...topic,
      author: {
        id: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar
      }
    };

    res.status(201).json({
      success: true,
      message: '主题创建成功',
      data: fullTopic
    });
  } catch (error) {
    console.error('创建主题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const searchTopics = async (req, res) => {
  try {
    const { keyword, boardId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    const { count, rows: topics } = await store.topics.findAndCountAll({
      where: boardId ? { boardId: parseInt(boardId) } : {},
      order: [['created_at', 'DESC']],
      include: [
        { as: 'author' },
        { model: { name: 'Board' } }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    let filteredTopics = topics;
    let totalCount = count;
    
    if (keyword) {
      filteredTopics = topics.filter(t => 
        t.title.toLowerCase().includes(keyword.toLowerCase()) ||
        t.content.toLowerCase().includes(keyword.toLowerCase())
      );
      totalCount = filteredTopics.length;
    }

    res.json({
      success: true,
      data: {
        list: filteredTopics,
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    console.error('搜索主题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getTopicById,
  createTopic,
  searchTopics
};
