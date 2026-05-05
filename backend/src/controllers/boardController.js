const { validationResult } = require('express-validator');
const store = require('../data/store');

const getAllBoards = async (req, res) => {
  try {
    const rootBoards = await store.boards.findAll({
      where: { parentId: null, status: 1 },
      order: [['sort', 'ASC'], ['created_at', 'DESC']],
      include: [
        { as: 'children' }
      ]
    });

    res.json({
      success: true,
      data: rootBoards
    });
  } catch (error) {
    console.error('获取版块列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    const board = await store.boards.findByPk(id, {
      include: [
        { as: 'parent' },
        { as: 'children' }
      ]
    });

    if (!board || board.status !== 1) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    const { count, rows: topics } = await store.topics.findAndCountAll({
      where: { boardId: parseInt(id) },
      order: [
        ['status', 'DESC'],
        ['created_at', 'DESC']
      ],
      include: [
        { as: 'author' }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    res.json({
      success: true,
      data: {
        board,
        topics: {
          list: topics,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取版块详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const createBoard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { name, description, parentId, sort } = req.body;

    if (parentId) {
      const parentBoard = await store.boards.findByPk(parentId);
      if (!parentBoard) {
        return res.status(404).json({
          success: false,
          message: '父版块不存在'
        });
      }
    }

    const board = await store.boards.create({
      name,
      description,
      parentId: parentId || null,
      sort: sort || 0
    });

    res.status(201).json({
      success: true,
      message: '版块创建成功',
      data: board
    });
  } catch (error) {
    console.error('创建版块错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getAllBoards,
  getBoardById,
  createBoard
};
