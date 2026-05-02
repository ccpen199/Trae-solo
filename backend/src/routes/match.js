const express = require('express');
const { db } = require('../database/init');
const { verifyToken, checkPermission, verifyOwnership } = require('../middleware/auth');
const { workflowEngine, MATCH_STATES } = require('../engines/workflowEngine');

const router = express.Router();

router.post('/create', verifyToken, checkPermission('match:report'), (req, res) => {
  try {
    const { game_mode, match_type } = req.body;
    
    const result = workflowEngine.createMatch({
      game_mode: game_mode || 'default',
      match_type: match_type || 'ranked'
    }, req.user);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('创建比赛错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/:id/start', verifyToken, (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    
    const match = db.prepare('SELECT * FROM match_records WHERE id = ?').get(matchId);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    const result = workflowEngine.transition('match', matchId, MATCH_STATES.MATCH_IN_PROGRESS, req.user);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('开始比赛错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/:id/end', verifyToken, (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    
    const match = db.prepare('SELECT * FROM match_records WHERE id = ?').get(matchId);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    const result = workflowEngine.transition('match', matchId, MATCH_STATES.MATCH_COMPLETED, req.user);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('结束比赛错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/:id/report', verifyToken, checkPermission('match:report'), (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { playerStats, reportData } = req.body;
    
    const match = db.prepare('SELECT * FROM match_records WHERE id = ?').get(matchId);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    const currentState = workflowEngine.getCurrentState('match', matchId);
    
    if (currentState?.current_state === MATCH_STATES.MATCH_COMPLETED) {
      workflowEngine.transition('match', matchId, MATCH_STATES.REPORT_PENDING, req.user);
    }

    const result = workflowEngine.transition('match', matchId, MATCH_STATES.REPORT_RECEIVED, req.user, {
      playerStats,
      reportData
    });

    setTimeout(() => {
      try {
        workflowEngine.transition('match', matchId, MATCH_STATES.REPORT_VERIFIED, req.user);
      } catch (e) {
        console.log('自动验证跳过:', e.message);
      }
    }, 200);

    res.json({
      success: true,
      message: '战绩报告已提交，正在处理中...',
      data: result
    });
  } catch (error) {
    console.error('提交战绩错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/:id', verifyToken, (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    
    const match = db.prepare('SELECT * FROM match_records WHERE id = ?').get(matchId);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    const playerStats = db.prepare(`
      SELECT pms.*, u.nickname, u.username
      FROM player_match_stats pms
      JOIN users u ON pms.user_id = u.id
      WHERE pms.match_record_id = ?
    `).all(matchId);

    const workflowStates = db.prepare(`
      SELECT * FROM workflow_states 
      WHERE entity_type = 'match' AND entity_id = ? 
      ORDER BY created_at ASC
    `).all(matchId);

    res.json({
      success: true,
      data: {
        match: {
          ...match,
          report_data: match.report_data ? JSON.parse(match.report_data) : null
        },
        playerStats: playerStats.map(s => ({
          ...s,
          extra_stats: s.extra_stats ? JSON.parse(s.extra_stats) : null
        })),
        workflowStates
      }
    });
  } catch (error) {
    console.error('获取比赛详情错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/', verifyToken, (req, res) => {
  try {
    const { limit = 20, offset = 0, status, user_id } = req.query;
    
    let query = `
      SELECT mr.*, 
        (SELECT COUNT(*) FROM player_match_stats WHERE match_record_id = mr.id) as player_count
      FROM match_records mr
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }

    if (user_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM player_match_stats pms 
        WHERE pms.match_record_id = mr.id AND pms.user_id = ?
      )`;
      params.push(parseInt(user_id));
    }

    query += ' ORDER BY mr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const matches = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM match_records WHERE 1=1';
    const total = db.prepare(countQuery).get();

    res.json({
      success: true,
      data: {
        matches: matches.map(m => ({
          ...m,
          report_data: m.report_data ? JSON.parse(m.report_data) : null
        })),
        pagination: {
          total: total.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取比赛列表错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/quick-report', verifyToken, (req, res) => {
  try {
    const { playerStats, game_mode, match_type } = req.body;

    if (!playerStats || !Array.isArray(playerStats) || playerStats.length === 0) {
      return res.status(400).json({ error: '必须提供玩家战绩数据' });
    }

    const match = workflowEngine.createMatch({
      game_mode: game_mode || 'default',
      match_type: match_type || 'ranked'
    }, req.user);

    const matchId = match.id;

    workflowEngine.transition('match', matchId, MATCH_STATES.MATCH_IN_PROGRESS, req.user);
    workflowEngine.transition('match', matchId, MATCH_STATES.MATCH_COMPLETED, req.user);
    workflowEngine.transition('match', matchId, MATCH_STATES.REPORT_PENDING, req.user);

    const result = workflowEngine.transition('match', matchId, MATCH_STATES.REPORT_RECEIVED, req.user, {
      playerStats,
      reportData: { quickReport: true, submittedAt: new Date().toISOString() }
    });

    setTimeout(() => {
      try {
        workflowEngine.transition('match', matchId, MATCH_STATES.REPORT_VERIFIED, req.user);
      } catch (e) {
        console.log('自动验证跳过:', e.message);
      }
    }, 100);

    res.json({
      success: true,
      message: '快速战绩报告已提交，积分正在计算中...',
      data: {
        matchId,
        transitionResult: result
      }
    });
  } catch (error) {
    console.error('快速提交战绩错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

module.exports = router;
