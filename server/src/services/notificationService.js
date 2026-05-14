const { Notification, User } = require('../models');

async function createNotification({ userId, type, actorId, data, link }) {
  try {
    if (actorId && userId === actorId) {
      return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      actorId,
      data,
      link
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

async function getUserNotifications(userId, { page = 1, pageSize = 20, unreadOnly = false } = {}) {
  try {
    const where = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
}

async function markAsRead(userId, notificationId) {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });
    
    if (notification) {
      notification.read = true;
      await notification.save();
    }
    
    return notification;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
}

async function markAllAsRead(userId) {
  try {
    await Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );
  } catch (error) {
    console.error('Mark all as read error:', error);
    throw error;
  }
}

async function getUnreadCount(userId) {
  try {
    return await Notification.count({
      where: { userId, read: false }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
