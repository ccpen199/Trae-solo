const express = require('express');
const { Draft } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    let where = { userId: req.user.id };
    if (type) {
      where.type = type;
    }

    const drafts = await Draft.findAll({
      where,
      order: [['autoSavedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: drafts
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      message: '获取草稿失败'
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findOne({
      where: { id, userId: req.user.id }
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({
      success: false,
      message: '获取草稿失败'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, title, content, tags, categoryId } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: '请指定草稿类型'
      });
    }

    const draft = await Draft.create({
      type,
      title,
      content,
      tags,
      categoryId,
      userId: req.user.id,
      autoSavedAt: new Date()
    });

    res.json({
      success: true,
      message: '草稿已保存',
      data: draft
    });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({
      success: false,
      message: '保存草稿失败'
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findOne({
      where: { id, userId: req.user.id }
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    const { title, content, tags, categoryId } = req.body;
    if (title !== undefined) draft.title = title;
    if (content !== undefined) draft.content = content;
    if (tags !== undefined) draft.tags = tags;
    if (categoryId !== undefined) draft.categoryId = categoryId;
    draft.autoSavedAt = new Date();

    await draft.save();

    res.json({
      success: true,
      message: '草稿已更新',
      data: draft
    });
  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({
      success: false,
      message: '更新草稿失败'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findOne({
      where: { id, userId: req.user.id }
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    await draft.destroy();

    res.json({
      success: true,
      message: '草稿已删除'
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: '删除草稿失败'
    });
  }
});

module.exports = router;
