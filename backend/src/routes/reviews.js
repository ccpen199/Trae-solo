const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const getDb = () => new sqlite3.Database(dbPath);

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的令牌' });
  }
};

router.post('/', authenticate, (req, res) => {
  const { task_id, rating, comment, photos } = req.body;

  if (!task_id || !rating) {
    return res.status(400).json({ error: '任务ID和评分不能为空' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }

  const reviewerType = req.user.type;
  const db = getDb();

  db.get('SELECT * FROM tasks WHERE id = ?', [task_id], (err, task) => {
    if (err) {
      db.close();
      console.error('查询任务错误:', err);
      return res.status(500).json({ error: '创建评价失败' });
    }

    if (!task) {
      db.close();
      return res.status(404).json({ error: '任务不存在' });
    }

    db.get('SELECT * FROM reviews WHERE task_id = ? AND reviewer_type = ?', [task_id, reviewerType], (err, existingReview) => {
      if (err) {
        db.close();
        console.error('查询已存在评价错误:', err);
        return res.status(500).json({ error: '创建评价失败' });
      }

      if (existingReview) {
        db.close();
        return res.status(400).json({ error: '您已经评价过此任务' });
      }

      db.run(`
        INSERT INTO reviews (task_id, reviewer_id, reviewer_type, rating, comment, photos)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [task_id, req.user.id, reviewerType, rating, comment || '', photos || null], function(err) {
        if (err) {
          db.close();
          console.error('创建评价错误:', err);
          return res.status(500).json({ error: '创建评价失败' });
        }

        const reviewId = this.lastID;

        const afterInsert = () => {
          db.all('SELECT * FROM reviews WHERE task_id = ?', [task_id], (err, reviews) => {
            if (err) {
              db.close();
              console.error('查询评价列表错误:', err);
              return res.status(500).json({ error: '创建评价失败' });
            }

            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

            if (task.courier_id && reviewerType === 'client') {
              const ratingChange = rating >= 4 ? 1 : rating >= 3 ? 0 : -2;

              db.run('UPDATE couriers SET credit_score = MAX(0, MIN(100, credit_score + ?)) WHERE id = ?', [ratingChange, task.courier_id], (err) => {
                if (err) {
                  db.close();
                  console.error('更新骑手积分错误:', err);
                  return res.status(500).json({ error: '创建评价失败' });
                }

                finish(reviewId, avgRating);
              });
            } else {
              finish(reviewId, avgRating);
            }
          });
        };

        if (reviewerType === 'client') {
          db.run('UPDATE tasks SET status = ? WHERE id = ?', ['completed', task_id], (err) => {
            if (err) {
              db.close();
              console.error('更新任务状态错误:', err);
              return res.status(500).json({ error: '创建评价失败' });
            }

            db.run(`
              INSERT INTO task_status_history (task_id, status, operator_id, operator_type, note)
              VALUES (?, 'completed', ?, 'client', '客户已评价')
            `, [task_id, req.user.id], (err) => {
              if (err) {
                db.close();
                console.error('创建状态历史错误:', err);
                return res.status(500).json({ error: '创建评价失败' });
              }

              afterInsert();
            });
          });
        } else {
          afterInsert();
        }

        function finish(reviewId, avgRating) {
          db.get('SELECT * FROM reviews WHERE id = ?', [reviewId], (err, review) => {
            db.close();
            if (err) {
              console.error('查询评价错误:', err);
              return res.status(500).json({ error: '创建评价失败' });
            }

            res.json({ success: true, review, average_rating: avgRating });
          });
        }
      });
    });
  });
});

router.get('/task/:taskId', (req, res) => {
  const db = getDb();

  db.all('SELECT * FROM reviews WHERE task_id = ? ORDER BY created_at DESC', [req.params.taskId], (err, reviews) => {
    if (err) {
      db.close();
      console.error('查询评价列表错误:', err);
      return res.status(500).json({ error: '获取评价列表失败' });
    }

    const reviewsWithReviewer = [];
    let completed = 0;

    if (reviews.length === 0) {
      db.close();
      return res.json({ success: true, reviews: [] });
    }

    reviews.forEach((review, index) => {
      const reviewDb = getDb();
      let reviewer = null;

      if (review.reviewer_type === 'client') {
        reviewDb.get('SELECT id, phone, name FROM users WHERE id = ?', [review.reviewer_id], (err, reviewerData) => {
          reviewDb.close();
          if (err) {
            console.error('查询评价人错误:', err);
            return res.status(500).json({ error: '获取评价列表失败' });
          }

          reviewer = reviewerData;
          reviewsWithReviewer[index] = { ...review, reviewer };
          completed++;

          if (completed === reviews.length) {
            db.close();
            res.json({ success: true, reviews: reviewsWithReviewer });
          }
        });
      } else {
        reviewDb.get('SELECT id, phone, name FROM couriers WHERE id = ?', [review.reviewer_id], (err, reviewerData) => {
          reviewDb.close();
          if (err) {
            console.error('查询评价人错误:', err);
            return res.status(500).json({ error: '获取评价列表失败' });
          }

          reviewer = reviewerData;
          reviewsWithReviewer[index] = { ...review, reviewer };
          completed++;

          if (completed === reviews.length) {
            db.close();
            res.json({ success: true, reviews: reviewsWithReviewer });
          }
        });
      }
    });
  });
});

module.exports = router;
