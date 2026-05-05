const { query, getLastInsertId } = require('../config/database');

const getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT a.*, u.username as author_name, u.nickname as author_nickname
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.status = 'active'
       ORDER BY a.is_top DESC, a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM announcements WHERE status = $1',
      ['active']
    );

    res.json({
      announcements: result.rows,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取公告列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const announcementId = req.params.id;

    await query(
      'UPDATE announcements SET view_count = view_count + 1 WHERE id = $1',
      [announcementId]
    );

    const result = await query(
      `SELECT a.*, u.username as author_name, u.nickname as author_nickname
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [announcementId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '公告不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取公告详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, is_top } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '标题和内容为必填项' });
    }

    const isTopValue = is_top ? 1 : 0;

    await query(
      `INSERT INTO announcements (title, content, author_id, is_top, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [title, content, userId, isTopValue]
    );

    const announcementId = await getLastInsertId('announcements');
    const result = await query('SELECT * FROM announcements WHERE id = $1', [announcementId]);

    res.status(201).json({
      message: '公告发布成功',
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('创建公告错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;
    const { title, content, is_top, status } = req.body;

    const isTopValue = is_top !== undefined ? (is_top ? 1 : 0) : undefined;

    if (title && content && isTopValue !== undefined && status) {
      await query(
        `UPDATE announcements 
         SET title = $1, content = $2, is_top = $3, status = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5`,
        [title, content, isTopValue, status, announcementId]
      );
    } else {
      await query(
        `UPDATE announcements 
         SET title = COALESCE($1, title), 
             content = COALESCE($2, content), 
             is_top = COALESCE($3, is_top), 
             status = COALESCE($4, status), 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5`,
        [title, content, isTopValue, status, announcementId]
      );
    }

    const result = await query('SELECT * FROM announcements WHERE id = $1', [announcementId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '公告不存在' });
    }

    res.json({
      message: '公告更新成功',
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('更新公告错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;

    const result = await query('DELETE FROM announcements WHERE id = $1', [announcementId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '公告不存在' });
    }

    res.json({ message: '公告删除成功' });
  } catch (error) {
    console.error('删除公告错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
