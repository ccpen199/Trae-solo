const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./users');

const router = express.Router();

router.get('/global', (req, res) => {
  const { game_type_id, limit = 20 } = req.query;
  
  let query = `
    SELECT 
      u.id,
      u.username,
      u.nickname,
      u.avatar,
      u.total_score,
      COUNT(sr.id) as game_count
    FROM users u
    LEFT JOIN score_records sr ON u.id = sr.user_id
    WHERE u.role = 'student'
  `;
  
  const params = [];
  
  if (game_type_id) {
    query += ' AND sr.game_type_id = ?';
    params.push(game_type_id);
  }
  
  query += `
    GROUP BY u.id
    ORDER BY u.total_score DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));
  
  const rankings = db.prepare(query).all(...params);
  
  const rankingsWithRank = rankings.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
  
  res.json(rankingsWithRank);
});

router.get('/my-rank', authenticateToken, (req, res) => {
  const { game_type_id } = req.query;
  
  const user = db.prepare('SELECT id, total_score FROM users WHERE id = ?').get(req.user.id);
  
  let rankQuery = `
    SELECT COUNT(*) + 1 as rank
    FROM users u
    WHERE u.role = 'student' AND u.total_score > (
      SELECT total_score FROM users WHERE id = ?
    )
  `;
  
  if (game_type_id) {
    rankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM users u
      WHERE u.role = 'student' AND (
        SELECT SUM(score) FROM score_records WHERE user_id = u.id AND game_type_id = ?
      ) > (
        SELECT IFNULL(SUM(score), 0) FROM score_records WHERE user_id = ? AND game_type_id = ?
      )
    `;
    const result = db.prepare(rankQuery).get(game_type_id, req.user.id, game_type_id);
    
    const myScore = db.prepare(`
      SELECT IFNULL(SUM(score), 0) as total FROM score_records 
      WHERE user_id = ? AND game_type_id = ?
    `).get(req.user.id, game_type_id);
    
    const gameRankings = db.prepare(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar,
        SUM(sr.score) as total_score
      FROM users u
      JOIN score_records sr ON u.id = sr.user_id
      WHERE u.role = 'student' AND sr.game_type_id = ?
      GROUP BY u.id
      ORDER BY total_score DESC
      LIMIT 5
    `).all(game_type_id);
    
    res.json({
      rank: result.rank,
      totalScore: myScore.total,
      topPlayers: gameRankings.map((item, index) => ({ ...item, rank: index + 1 }))
    });
  } else {
    const result = db.prepare(rankQuery).get(req.user.id);
    
    const globalRankings = db.prepare(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar,
        u.total_score
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.total_score DESC
      LIMIT 5
    `).all();
    
    res.json({
      rank: result.rank,
      totalScore: user.total_score,
      topPlayers: globalRankings.map((item, index) => ({ ...item, rank: index + 1 }))
    });
  }
});

router.get('/history', authenticateToken, (req, res) => {
  const { limit = 20, game_type_id } = req.query;
  
  let query = `
    SELECT 
      sr.id,
      sr.score,
      sr.created_at,
      gt.name as game_name,
      gt.icon,
      gt.code as game_code,
      l.name as level_name,
      l.level_number
    FROM score_records sr
    JOIN game_types gt ON sr.game_type_id = gt.id
    LEFT JOIN levels l ON sr.level_id = l.id
    WHERE sr.user_id = ?
  `;
  
  const params = [req.user.id];
  
  if (game_type_id) {
    query += ' AND sr.game_type_id = ?';
    params.push(game_type_id);
  }
  
  query += ' ORDER BY sr.created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const history = db.prepare(query).all(...params);
  
  res.json(history);
});

router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT sr.id) as total_games,
      SUM(sr.score) as total_score,
      AVG(sr.score) as avg_score,
      COUNT(DISTINCT gt.id) as game_types_played
    FROM score_records sr
    LEFT JOIN game_types gt ON sr.game_type_id = gt.id
    WHERE sr.user_id = ?
  `).get(userId);
  
  const bestScore = db.prepare(`
    SELECT 
      sr.score,
      gt.name as game_name,
      sr.created_at
    FROM score_records sr
    JOIN game_types gt ON sr.game_type_id = gt.id
    WHERE sr.user_id = ?
    ORDER BY sr.score DESC
    LIMIT 1
  `).get(userId);
  
  const recentGames = db.prepare(`
    SELECT 
      gt.id,
      gt.name,
      gt.icon,
      gt.code,
      COUNT(sr.id) as play_count,
      SUM(sr.score) as total_score
    FROM game_types gt
    LEFT JOIN score_records sr ON gt.id = sr.game_type_id AND sr.user_id = ?
    GROUP BY gt.id
    ORDER BY play_count DESC
    LIMIT 5
  `).all(userId);
  
  res.json({
    totalGames: stats.total_games || 0,
    totalScore: stats.total_score || 0,
    avgScore: Math.round(stats.avg_score || 0),
    gameTypesPlayed: stats.game_types_played || 0,
    bestScore: bestScore || null,
    recentGames
  });
});

module.exports = router;
