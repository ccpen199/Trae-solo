const express = require('express');
const { Op } = require('sequelize');
const { Category, Board } = require('../models');
const { requireRoleLevel } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isVisible: true },
      order: [['sortOrder', 'ASC']],
      include: [{
        model: Board,
        as: 'boards',
        where: { isVisible: true, parentId: { [Op.is]: null } },
        required: false,
        order: [['sortOrder', 'ASC']],
        include: [{
          model: Board,
          as: 'children',
          where: { isVisible: true },
          required: false,
          order: [['sortOrder', 'ASC']]
        }]
      }]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分区列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      where: { isVisible: true },
      include: [{
        model: Board,
        as: 'boards',
        where: { isVisible: true, parentId: { [Op.is]: null } },
        required: false,
        order: [['sortOrder', 'ASC']]
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分区不存在'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('获取分区详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.post('/', requireRoleLevel(100), async (req, res) => {
  try {
    const { name, description, icon, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分区名称不能为空'
      });
    }

    const category = await Category.create({
      name,
      description,
      icon,
      sortOrder: sortOrder || 0
    });

    res.json({
      success: true,
      message: '创建成功',
      data: category
    });
  } catch (error) {
    console.error('创建分区错误:', error);
    res.status(500).json({
      success: false,
      message: '创建失败'
    });
  }
});

router.put('/:id', requireRoleLevel(100), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sortOrder, isVisible } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分区不存在'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isVisible !== undefined) updateData.isVisible = isVisible;

    await category.update(updateData);

    res.json({
      success: true,
      message: '更新成功',
      data: category
    });
  } catch (error) {
    console.error('更新分区错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.delete('/:id', requireRoleLevel(100), async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分区不存在'
      });
    }

    const boardCount = await Board.count({ where: { categoryId: id } });
    if (boardCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该分区下还有版块，无法删除'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除分区错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;
