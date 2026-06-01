const express = require('express');
const db = require('../database');

const router = express.Router();

router.post('/', (req, res) => {
  const { keyword, type = 'text' } = req.body;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      db.prepare('INSERT INTO search_history (user_id, keyword, search_type) VALUES (?, ?, ?)').run(decoded.userId, keyword, type);
    } catch (e) {}
  }

  const results = [
    { title: `${keyword} - 百度百科`, desc: '百度百科是一部内容开放、自由的网络百科全书', url: '#' },
    { title: `${keyword}相关视频`, desc: '海量高清视频在线观看', url: '#' },
    { title: `${keyword}最新资讯`, desc: '最新新闻资讯实时更新', url: '#' },
    { title: `${keyword}图片`, desc: '高清图片大全', url: '#' }
  ];

  res.json({ results });
});

router.get('/history', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ history: [] });
  }

  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const history = db.prepare('SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(decoded.userId);
    res.json({ history });
  } catch (e) {
    res.json({ history: [] });
  }
});

router.get('/hot', (req, res) => {
  const hotSearches = [
    { keyword: '热点新闻1', hot: 99999 },
    { keyword: '热点新闻2', hot: 88888 },
    { keyword: '热点新闻3', hot: 77777 },
    { keyword: '热点新闻4', hot: 66666 },
    { keyword: '热点新闻5', hot: 55555 }
  ];
  res.json({ hotSearches });
});

module.exports = router;
