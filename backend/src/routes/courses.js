const express = require('express');
const { success, error } = require('../utils/response');
const { getDB } = require('../config/database');
const { optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthMiddleware, (req, res) => {
  const db = getDB();
  const { page = 1, pageSize = 10, category } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = '';
    const params = [];
    
    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }

    db.all(`
      SELECT * FROM courses 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), parseInt(offset)], (err, courses) => {
      if (err) {
        console.error('Get courses error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }

      db.get(`SELECT COUNT(*) as total FROM courses ${whereClause}`, params, (err, countResult) => {
        if (err) {
          console.error('Get courses count error:', err);
          return res.status(500).json(error('获取失败，请稍后重试'));
        }

        courses.forEach(course => {
          if ((!req.user || req.user.is_vip !== 1) && !course.is_free) {
            delete course.video_url;
          }
        });

        res.json(success({
          list: courses,
          total: countResult.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }));
      });
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

router.get('/:id', optionalAuthMiddleware, (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    db.get('SELECT * FROM courses WHERE id = ?', [id], (err, course) => {
      if (err) {
        console.error('Get course detail error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }
      
      if (!course) {
        return res.status(404).json(error('课程不存在'));
      }

      if ((!req.user || req.user.is_vip !== 1) && !course.is_free) {
        delete course.video_url;
      }

      res.json(success(course));
    });
  } catch (err) {
    console.error('Get course detail error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

module.exports = router;
