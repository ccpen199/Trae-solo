const { run, get, all } = require('../utils/db');
const { success, error, paginate } = require('../utils/response');

const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const existing = await get(
      'SELECT id FROM wishlist WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing) {
      return success(res, null, '已在心愿单中');
    }

    await run(
      'INSERT INTO wishlist (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );

    success(res, null, '添加成功');
  } catch (err) {
    console.error('添加心愿单错误:', err);
    error(res, '添加失败');
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    await run(
      'DELETE FROM wishlist WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    success(res, null, '移除成功');
  } catch (err) {
    console.error('移除心愿单错误:', err);
    error(res, '移除失败');
  }
};

const getWishlist = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const countResult = await get(
      'SELECT COUNT(*) as total FROM wishlist WHERE user_id = ?',
      [userId]
    );

    const wishlist = await all(
      `SELECT wl.*, b.title, b.author, b.cover, b.description, b.is_free, c.name as category
       FROM wishlist wl
       LEFT JOIN books b ON wl.book_id = b.id
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE wl.user_id = ?
       ORDER BY wl.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), parseInt(offset)]
    );

    paginate(res, wishlist, countResult.total, page, pageSize);
  } catch (err) {
    console.error('获取心愿单错误:', err);
    error(res, '获取失败');
  }
};

const checkWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return success(res, { inWishlist: false }, '获取成功');
    }

    const wishlist = await get(
      'SELECT id FROM wishlist WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    success(res, { inWishlist: !!wishlist }, '获取成功');
  } catch (err) {
    console.error('检查心愿单错误:', err);
    error(res, '获取失败');
  }
};

const addToCloudLibrary = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const existing = await get(
      'SELECT id FROM cloud_library WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing) {
      return success(res, null, '已在云书馆中');
    }

    await run(
      'INSERT INTO cloud_library (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );

    success(res, null, '添加成功');
  } catch (err) {
    console.error('添加云书馆错误:', err);
    error(res, '添加失败');
  }
};

const removeFromCloudLibrary = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    await run(
      'DELETE FROM cloud_library WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    success(res, null, '移除成功');
  } catch (err) {
    console.error('移除云书馆错误:', err);
    error(res, '移除失败');
  }
};

const getCloudLibrary = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const countResult = await get(
      'SELECT COUNT(*) as total FROM cloud_library WHERE user_id = ?',
      [userId]
    );

    const library = await all(
      `SELECT cl.*, b.title, b.author, b.cover, b.description, b.is_free, c.name as category
       FROM cloud_library cl
       LEFT JOIN books b ON cl.book_id = b.id
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE cl.user_id = ?
       ORDER BY cl.added_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), parseInt(offset)]
    );

    paginate(res, library, countResult.total, page, pageSize);
  } catch (err) {
    console.error('获取云书馆错误:', err);
    error(res, '获取失败');
  }
};

const getUserNotes = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const countResult = await get(
      'SELECT COUNT(*) as total FROM notes WHERE user_id = ?',
      [userId]
    );

    const notes = await all(
      `SELECT n.*, b.title as book_title, c.title as chapter_title
       FROM notes n
       LEFT JOIN books b ON n.book_id = b.id
       LEFT JOIN chapters c ON n.chapter_id = c.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), parseInt(offset)]
    );

    paginate(res, notes, countResult.total, page, pageSize);
  } catch (err) {
    console.error('获取用户笔记错误:', err);
    error(res, '获取失败');
  }
};

const getReadingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const borrowCount = await get(
      'SELECT COUNT(*) as count FROM borrow_records WHERE user_id = ?',
      [userId]
    );

    const readMinutes = await get(
      `SELECT COUNT(*) * 30 as minutes 
       FROM reading_progress 
       WHERE user_id = ? AND progress > 0`,
      [userId]
    );

    const noteCount = await get(
      'SELECT COUNT(*) as count FROM notes WHERE user_id = ?',
      [userId]
    );

    const bookmarkCount = await get(
      'SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?',
      [userId]
    );

    success(res, {
      borrowCount: borrowCount.count,
      readMinutes: readMinutes.minutes,
      noteCount: noteCount.count,
      bookmarkCount: bookmarkCount.count
    }, '获取成功');
  } catch (err) {
    console.error('获取阅读统计错误:', err);
    error(res, '获取失败');
  }
};

const getMessages = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const countResult = await get(
      'SELECT COUNT(*) as total FROM messages WHERE user_id = ?',
      [userId]
    );

    const messages = await all(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(pageSize), parseInt(offset)]
    );

    paginate(res, messages, countResult.total, page, pageSize);
  } catch (err) {
    console.error('获取消息错误:', err);
    error(res, '获取失败');
  }
};

const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await run(
      'UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    success(res, null, '标记成功');
  } catch (err) {
    console.error('标记消息已读错误:', err);
    error(res, '标记失败');
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await all(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    success(res, { tasks }, '获取成功');
  } catch (err) {
    console.error('获取任务错误:', err);
    error(res, '获取失败');
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const userId = req.user.id;

    const updateFields = [];
    const params = [];

    if (nickname) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }

    if (avatar) {
      updateFields.push('avatar = ?');
      params.push(avatar);
    }

    if (updateFields.length > 0) {
      params.push(userId);
      await run(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
    }

    const user = await get(
      'SELECT id, username, phone, nickname, avatar, is_vip, vip_expire_at FROM users WHERE id = ?',
      [userId]
    );

    success(res, { user }, '更新成功');
  } catch (err) {
    console.error('更新资料错误:', err);
    error(res, '更新失败');
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  addToCloudLibrary,
  removeFromCloudLibrary,
  getCloudLibrary,
  getUserNotes,
  getReadingStats,
  getMessages,
  markMessageRead,
  getTasks,
  updateProfile
};
