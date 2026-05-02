const express = require('express');
const { db } = require('../database/init');
const { verifyToken, checkPermission } = require('../middleware/auth');
const leaderboardEngine = require('../engines/leaderboardEngine');

const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  try {
    const { season_id } = req.query;
    
    const leaderboards = leaderboardEngine.getActiveLeaderboards(
      season_id ? parseInt(season_id) : null
    );

    res.json({
      success: true,
      data: leaderboards
    });
  } catch (error) {
    console.error('获取排行榜列表错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/:id', verifyToken, (req, res) => {
  try {
    const leaderboardId = parseInt(req.params.id);
    const { limit = 50, offset = 0, include_user } = req.query;

    const result = leaderboardEngine.getLeaderboard(leaderboardId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeUser: include_user ? parseInt(include_user) : null
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/:id/refresh', verifyToken, checkPermission('leaderboard:manage'), (req, res) => {
  try {
    const leaderboardId = parseInt(req.params.id);
    
    const result = leaderboardEngine.refreshLeaderboard(leaderboardId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('刷新排行榜错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/refresh-all', verifyToken, checkPermission('leaderboard:manage'), (req, res) => {
  try {
    const results = leaderboardEngine.refreshAllLeaderboards();

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('刷新所有排行榜错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/my/rank', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');

    if (!activeSeason) {
      return res.status(404).json({ error: '没有活动的赛季' });
    }

    const userPoints = db.prepare(`
      SELECT * FROM user_season_points WHERE user_id = ? AND season_id = ?
    `).get(userId, activeSeason.id);

    if (!userPoints) {
      return res.json({
        success: true,
        data: {
          ranked: false,
          message: '您还没有参加任何比赛'
        }
      });
    }

    const rankQuery = `
      SELECT COUNT(*) as rank
      FROM user_season_points
      WHERE season_id = ? AND total_points > ?
    `;
    const rankResult = db.prepare(rankQuery).get(activeSeason.id, userPoints.total_points);
    const currentRank = rankResult.rank + 1;

    const totalPlayers = db.prepare(`
      SELECT COUNT(*) as total FROM user_season_points WHERE season_id = ?
    `).get(activeSeason.id);

    const leaderboards = db.prepare(`
      SELECT * FROM leaderboards WHERE status = 'active'
    `).all();

    const userRankings = [];
    for (const lb of leaderboards) {
      const entry = db.prepare(`
        SELECT le.*, u.nickname
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        WHERE le.leaderboard_id = ? AND le.user_id = ?
      `).get(lb.id, userId);

      if (entry) {
        userRankings.push({
          leaderboardId: lb.id,
          leaderboardName: lb.name,
          rank: entry.rank,
          score: entry.score,
          previousRank: entry.previous_rank
        });
      }
    }

    res.json({
      success: true,
      data: {
        ranked: true,
        currentRank,
        totalPlayers: totalPlayers.total,
        points: userPoints.total_points,
        wins: userPoints.wins,
        losses: userPoints.losses,
        winRate: userPoints.win_rate,
        rankName: userPoints.rank,
        leaderboardRankings: userRankings
      }
    });
  } catch (error) {
    console.error('获取用户排名错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

module.exports = router;
