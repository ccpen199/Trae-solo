const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/shortcuts', (req, res) => {
  const shortcuts = db.prepare('SELECT * FROM shortcuts WHERE is_active = 1 ORDER BY click_count DESC LIMIT 8').all();
  res.json({ shortcuts });
});

router.get('/ai-apps', (req, res) => {
  const aiApps = db.prepare('SELECT * FROM ai_apps WHERE is_active = 1 ORDER BY click_count DESC').all();
  res.json({ aiApps });
});

router.get('/featured', (req, res) => {
  const featured = [
    { id: 1, title: '热门推荐1', image: '🔥', desc: '精选内容推荐' },
    { id: 2, title: '热门推荐2', image: '⭐', desc: '精选内容推荐' },
    { id: 3, title: '热门推荐3', image: '💎', desc: '精选内容推荐' }
  ];
  res.json({ featured });
});

router.get('/learning', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ 
      learning: [
        { id: 1, title: '小学课程', locked: true },
        { id: 2, title: '初中课程', locked: true },
        { id: 3, title: '高中课程', locked: true }
      ],
      requiresLogin: true 
    });
  }

  const learning = [
    { id: 1, title: '小学课程', locked: false },
    { id: 2, title: '初中课程', locked: false },
    { id: 3, title: '高中课程', locked: false }
  ];
  res.json({ learning, requiresLogin: false });
});

router.get('/scan-tools', (req, res) => {
  const scanTools = db.prepare('SELECT * FROM scan_tools').all();
  res.json({ scanTools });
});

module.exports = router;
