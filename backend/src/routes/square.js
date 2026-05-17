const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  db.all(`
    SELECT p.*, u.avatar, u.nickname, b.title as book_title, b.cover as book_cover
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN books b ON p.book_id = b.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)], (err, posts) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取动态失败'
      });
    }

    res.json({
      success: true,
      data: posts
    });
  });
});

router.post('/posts', authenticateToken, (req, res) => {
  const { book_id, content, share_reason } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: '请输入分享内容'
    });
  }

  db.run(
    'INSERT INTO posts (user_id, book_id, content, share_reason) VALUES (?, ?, ?, ?)',
    [userId, book_id || null, content, share_reason || ''],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '分享失败'
        });
      }

      res.json({
        success: true,
        message: '分享成功',
        data: { id: this.lastID }
      });
    }
  );
});

router.post('/posts/:id/like', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [id, userId], (err, like) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      if (like) {
        db.run('DELETE FROM likes WHERE id = ?', [like.id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              message: '取消点赞失败'
            });
          }

          db.run('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({
                success: false,
                message: '更新点赞数失败'
              });
            }

            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({
                  success: false,
                  message: '事务提交失败'
                });
              }

              res.json({
                success: true,
                message: '取消点赞成功',
                data: { liked: false }
              });
            });
          });
        });
      } else {
        db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [id, userId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              message: '点赞失败'
            });
          }

          db.run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({
                success: false,
                message: '更新点赞数失败'
              });
            }

            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({
                  success: false,
                  message: '事务提交失败'
                });
              }

              res.json({
                success: true,
                message: '点赞成功',
                data: { liked: true }
              });
            });
          });
        });
      }
    });
  });
});

router.get('/posts/:id/comments', (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT c.*, u.avatar, u.nickname
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `, [id], (err, comments) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取评论失败'
      });
    }

    res.json({
      success: true,
      data: comments
    });
  });
});

router.post('/posts/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: '请输入评论内容'
    });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [id, userId, content],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({
            success: false,
            message: '评论失败'
          });
        }

        db.run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              message: '更新评论数失败'
            });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({
                success: false,
                message: '事务提交失败'
              });
            }

            res.json({
              success: true,
              message: '评论成功',
              data: { id: this.lastID }
            });
          });
        });
      }
    );
  });
});

router.get('/topics', (req, res) => {
  db.all('SELECT * FROM topics ORDER BY created_at DESC', (err, topics) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取话题失败'
      });
    }

    res.json({
      success: true,
      data: topics
    });
  });
});

module.exports = router;
