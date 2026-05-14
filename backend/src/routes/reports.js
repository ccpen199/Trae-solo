const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, error, notFound, serverError } = require('../utils/response');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  try {
    const { target_type, target_id, reason, reason_category = 'other' } = req.body;

    if (!target_type || !target_id || !reason) {
      return error(res, '请填写完整举报信息');
    }

    const validTypes = ['bar', 'post', 'comment', 'user'];
    if (!validTypes.includes(target_type)) {
      return error(res, '无效的举报类型');
    }

    let targetExists = false;
    if (target_type === 'bar') {
      targetExists = !!db.prepare('SELECT id FROM product_bars WHERE id = ?').get(target_id);
    } else if (target_type === 'post') {
      targetExists = !!db.prepare('SELECT id FROM posts WHERE id = ?').get(target_id);
    } else if (target_type === 'comment') {
      targetExists = !!db.prepare('SELECT id FROM comments WHERE id = ?').get(target_id);
    } else if (target_type === 'user') {
      targetExists = !!db.prepare('SELECT id FROM users WHERE id = ?').get(target_id);
    }

    if (!targetExists) {
      return notFound(res, '举报目标不存在');
    }

    if (reason.length < 5) {
      return error(res, '举报理由请至少填写5个字符');
    }

    db.prepare(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, reason_category)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, target_type, target_id, reason, reason_category);

    return success(res, null, '举报已提交，我们会尽快处理');
  } catch (err) {
    console.error('提交举报错误:', err);
    return serverError(res, '提交失败，请稍后重试');
  }
});

router.get('/my', authMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const countQuery = `SELECT COUNT(*) as total FROM reports WHERE reporter_id = ?`;
    const { total } = db.prepare(countQuery).get(req.user.id);

    const reports = db.prepare(`
      SELECT * FROM reports 
      WHERE reporter_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(pageSize), offset);

    return success(res, {
      list: reports,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取我的举报错误:', err);
    return serverError(res, '获取失败');
  }
});

module.exports = router;
