const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, category_id, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, books) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '获取书籍列表失败'
        });
      }

      let countQuery = 'SELECT COUNT(*) as total FROM books WHERE 1=1';
      const countParams = [];

      if (category_id) {
        countQuery += ' AND category_id = ?';
        countParams.push(category_id);
      }

      if (search) {
        countQuery += ' AND (title LIKE ? OR author LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      db.get(countQuery, countParams, (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '获取总数失败'
          });
        }

        res.json({
          success: true,
          data: {
            books,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: result.total
            }
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/featured', (req, res) => {
  db.all('SELECT * FROM books WHERE is_featured = 1 ORDER BY created_at DESC LIMIT 12', (err, books) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取精选书籍失败'
      });
    }

    res.json({
      success: true,
      data: books
    });
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?', [id], (err, book) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取书籍详情失败'
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    res.json({
      success: true,
      data: book
    });
  });
});

router.post('/:id/borrow', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT * FROM books WHERE id = ?', [id], (err, book) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      if (!book) {
        db.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '书籍不存在'
        });
      }

      if (book.available_copies <= 0) {
        db.run('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '该书已被借完'
        });
      }

      db.get('SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?',
        [userId, id, 'borrowed'],
        (err, record) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              message: '数据库错误'
            });
          }

          if (record) {
            db.run('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: '您已借阅过该书'
            });
          }

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          db.run(
            'INSERT INTO borrow_records (user_id, book_id, due_date) VALUES (?, ?, ?)',
            [userId, id, dueDate.toISOString()],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({
                  success: false,
                  message: '借阅失败'
                });
              }

              db.run('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [id], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({
                    success: false,
                    message: '更新库存失败'
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
                    message: '借阅成功'
                  });
                });
              });
            }
          );
        }
      );
    });
  });
});

router.post('/:id/return', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?',
      [userId, id, 'borrowed'],
      (err, record) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({
            success: false,
            message: '数据库错误'
          });
        }

        if (!record) {
          db.run('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: '未找到借阅记录'
          });
        }

        db.run(
          'UPDATE borrow_records SET status = ?, return_date = CURRENT_TIMESTAMP WHERE id = ?',
          ['returned', record.id],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({
                success: false,
                message: '归还失败'
              });
            }

            db.run('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({
                  success: false,
                  message: '更新库存失败'
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
                  message: '归还成功'
                });
              });
            });
          }
        );
      }
    );
  });
});

router.get('/borrowed/my', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT br.*, b.title, b.author, b.cover 
    FROM borrow_records br 
    JOIN books b ON br.book_id = b.id 
    WHERE br.user_id = ? AND br.status = ?
    ORDER BY br.borrow_date DESC
  `, [userId, 'borrowed'], (err, records) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取借阅记录失败'
      });
    }

    res.json({
      success: true,
      data: records
    });
  });
});

router.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY sort_order ASC', (err, categories) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取分类失败'
      });
    }

    res.json({
      success: true,
      data: categories
    });
  });
});

module.exports = router;
