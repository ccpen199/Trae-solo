const express = require('express');
const db = require('../db');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { success, error, notFound, serverError } = require('../utils/response');

const router = express.Router();

router.get('/reviews', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = 'pending', target_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = `WHERE 1=1`;
    const params = [];

    if (status) {
      whereClause += ` AND r.status = ?`;
      params.push(status);
    }
    if (target_type) {
      whereClause += ` AND r.target_type = ?`;
      params.push(target_type);
    }

    const countQuery = `SELECT COUNT(*) as total FROM reviews r ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    const reviews = db.prepare(`
      SELECT r.*,
             u.nickname as submitter_nickname, u.avatar as submitter_avatar,
             rev.nickname as reviewer_nickname
      FROM reviews r
      LEFT JOIN users u ON r.submitter_id = u.id
      LEFT JOIN users rev ON r.reviewer_id = rev.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    const enriched = reviews.map(r => {
      let targetInfo = null;
      if (r.target_type === 'bar') {
        targetInfo = db.prepare('SELECT id, name, status FROM product_bars WHERE id = ?').get(r.target_id);
      } else if (r.target_type === 'post') {
        targetInfo = db.prepare('SELECT id, title, status, bar_id FROM posts WHERE id = ?').get(r.target_id);
      }
      return { ...r, target_info: targetInfo };
    });

    return success(res, {
      list: enriched,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取审核列表错误:', err);
    return serverError(res, '获取失败');
  }
});

router.post('/reviews/:id/approve', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const { remark } = req.body;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) {
      return notFound(res, '审核记录不存在');
    }

    if (review.status !== 'pending') {
      return error(res, '该审核已处理');
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE reviews 
        SET status = 'approved', reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP, remark = ?
        WHERE id = ?
      `).run(req.user.id, remark || null, req.params.id);

      if (review.target_type === 'bar') {
        db.prepare(`UPDATE product_bars SET status = 'active' WHERE id = ?`).run(review.target_id);
      } else if (review.target_type === 'post') {
        db.prepare(`UPDATE posts SET status = 'published' WHERE id = ?`).run(review.target_id);
        const post = db.prepare('SELECT bar_id FROM posts WHERE id = ?').get(review.target_id);
        if (post) {
          db.prepare(`UPDATE product_bars SET post_count = post_count + 1 WHERE id = ?`).run(post.bar_id);
        }
      }
    });

    tx();

    return success(res, null, '审核通过');
  } catch (err) {
    console.error('审核通过错误:', err);
    return serverError(res, '操作失败');
  }
});

router.post('/reviews/:id/reject', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const { reason, remark } = req.body;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) {
      return notFound(res, '审核记录不存在');
    }

    if (review.status !== 'pending') {
      return error(res, '该审核已处理');
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE reviews 
        SET status = 'rejected', reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP, reason = ?, remark = ?
        WHERE id = ?
      `).run(req.user.id, reason || '内容不符合规范', remark || null, req.params.id);

      if (review.target_type === 'bar') {
        db.prepare(`UPDATE product_bars SET status = 'rejected' WHERE id = ?`).run(review.target_id);
      } else if (review.target_type === 'post') {
        db.prepare(`UPDATE posts SET status = 'rejected' WHERE id = ?`).run(review.target_id);
      }
    });

    tx();

    return success(res, null, '已拒绝');
  } catch (err) {
    console.error('审核拒绝错误:', err);
    return serverError(res, '操作失败');
  }
});

