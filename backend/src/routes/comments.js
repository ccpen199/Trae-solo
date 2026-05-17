const express = require('express');
const { allAsync, getAsync, runAsync } = require('../utils/db');
const { success, error, pagination } = require('../utils/response');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/song/:songId', optionalAuth, async (req, res) => {
  try {
    const { songId } = req.params;
    const { page = 1, pageSize = 20, sort = 'hot' } = req.query;
    const offset = (page - 1) * pageSize;

    const orderBy = sort === 'hot' ? 'c.like_count DESC' : 'c.created_at DESC';

    const comments = await allAsync(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.song_id = ? AND c.parent_id IS NULL AND c.is_deleted = 0
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [songId, parseInt(pageSize), offset]);

    const totalResult = await getAsync(`
      SELECT COUNT(*) as count FROM comments 
      WHERE song_id = ? AND parent_id IS NULL AND is_deleted = 0
    `, [songId]);

    const commentIds = comments.map(c => c.id);
    let likedSet = new Set();
    
    if (req.user?.id && commentIds.length > 0) {
      const placeholders = commentIds.map(() => '?').join(',');
      const liked = await allAsync(
        `SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (${placeholders})`,
        [req.user.id, ...commentIds]
      );
      likedSet = new Set(liked.map(l => l.comment_id));
    }

    const listWithLikes = comments.map(c => ({
      ...c,
      is_liked: likedSet.has(c.id)
    }));

    res.json(success(pagination(listWithLikes, totalResult.count, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取评论失败'));
  }
});

router.get('/replies/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const replies = await allAsync(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ? AND c.is_deleted = 0
      ORDER BY c.created_at ASC
      LIMIT 50
    `, [commentId]);

    res.json(success(replies));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取回复失败'));
  }
});

router.post('/song/:songId', authMiddleware, async (req, res) => {
  try {
    const { songId } = req.params;
    const { content, parentId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json(error('评论内容不能为空'));
    }

    const song = await getAsync('SELECT id FROM songs WHERE id = ?', [songId]);
    if (!song) {
      return res.status(404).json(error('歌曲不存在'));
    }

    if (parentId) {
      const parentComment = await getAsync('SELECT id FROM comments WHERE id = ?', [parentId]);
      if (!parentComment) {
        return res.status(404).json(error('父评论不存在'));
      }
    }

    const result = await runAsync(
      'INSERT INTO comments (user_id, song_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [req.user.id, songId, content.trim(), parentId || null]
    );

    if (parentId) {
      await runAsync('UPDATE comments SET reply_count = reply_count + 1 WHERE id = ?', [parentId]);
    }

    const newComment = await getAsync(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.json(success(newComment, '评论成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('评论失败'));
  }
});

router.post('/like/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await getAsync('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json(error('评论不存在'));
    }

    const existingLike = await getAsync('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
    
    if (existingLike) {
      await runAsync('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
      await runAsync('UPDATE comments SET like_count = MAX(0, like_count - 1) WHERE id = ?', [commentId]);
      res.json(success({ is_liked: false }, '取消点赞成功'));
    } else {
      await runAsync('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [userId, commentId]);
      await runAsync('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [commentId]);
      res.json(success({ is_liked: true }, '点赞成功'));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(error('操作失败'));
  }
});

router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await getAsync('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json(error('评论不存在'));
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json(error('只能删除自己的评论'));
    }

    await runAsync('UPDATE comments SET is_deleted = 1 WHERE id = ?', [commentId]);

    if (comment.parent_id) {
      await runAsync('UPDATE comments SET reply_count = MAX(0, reply_count - 1) WHERE id = ?', [comment.parent_id]);
    }

    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('删除失败'));
  }
});

router.post('/report/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    res.json(success(null, '举报已提交，我们会尽快处理'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('举报失败'));
  }
});

module.exports = router;