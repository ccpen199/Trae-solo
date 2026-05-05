const { query, getLastInsertId } = require('../config/database');

const createMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, receiver_id, content, parent_id } = req.body;

    if (!content) {
      return res.status(400).json({ message: '留言内容为必填项' });
    }

    if (!product_id && !receiver_id) {
      return res.status(400).json({ message: '请指定商品或接收者' });
    }

    let receiverId = receiver_id;
    if (product_id && !receiver_id) {
      const productResult = await query(
        'SELECT user_id FROM products WHERE id = $1',
        [product_id]
      );
      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: '商品不存在' });
      }
      receiverId = productResult.rows[0].user_id;
    }

    if (userId === receiverId) {
      return res.status(400).json({ message: '不能给自己留言' });
    }

    await query(
      `INSERT INTO messages (product_id, sender_id, receiver_id, content, parent_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [product_id || null, userId, receiverId, content, parent_id || null]
    );

    const messageId = await getLastInsertId('messages');
    const messageResult = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
    const message = messageResult.rows[0];

    const senderResult = await query(
      'SELECT id, username, nickname, avatar FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      message: '留言成功',
      data: {
        ...message,
        sender: senderResult.rows[0]
      }
    });
  } catch (error) {
    console.error('创建留言错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getProductMessages = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT m.*, 
              u_sender.username as sender_username, 
              u_sender.nickname as sender_nickname, 
              u_sender.avatar as sender_avatar
       FROM messages m
       LEFT JOIN users u_sender ON m.sender_id = u_sender.id
       WHERE m.product_id = $1 AND m.parent_id IS NULL
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, parseInt(limit), offset]
    );

    const messagesWithReplies = [];
    for (const msg of result.rows) {
      const repliesResult = await query(
        `SELECT r.*, 
                u_sender.username as sender_username, 
                u_sender.nickname as sender_nickname, 
                u_sender.avatar as sender_avatar
         FROM messages r
         LEFT JOIN users u_sender ON r.sender_id = u_sender.id
         WHERE r.parent_id = $1
         ORDER BY r.created_at ASC`,
        [msg.id]
      );
      messagesWithReplies.push({
        ...msg,
        replies: repliesResult.rows
      });
    }

    const countResult = await query(
      'SELECT COUNT(*) as total FROM messages WHERE product_id = $1 AND parent_id IS NULL',
      [productId]
    );

    res.json({
      messages: messagesWithReplies,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取商品留言错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT m.*, 
              p.title as product_title, p.images as product_images,
              u_sender.username as sender_username, 
              u_sender.nickname as sender_nickname, 
              u_sender.avatar as sender_avatar
       FROM messages m
       LEFT JOIN products p ON m.product_id = p.id
       LEFT JOIN users u_sender ON m.sender_id = u_sender.id
       WHERE m.receiver_id = $1 OR m.sender_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM messages WHERE receiver_id = $1 OR sender_id = $1',
      [userId]
    );

    const messages = result.rows.map(m => {
      if (m.product_images) {
        try {
          m.product_images = JSON.parse(m.product_images);
        } catch {
          m.product_images = [];
        }
      }
      return m;
    });

    res.json({
      messages,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取我的留言错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    const result = await query(
      'UPDATE messages SET is_read = 1 WHERE id = $1 AND receiver_id = $2',
      [messageId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '消息不存在或无权限' });
    }

    res.json({ message: '已标记为已读' });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  createMessage,
  getProductMessages,
  getMyMessages,
  markAsRead
};
