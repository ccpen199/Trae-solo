const db = require('../models/database');

const sendFriendRequest = async (req, res) => {
  try {
    const { toUserId, questionId, answerType, answerContent, voiceDuration } = req.body;
    const fromUserId = req.user.id;

    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: '请选择要添加的用户'
      });
    }

    if (fromUserId === parseInt(toUserId)) {
      return res.status(400).json({
        success: false,
        message: '不能添加自己为好友'
      });
    }

    const toUser = db.prepare('SELECT * FROM users WHERE id = ?').get(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const existingFriend = db.prepare(`
      SELECT * FROM friends 
      WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
    `).get(fromUserId, toUserId, toUserId, fromUserId);

    if (existingFriend) {
      return res.status(400).json({
        success: false,
        message: '已经是好友了'
      });
    }

    const existingRequest = db.prepare(`
      SELECT * FROM friend_requests 
      WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
    `).get(fromUserId, toUserId);

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: '已经发送过好友申请了'
      });
    }

    if (answerType === 'voice' && voiceDuration < 10) {
      return res.status(400).json({
        success: false,
        message: '语音回答时长不能少于10秒'
      });
    }

    const result = db.prepare(`
      INSERT INTO friend_requests 
      (from_user_id, to_user_id, question_id, answer_type, answer_content, voice_duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(fromUserId, toUserId, questionId, answerType, answerContent, voiceDuration);

    db.prepare(`
      INSERT INTO notifications (user_id, type, from_user_id, related_id)
      VALUES (?, 'friend_request', ?, ?)
    `).run(toUserId, fromUserId, result.lastInsertRowid);

    res.json({
      success: true,
      message: '好友申请已发送'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送好友申请失败'
    });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'received' } = req.query;

    let query;
    if (type === 'sent') {
      query = `
        SELECT fr.*, u.nickname, u.avatar
        FROM friend_requests fr
        JOIN users u ON fr.to_user_id = u.id
        WHERE fr.from_user_id = ?
        ORDER BY fr.created_at DESC
      `;
    } else {
      query = `
        SELECT fr.*, u.nickname, u.avatar
        FROM friend_requests fr
        JOIN users u ON fr.from_user_id = u.id
        WHERE fr.to_user_id = ?
        ORDER BY fr.created_at DESC
      `;
    }

    const requests = db.prepare(query).all(userId);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取好友申请失败'
    });
  }
};

const handleFriendRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const userId = req.user.id;

    const request = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '好友申请不存在'
      });
    }

    if (request.to_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限操作'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该好友申请已处理'
      });
    }

    if (action === 'accept') {
      db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run('accepted', requestId);

      db.prepare(`
        INSERT INTO friends (user_id_1, user_id_2)
        VALUES (?, ?)
      `).run(request.from_user_id, request.to_user_id);

      db.prepare(`
        INSERT INTO notifications (user_id, type, from_user_id)
        VALUES (?, 'friend_accepted', ?)
      `).run(request.from_user_id, userId);

      res.json({
        success: true,
        message: '已接受好友申请'
      });
    } else if (action === 'reject') {
      db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run('rejected', requestId);
      res.json({
        success: true,
        message: '已拒绝好友申请'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '无效的操作'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '处理好友申请失败'
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = db.prepare(`
      SELECT 
        u.id, u.nickname, u.avatar, u.gender, u.age, u.current_city as currentCity,
        f.created_at as friendSince
      FROM friends f
      JOIN users u ON (f.user_id_1 = u.id OR f.user_id_2 = u.id)
      WHERE (f.user_id_1 = ? OR f.user_id_2 = ?) AND u.id != ?
      ORDER BY f.created_at DESC
    `).all(userId, userId, userId);

    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取好友列表失败'
    });
  }
};

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  handleFriendRequest,
  getFriends
};
