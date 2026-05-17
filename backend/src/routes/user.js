const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/wishlist', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT w.*, b.title, b.author, b.cover
    FROM wishlist w
    JOIN books b ON w.book_id = b.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `, [userId], (err, wishlist) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取心愿单失败'
      });
    }

    res.json({
      success: true,
      data: wishlist
    });
  });
});

router.post('/wishlist', authenticateToken, (req, res) => {
  const { book_id } = req.body;
  const userId = req.user.id;

  db.get('SELECT * FROM wishlist WHERE user_id = ? AND book_id = ?', [userId, book_id], (err, item) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '数据库错误'
      });
    }

    if (item) {
      return res.status(400).json({
        success: false,
        message: '已在心愿单中'
      });
    }

    db.run('INSERT INTO wishlist (user_id, book_id) VALUES (?, ?)', [userId, book_id], function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '添加心愿单失败'
        });
      }

      res.json({
        success: true,
        message: '添加成功',
        data: { id: this.lastID }
      });
    });
  });
});

router.delete('/wishlist/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM wishlist WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  });
});

router.get('/notes', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT n.*, b.title, b.cover
    FROM notes n
    JOIN books b ON n.book_id = b.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `, [userId], (err, notes) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取笔记失败'
      });
    }

    res.json({
      success: true,
      data: notes
    });
  });
});

router.post('/notes', authenticateToken, (req, res) => {
  const { book_id, content, page } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: '请输入笔记内容'
    });
  }

  db.run(
    'INSERT INTO notes (user_id, book_id, content, page) VALUES (?, ?, ?, ?)',
    [userId, book_id, content, page || null],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '添加笔记失败'
        });
      }

      res.json({
        success: true,
        message: '添加成功',
        data: { id: this.lastID }
      });
    }
  );
});

router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.serialize(() => {
    db.get('SELECT COUNT(*) as borrow_count FROM borrow_records WHERE user_id = ?', [userId], (err, borrowResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '获取统计失败'
        });
      }

      db.get('SELECT COUNT(*) as note_count FROM notes WHERE user_id = ?', [userId], (err, noteResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '获取统计失败'
          });
        }

        db.get('SELECT COUNT(*) as wishlist_count FROM wishlist WHERE user_id = ?', [userId], (err, wishlistResult) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: '获取统计失败'
            });
          }

          res.json({
            success: true,
            data: {
              borrow_count: borrowResult.borrow_count,
              note_count: noteResult.note_count,
              wishlist_count: wishlistResult.wishlist_count
            }
          });
        });
      });
    });
  });
});

module.exports = router;
