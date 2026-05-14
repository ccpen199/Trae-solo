const db = require('../config/database');
const { success, fail } = require('../utils/response');

const notificationController = {
  getList: (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const notifications = db.prepare(`
        SELECT n.*, u.nickname as actor_nickname, u.avatar as actor_avatar
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(limit), offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(req.user.id).count;
      const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

      res.json(success({ list: notifications, total, unread_count: unreadCount, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  markAsRead: (req, res) => {
    try {
      const { id } = req.params;
      
      if (id === 'all') {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
        res.json(success(null, '已全部标记为已读'));
      } else {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
        res.json(success(null, '已标记为已读'));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  },

  getUnreadCount: (req, res) => {
    try {
      const count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;
      res.json(success({ count }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  }
};

module.exports = notificationController;
