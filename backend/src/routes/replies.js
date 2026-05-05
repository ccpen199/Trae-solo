const express = require('express');
const { body, validationResult } = require('express-validator');
const { Reply, Topic, Board, User, sequelize } = require('../models');
const { requireAuth, isOwnerOrAdmin, isModerator } = require('../middleware/auth');
const logService = require('../services/logService');

const router = express.Router();

router.post('/', requireAuth, [
  body('content').trim().isLength({ min: 2 }).withMessage('回复内容至少2个字符'),
  body('topicId').notEmpty().withMessage('请指定回复的主题')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { content, topicId, parentReplyId } = req.body;

    const topic = await Topic.findByPk(topicId);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: '主题已被锁定，无法回复'
      });
    }

    let parentReply = null;
    if (parentReplyId) {
      parentReply = await Reply.findByPk(parentReplyId);
      if (!parentReply || !parentReply.isVisible) {
        return res.status(404).json({
          success: false,
          message: '要回复的内容不存在'
        });
      }
    }

    const transaction = await sequelize.transaction();

    try {
      const floor = await Reply.count({
        where: { topicId, isVisible: true, parentReplyId: null }
      });

      const reply = await Reply.create({
        content,
        topicId,
        boardId: topic.boardId,
        userId: req.user.id,
        username: req.user.username,
        parentReplyId: parentReplyId || null,
        parentReplyUserId: parentReply?.userId,
        parentReplyUsername: parentReply?.username,
        floor: parentReplyId ? 0 : floor + 1,
        ip: req.ip || req.connection?.remoteAddress
      }, { transaction });

      await Topic.update(
        {
          replyCount: sequelize.literal('"replyCount" + 1'),
          lastReplyId: reply.id,
          lastReplyUserId: reply.userId,
          lastReplyUsername: reply.username,
          lastReplyAt: new Date()
        },
        { where: { id: topicId }, transaction }
      );

      await Board.update(
        {
          replyCount: sequelize.literal('"replyCount" + 1'),
          lastReplyAt: new Date()
        },
        { where: { id: topic.boardId }, transaction }
      );

      await transaction.commit();

      await logService.logCreateReply(req, reply);

      const replyWithAuthor = await Reply.findByPk(reply.id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }]
      });

      res.json({
        success: true,
        message: '回复成功',
        data: replyWithAuthor
      });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('创建回复错误:', error);
    res.status(500).json({
      success: false,
      message: '回复失败，请稍后重试'
    });
  }
});

router.put('/:id', requireAuth, [
  body('content').optional().trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const reply = await Reply.findByPk(id, {
      include: [{ model: Topic, as: 'topic' }]
    });

    if (!reply || !reply.isVisible || reply.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '回复不存在或已被删除'
      });
    }

    if (!isOwnerOrAdmin(req, reply.userId) && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '无权编辑此回复'
      });
    }

    if (reply.topic?.status === 'locked' && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '主题已被锁定，无法编辑回复'
      });
    }

    if (content) {
      await reply.update({ content });
    }

    const updatedReply = await Reply.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    });

    res.json({
      success: true,
      message: '更新成功',
      data: updatedReply
    });
  } catch (error) {
    console.error('更新回复错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const reply = await Reply.findByPk(id, {
      include: [{ model: Topic, as: 'topic' }]
    });

    if (!reply || !reply.isVisible || reply.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '回复不存在或已被删除'
      });
    }

    if (!isOwnerOrAdmin(req, reply.userId) && !isModerator(req)) {
      return res.status(403).json({
        success: false,
        message: '无权删除此回复'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      await reply.update(
        { isVisible: false, status: 'deleted' },
        { transaction }
      );

      if (reply.topicId) {
        await Topic.update(
          { replyCount: sequelize.literal('GREATEST("replyCount" - 1, 0)') },
          { where: { id: reply.topicId }, transaction }
        );

        if (reply.boardId) {
          await Board.update(
            { replyCount: sequelize.literal('GREATEST("replyCount" - 1, 0)') },
            { where: { id: reply.boardId }, transaction }
          );
        }
      }

      await transaction.commit();

      await logService.logDeleteReply(req, reply);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('删除回复错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;
