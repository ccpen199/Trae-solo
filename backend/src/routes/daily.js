const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let quote = await db.get('SELECT * FROM daily_quotes WHERE date = ?', [today]);

    if (!quote) {
      const quotes = await db.all('SELECT * FROM daily_quotes ORDER BY RANDOM() LIMIT 1');
      quote = quotes[0] || {
        id: 0,
        date: today,
        quote: '每一个不曾起舞的日子，都是对生命的辜负。',
        author: '尼采',
        likes: 0,
        shares: 0,
        color: '#4A90D9'
      };
    }

    res.json({
      quote: {
        id: quote.id,
        date: quote.date,
        content: quote.quote,
        author: quote.author,
        imageUrl: quote.image_url,
        likes: quote.likes,
        shares: quote.shares,
        color: quote.color
      }
    });
  } catch (error) {
    console.error('获取日贴错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('UPDATE daily_quotes SET likes = likes + 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('UPDATE daily_quotes SET shares = shares + 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('分享错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
