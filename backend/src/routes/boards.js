const express = require('express');
const { Op } = require('sequelize');
const { Board, Category, Topic, User } = require('../models');
const { requireRoleLevel, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { categoryId, parentId, includeChildren } = req.query;
    const where = { isVisible: true };
    
    if (categoryId) where.categoryId = categoryId;
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = { [Op.is]: null };
    }

    const include = [];
    if (includeChildren === 'true') {
      include.push({
        model: Board,
        as: 'children',
        where: { isVisible: true },
        required: false,
        order: [['sortOrder', 'ASC']]
      });
    }
    include.push({
      model: Category,
      as: 'category',
      attributes: ['id', 'name']
    });

    const boards = await Board.findAll({
      where,
      include,
      order: [['sortOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: boards
    });
  } catch (error) {
    console.error('获取版块列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findByPk(id, {
      where: { isVisible: true },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Board,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: Board,
          as: 'children',
          where: { isVisible: true },
          required: false,
          order: [['sortOrder', 'ASC']]
        }
      ]
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    if (!board.isPublic && !req.user) {
      return res.status(403).json({
        success: false,
        message: '该版块需要登录才能访问'
      });
    }

    res.json({
      success: true,
      data: board
    });
  } catch (error) {
    console.error('获取版块详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/:id/topics', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, sort = 'lastReply' } = req.query;
    
    const board = await Board.findByPk(id, {
      where: { isVisible: true }
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    if (!board.isPublic && !req.user) {
      return res.status(403).json({
        success: false,
        message: '该版块需要登录才能访问'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let order = [['lastReplyAt', 'DESC']];
    if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sort === 'hot') {
      order = [['replyCount', 'DESC'], ['viewCount', 'DESC']];
    }

    const where = {
      boardId: id,
      isVisible: true,
      status: { [Op.ne]: 'deleted' }
    };

    const topTopics = await Topic.findAll({
      where: {
        ...where,
        status: 'top'
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    const { count, rows: topics } = await Topic.findAndCountAll({
      where: {
        ...where,
        status: { [Op.ne]: 'top' }
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order,
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        board,
        topTopics,
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
    console.error('获取版块主题列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.post('/', requireRoleLevel(100), async (req, res) => {
  try {
    const { name, description, icon, categoryId, parentId, sortOrder, isPublic } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: '版块名称和所属分区不能为空'
      });
    }

    const board = await Board.create({
      name,
      description,
      icon,
      categoryId,
      parentId,
      sortOrder: sortOrder || 0,
      isPublic: isPublic !== false
    });

    res.json({
      success: true,
      message: '创建成功',
      data: board
    });
  } catch (error) {
    console.error('创建版块错误:', error);
    res.status(500).json({
      success: false,
      message: '创建失败'
    });
  }
});

router.put('/:id', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, categoryId, parentId, sortOrder, isPublic, isVisible } = req.body;

    const board = await Board.findByPk(id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (categoryId) updateData.categoryId = categoryId;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isVisible !== undefined) updateData.isVisible = isVisible;

    await board.update(updateData);

    res.json({
      success: true,
      message: '更新成功',
      data: board
    });
  } catch (error) {
    console.error('更新版块错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.delete('/:id', requireRoleLevel(100), async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findByPk(id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    const topicCount = await Topic.count({ where: { boardId: id } });
    if (topicCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该版块下还有主题，无法删除'
      });
    }

    const childCount = await Board.count({ where: { parentId: id } });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该版块下还有子版块，无法删除'
      });
    }

    await board.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除版块错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;