router.get('/reports', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = 'pending', reason_category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = `WHERE 1=1`;
    const params = [];

    if (status) {
      whereClause += ` AND status = ?`;
      params.push(status);
    }
    if (reason_category) {
      whereClause += ` AND reason_category = ?`;
      params.push(reason_category);
    }

    const countQuery = `SELECT COUNT(*) as total FROM reports ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    const reports = db.prepare(`
      SELECT r.*,
             u.nickname as reporter_nickname
      FROM reports r
      LEFT JOIN users u ON r.reporter_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    const enriched = reports.map(r => {
      let targetInfo = null;
      if (r.target_type === 'bar') {
        targetInfo = db.prepare('SELECT id, name FROM product_bars WHERE id = ?').get(r.target_id);
      } else if (r.target_type === 'post') {
        targetInfo = db.prepare('SELECT id, title FROM posts WHERE id = ?').get(r.target_id);
      } else if (r.target_type === 'comment') {
        targetInfo = db.prepare('SELECT id, content FROM comments WHERE id = ?').get(r.target_id);
      } else if (r.target_type === 'user') {
        targetInfo = db.prepare('SELECT id, username, nickname FROM users WHERE id = ?').get(r.target_id);
      }
      return { ...r, target_info: targetInfo };
    });

    return success(res, {
      list: enriched,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取举报列表错误:', err);
    return serverError(res, '获取失败');
  }
});

router.post('/reports/:id/handle', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const { action, result, remove_content = false } = req.body;

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) {
      return notFound(res, '举报记录不存在');
    }

    if (report.status !== 'pending' && report.status !== 'processing') {
      return error(res, '该举报已处理');
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE reports 
        SET status = ?, handler_id = ?, result = ?, handled_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(action === 'ignore' ? 'ignored' : 'resolved', req.user.id, result || null, req.params.id);

      if (remove_content) {
        if (report.target_type === 'post') {
          db.prepare(`UPDATE posts SET status = 'removed' WHERE id = ?`).run(report.target_id);
        } else if (report.target_type === 'comment') {
          db.prepare(`UPDATE comments SET status = 'removed' WHERE id = ?`).run(report.target_id);
        }
      }
    });

    tx();

    return success(res, null, '处理完成');
  } catch (err) {
    console.error('处理举报错误:', err);
    return serverError(res, '操作失败');
  }
});

router.get('/blacklist', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const words = db.prepare('SELECT * FROM blacklist_words ORDER BY created_at DESC').all();
    return success(res, words);
  } catch (err) {
    console.error('获取黑名单错误:', err);
    return serverError(res, '获取失败');
  }
});

router.post('/blacklist', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const { word, category = 'other' } = req.body;

    if (!word || !word.trim()) {
      return error(res, '关键词不能为空');
    }

    try {
      db.prepare('INSERT INTO blacklist_words (word, category) VALUES (?, ?)').run(word.trim(), category);
      return success(res, null, '添加成功');
    } catch (e) {
      if (e.message && e.message.includes('UNIQUE')) {
        return error(res, '该关键词已存在');
      }
      throw e;
    }
  } catch (err) {
    console.error('添加黑名单错误:', err);
    return serverError(res, '添加失败');
  }
});

router.delete('/blacklist/:id', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM blacklist_words WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return notFound(res, '关键词不存在');
    }
    return success(res, null, '删除成功');
  } catch (err) {
    console.error('删除黑名单错误:', err);
    return serverError(res, '删除失败');
  }
});

router.get('/stats', authMiddleware, requireRoles('operator', 'admin'), (req, res) => {
  try {
    const totalBars = db.prepare("SELECT COUNT(*) as count FROM product_bars WHERE status = 'active'").get();
    const pendingBars = db.prepare("SELECT COUNT(*) as count FROM product_bars WHERE status = 'pending'").get();
    const totalPosts = db.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published'").get();
    const pendingPosts = db.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'pending'").get();
    const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'").get();
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get();
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

    return success(res, {
      total_bars: totalBars.count,
      pending_bars: pendingBars.count,
      total_posts: totalPosts.count,
      pending_posts: pendingPosts.count,
      pending_reviews: pendingReviews.count,
      pending_reports: pendingReports.count,
      total_users: totalUsers.count
    });
  } catch (err) {
    console.error('获取统计错误:', err);
    return serverError(res, '获取失败');
  }
});

module.exports = router;
