const express = require('express');
const { submitScore, getLeaderboard, getPlayerRank } = require('./database');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/scores', express.json(), (req, res) => {
  try {
    const { playerName, score, level } = req.body;
    
    if (!playerName || playerName.trim() === '') {
      return res.status(400).json({ error: '玩家姓名不能为空' });
    }
    
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: '无效的分数' });
    }
    
    const result = submitScore(playerName.trim(), score, level || 1);
    const rank = getPlayerRank(score);
    
    res.json({
      success: true,
      data: {
        ...result,
        rank
      }
    });
  } catch (error) {
    console.error('提交分数错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/scores/leaderboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = getLeaderboard(Math.min(limit, 100));
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
