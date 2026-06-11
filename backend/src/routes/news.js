const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { routeToProvince } = require('../middleware/provinceRouter');

const router = express.Router();

router.get('/', authenticate, routeToProvince, auditLog('news', 'get_news_list'), async (req, res) => {
  const { page = 1, pageSize = 10, category, keyword } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;
  const province = String(req.province || 'national');

  let sql = `
    SELECT * FROM news_articles
    WHERE (province = 'national' OR province = ?)
  `;
  const params = [province];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (keyword) {
    sql += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }

  sql += ' ORDER BY is_top DESC, is_hot DESC, publish_time DESC LIMIT ? OFFSET ?';
  params.push(pageSizeNum, offset);

  const articles = await db.allAsync(sql, ...params);

  let countSql = 'SELECT COUNT(*) as count FROM news_articles WHERE (province = \'national\' OR province = ?)';
  const countParams = [province];
  if (category) {
    countSql += ' AND category = ?';
    countParams.push(category);
  }
  if (keyword) {
    countSql += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
    const search = `%${keyword}%`;
    countParams.push(search, search, search);
  }
  const total = (await db.getAsync(countSql, ...countParams)).count;

  const categories = (await db.allAsync(`
    SELECT DISTINCT category FROM news_articles
    WHERE province IN ('national', ?)
  `, province)).map(n => n.category);

  res.json({
    code: 200,
    data: {
      list: articles,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      categories,
    },
  });
});

router.get('/faq/list', authenticate, auditLog('news', 'get_faq_list'), async (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  let sql = 'SELECT * FROM faqs';
  let countSql = 'SELECT COUNT(*) as count FROM faqs';
  const params = [];

  if (keyword) {
    sql += ' WHERE question LIKE ? OR answer LIKE ? OR keywords LIKE ?';
    countSql += ' WHERE question LIKE ? OR answer LIKE ? OR keywords LIKE ?';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }

  sql += ' ORDER BY sort_order ASC, views DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, pageSizeNum, offset];

  const faqs = await db.allAsync(sql, ...queryParams);
  const total = (await db.getAsync(countSql, ...params)).count;

  res.json({
    code: 200,
    data: {
      list: faqs,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.post('/faq/:id/view', authenticate, auditLog('news', 'view_faq'), async (req, res) => {
  const { id } = req.params;
  await db.runAsync('UPDATE faqs SET views = views + 1 WHERE id = ?', id);
  res.json({ code: 200, message: 'success' });
});

router.get('/:id', authenticate, auditLog('news', 'get_news_detail'), async (req, res) => {
  const { id } = req.params;
  const article = await db.getAsync('SELECT * FROM news_articles WHERE id = ?', id);

  if (!article) {
    return res.status(404).json({ code: 404, message: '资讯不存在' });
  }

  await db.runAsync('UPDATE news_articles SET views = views + 1 WHERE id = ?', id);

  res.json({
    code: 200,
    data: {
      ...article,
      views: article.views + 1,
    },
  });
});

module.exports = router;
