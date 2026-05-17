const { db } = require('../models/database');

const updateProfile = (req, res) => {
  try {
    const userId = req.user.userId;
    const { nickname, avatar, bio } = req.body;

    db.prepare(`
      UPDATE users SET nickname = ?, avatar = ?, bio = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(nickname || '', avatar || '', bio || '', userId);

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
};

const getOrders = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(userId).count;

    const orders = db.prepare(`
      SELECT o.*, c.title, c.cover
      FROM orders o
      JOIN courses c ON o.course_id = c.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: orders,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
};

const getMessages = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10, type } = req.query;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM messages WHERE user_id = ?';
    const params = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    const countQuery = query;
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const messages = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        list: messages,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: '获取消息失败' });
  }
};

const markMessageRead = (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?').run(messageId, userId);

    res.json({ success: true, message: '标记成功' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

const getStudyMaterials = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM course_materials cm
      JOIN user_courses uc ON cm.course_id = uc.course_id
      WHERE uc.user_id = ?
    `).get(userId).count;

    const materials = db.prepare(`
      SELECT cm.*, c.title as course_title
      FROM course_materials cm
      JOIN user_courses uc ON cm.course_id = uc.course_id
      JOIN courses c ON cm.course_id = c.id
      WHERE uc.user_id = ?
      ORDER BY cm.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: materials,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get study materials error:', error);
    res.status(500).json({ success: false, message: '获取学习资料失败' });
  }
};

module.exports = {
  updateProfile,
  getOrders,
  getMessages,
  markMessageRead,
  getStudyMaterials
};
