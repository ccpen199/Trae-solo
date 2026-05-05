const { OperationLog } = require('../models');

async function logOperation(req, operationType, targetData = {}) {
  try {
    const log = await OperationLog.create({
      operationType,
      userId: req.user?.id,
      username: req.user?.username,
      targetType: targetData.targetType,
      targetId: targetData.targetId,
      targetName: targetData.targetName,
      detail: targetData.detail,
      ip: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });
    return log;
  } catch (error) {
    console.error('记录操作日志失败:', error);
    return null;
  }
}

const logCreateTopic = (req, topic) => logOperation(req, 'create_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title,
  detail: { boardId: topic.boardId }
});

const logUpdateTopic = (req, topic) => logOperation(req, 'update_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logDeleteTopic = (req, topic) => logOperation(req, 'delete_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logCreateReply = (req, reply) => logOperation(req, 'create_reply', {
  targetType: 'reply',
  targetId: reply.id,
  targetName: reply.topicId,
  detail: { topicId: reply.topicId, parentReplyId: reply.parentReplyId }
});

const logDeleteReply = (req, reply) => logOperation(req, 'delete_reply', {
  targetType: 'reply',
  targetId: reply.id,
  detail: { topicId: reply.topicId }
});

const logLockTopic = (req, topic) => logOperation(req, 'lock_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logUnlockTopic = (req, topic) => logOperation(req, 'unlock_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logTopTopic = (req, topic) => logOperation(req, 'top_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logUntopTopic = (req, topic) => logOperation(req, 'untop_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logHighlightTopic = (req, topic) => logOperation(req, 'highlight_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logUnhighlightTopic = (req, topic) => logOperation(req, 'unhighlight_topic', {
  targetType: 'topic',
  targetId: topic.id,
  targetName: topic.title
});

const logBanUser = (req, user, reason) => logOperation(req, 'ban_user', {
  targetType: 'user',
  targetId: user.id,
  targetName: user.username,
  detail: { reason }
});

const logUnbanUser = (req, user) => logOperation(req, 'unban_user', {
  targetType: 'user',
  targetId: user.id,
  targetName: user.username
});

const logLogin = (req, user) => logOperation(req, 'login', {
  targetType: 'user',
  targetId: user.id,
  targetName: user.username
});

const logLogout = (req) => logOperation(req, 'logout', {
  targetType: 'user',
  targetId: req.user?.id,
  targetName: req.user?.username
});

const logRegister = (req, user) => logOperation(req, 'register', {
  targetType: 'user',
  targetId: user.id,
  targetName: user.username
});

module.exports = {
  logOperation,
  logCreateTopic,
  logUpdateTopic,
  logDeleteTopic,
  logCreateReply,
  logDeleteReply,
  logLockTopic,
  logUnlockTopic,
  logTopTopic,
  logUntopTopic,
  logHighlightTopic,
  logUnhighlightTopic,
  logBanUser,
  logUnbanUser,
  logLogin,
  logLogout,
  logRegister
};
