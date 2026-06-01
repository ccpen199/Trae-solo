const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { checkSensitiveWords } = require('../utils/validators');

function getReviewStatus(status, source) {
  if (status === 0) return '待审核';
  if (status === 2 && source === 'ugc') return '社区审核员已通过';
  if (status === 2 && source === 'pgc') return '管理员已发布';
  if (status === 3) return '审核拒绝';
  return '';
}

function getNewsTypeLabel(type, source) {
  if (type === 'government') return '政务通知';
  if (type === 'local' && source === 'ugc') return '居民爆料';
  if (type === 'life') return '便民资讯';
  if (type === 'event') return '活动预告';
  if (type === 'hot') return '本地热点';
  return type;
}

router.get('/', (req, res) => {
  const { region_code, type, source, is_hot, keyword, page = 1, page_size = 20 } = req.query;
  let sql = `SELECT n.*, r.name as region_name FROM news n
    LEFT JOIN admin_regions r ON n.region_code = r.code
    WHERE n.status = 2`;
  const params = [];
  if (region_code) {
    sql += ' AND (n.region_code = ? OR n.region_code = "110000")';
    params.push(region_code);
  }
  if (type) {
    sql += ' AND n.type = ?';
    params.push(type);
  }
  if (source) {
    sql += ' AND n.source = ?';
    params.push(source);
  }
  if (is_hot) {
    sql += ' AND n.is_hot = ?';
    params.push(parseInt(is_hot));
  }
  if (keyword) {
    sql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw);
  }
  sql += ' ORDER BY n.is_hot DESC, n.publish_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  const newsList = db.prepare(sql).all(...params);

  let reviewMap = {};
  if (newsList.length > 0) {
    const newsIds = newsList.map(n => n.id);
    const placeholders = newsIds.map(() => '?').join(',');
    const reviews = db.prepare(`SELECT nr.*, a.username, a.real_name FROM news_reviews nr
      LEFT JOIN admins a ON nr.reviewer_id = a.id
      WHERE nr.news_id IN (${placeholders})
      ORDER BY nr.created_at DESC`).all(...newsIds);
    reviews.forEach(r => {
      if (!reviewMap[r.news_id]) {
        reviewMap[r.news_id] = r;
      }
    });
  }

  const enrichedNews = newsList.map(n => ({
    ...n,
    review_status: getReviewStatus(n.status, n.source),
    push_region_name: (n.source === 'pgc' && n.region_code) ? n.region_name : null,
    news_type: getNewsTypeLabel(n.type, n.source),
    latest_review: reviewMap[n.id] || null,
  }));

  const countSql = 'SELECT COUNT(*) as total FROM news WHERE status = 2';
  const total = db.prepare(countSql).get().total;
  res.json({ news: enrichedNews, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/hot', (req, res) => {
  const { region_code, limit = 10 } = req.query;
  let sql = `SELECT n.*, r.name as region_name FROM news n
    LEFT JOIN admin_regions r ON n.region_code = r.code
    WHERE n.status = 2 AND n.is_hot = 1`;
  const params = [];
  if (region_code) {
    sql += ' AND (n.region_code = ? OR n.region_code = "110000")';
    params.push(region_code);
  }
  sql += ' ORDER BY n.views DESC, n.publish_time DESC LIMIT ?';
  params.push(parseInt(limit));
  const hotNews = db.prepare(sql).all(...params);
  res.json({ hotNews });
});

router.get('/:id', (req, res) => {
  const news = db.prepare(`SELECT n.*, r.name as region_name FROM news n
    LEFT JOIN admin_regions r ON n.region_code = r.code
    WHERE n.id = ?`).get(req.params.id);
  if (!news) {
    return res.status(404).json({ error: '资讯不存在' });
  }
  db.prepare('UPDATE news SET views = views + 1 WHERE id = ?').run(req.params.id);
  const reviews = db.prepare(`SELECT nr.*, a.username, a.real_name FROM news_reviews nr
    LEFT JOIN admins a ON nr.reviewer_id = a.id
    WHERE nr.news_id = ?`).all(req.params.id);
  const enrichedNews = {
    ...news,
    views: news.views + 1,
    review_status: getReviewStatus(news.status, news.source),
    push_region_name: (news.source === 'pgc' && news.region_code) ? news.region_name : null,
    news_type: getNewsTypeLabel(news.type, news.source),
  };
  res.json({ news: enrichedNews, reviews });
});

router.post('/report', authenticateUser, (req, res) => {
  const { title, content, region_code } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '请填写标题和内容' });
  }
  const sensitiveCheck = checkSensitiveWords(title + ' ' + content);
  if (sensitiveCheck.hasSensitive) {
    return res.status(400).json({
      error: '内容包含敏感词，无法发布',
      sensitiveWords: sensitiveCheck.words.map(w => w.word)
    });
  }
  const result = db.prepare(`
    INSERT INTO news (title, content, type, source, region_code, author_id, author_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, content, 'local', 'ugc', region_code || req.user.region_code, req.user.id, req.user.real_name || req.user.username, 0);
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '爆料已提交，等待审核', news });
});

router.get('/admin/pending', authenticateAdmin, (req, res) => {
  let sql = `SELECT n.*, r.name as region_name, u.username as author_username FROM news n
    LEFT JOIN admin_regions r ON n.region_code = r.code
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.status = 0`;
  const params = [];
  if (req.admin.region_code) {
    sql += ' AND n.region_code = ?';
    params.push(req.admin.region_code);
  }
  sql += ' ORDER BY n.created_at DESC';
  const pendingNews = db.prepare(sql).all(...params);
  res.json({ pendingNews });
});

router.post('/admin/:id/review', authenticateAdmin, (req, res) => {
  const { review_result, review_comment, is_hot } = req.body;
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!news) {
    return res.status(404).json({ error: '资讯不存在' });
  }
  if (news.status !== 0) {
    return res.status(400).json({ error: '该资讯已审核' });
  }
  if (review_result === 1) {
    db.prepare(`UPDATE news SET status = 2, reviewer_id = ?, reviewed_at = ?, is_hot = ?, publish_time = ? WHERE id = ?`).run(
      req.admin.id, new Date().toISOString(), is_hot ? 1 : 0, new Date().toISOString(), req.params.id
    );
  } else {
    db.prepare(`UPDATE news SET status = 3, reviewer_id = ?, reviewed_at = ? WHERE id = ?`).run(
      req.admin.id, new Date().toISOString(), req.params.id
    );
  }
  db.prepare(`INSERT INTO news_reviews (news_id, reviewer_id, review_comment, review_result) VALUES (?, ?, ?, ?)`).run(
    req.params.id, req.admin.id, review_comment || '', review_result
  );
  const updated = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  res.json({ message: review_result === 1 ? '审核通过' : '审核拒绝', news: updated });
});

router.post('/admin/push', authenticateAdmin, (req, res) => {
  const { title, content, type, region_code, is_hot } = req.body;
  if (!title || !content || !type) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  if (req.admin.level > 2 && !region_code) {
    return res.status(403).json({ error: '区县管理员必须指定推送区域' });
  }
  const targetRegion = region_code || req.admin.region_code;
  const sensitiveCheck = checkSensitiveWords(title + ' ' + content);
  if (sensitiveCheck.hasSensitive) {
    return res.status(400).json({ error: '内容包含敏感词' });
  }
  const result = db.prepare(`
    INSERT INTO news (title, content, type, source, region_code, author_name, status, is_hot, publish_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, content, type, 'pgc', targetRegion, req.admin.real_name || '政务通知', 2, is_hot ? 1 : 0, new Date().toISOString());
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '推送成功', news });
});

module.exports = router;
