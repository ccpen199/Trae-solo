const { validationResult } = require('express-validator');
const store = require('../data/store');

const createReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { content, topicId, parentId } = req.body;
    const userId = req.user.id;

    const topic = await store.topics.findByPk(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    const reply = await store.replies.create({
      content,
      topicId: parseInt(topicId),
      userId,
      parentId: parentId || null
    });

    const fullReply = {
      ...reply,
      author: {
        id: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar
      }
    };

    res.status(201).json({
      success: true,
      message: '回复成功',
      data: fullReply
    });
  } catch (error) {
    console.error('创建回复错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const getRepliesByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    const topic = await store.topics.findByPk(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    const { count, rows: replies } = await store.replies.findAndCountAll({
      where: { topicId: parseInt(topicId), status: 1 },
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
        list: replies,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取回复列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  createReply,
  getRepliesByTopic
};
