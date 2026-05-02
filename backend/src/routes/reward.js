const express = require('express');
const { db } = require('../database/init');
const { verifyToken, checkPermission, verifyOwnership } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, checkPermission('reward:view:self'), (req, res) => {
  try {
    const { season_id, status } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT ur.*, r.name as reward_name, r.description as reward_description, 
             r.reward_type, r.condition_type, r.condition_value, r.reward_data
      FROM user_rewards ur
      JOIN rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ?
    `;
    const params = [userId];

    if (season_id) {
      query += ' AND ur.season_id = ?';
      params.push(parseInt(season_id));
    }

    if (status) {
      query += ' AND ur.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ur.created_at DESC';

    const rewards = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: rewards.map(r => ({
        ...r,
        reward_data: r.reward_data ? JSON.parse(r.reward_data) : null,
        claim_data: r.claim_data ? JSON.parse(r.claim_data) : null
      }))
    });
  } catch (error) {
    console.error('获取用户奖励错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/all', verifyToken, checkPermission('reward:manage'), (req, res) => {
  try {
    const { season_id, status } = req.query;

    let query = 'SELECT * FROM rewards WHERE 1=1';
    const params = [];

    if (season_id) {
      query += ' AND season_id = ?';
      params.push(parseInt(season_id));
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const rewards = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: rewards.map(r => ({
        ...r,
        reward_data: r.reward_data ? JSON.parse(r.reward_data) : null
      }))
    });
  } catch (error) {
    console.error('获取奖励列表错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/create', verifyToken, checkPermission('reward:manage'), (req, res) => {
  try {
    const { name, season_id, reward_type, condition_type, condition_value, reward_data, description } = req.body;

    if (!name || !reward_type || !condition_type) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');
    const targetSeasonId = season_id || activeSeason?.id;

    if (!targetSeasonId) {
      return res.status(400).json({ error: '没有活动的赛季' });
    }

    const result = db.prepare(`
      INSERT INTO rewards 
        (name, season_id, reward_type, condition_type, condition_value, reward_data, status, description)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      name,
      targetSeasonId,
      reward_type,
      condition_type,
      condition_value,
      reward_data ? JSON.stringify(reward_data) : null,
      description
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        name,
        season_id: targetSeasonId
      }
    });
  } catch (error) {
    console.error('创建奖励错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.post('/:id/claim', verifyToken, (req, res) => {
  try {
    const userRewardId = parseInt(req.params.id);
    const userId = req.user.id;

    const userReward = db.prepare(`
      SELECT ur.*, r.reward_data
      FROM user_rewards ur
      JOIN rewards r ON ur.reward_id = r.id
      WHERE ur.id = ? AND ur.user_id = ?
    `).get(userRewardId, userId);

    if (!userReward) {
      return res.status(404).json({ error: '奖励不存在或不属于您' });
    }

    if (userReward.status !== 'eligible') {
      return res.status(400).json({ error: '奖励状态不正确，无法领取' });
    }

    db.prepare(`
      UPDATE user_rewards 
      SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP, claim_data = ?
      WHERE id = ?
    `).run(
      JSON.stringify({
        claimedAt: new Date().toISOString(),
        claimedBy: userId
      }),
      userRewardId
    );

    res.json({
      success: true,
      message: '奖励领取成功',
      data: {
        id: userRewardId,
        rewardName: userReward.name,
        rewardData: userReward.reward_data ? JSON.parse(userReward.reward_data) : null
      }
    });
  } catch (error) {
    console.error('领取奖励错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/:id', verifyToken, (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);

    if (!reward) {
      return res.status(404).json({ error: '奖励不存在' });
    }

    res.json({
      success: true,
      data: {
        ...reward,
        reward_data: reward.reward_data ? JSON.parse(reward.reward_data) : null
      }
    });
  } catch (error) {
    console.error('获取奖励详情错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

router.get('/user/:user_id/history', verifyToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.user_id);
    const { limit = 20, offset = 0 } = req.query;

    if (req.user.role !== 'admin' && req.user.role !== 'operator' && req.user.role !== 'customer_service') {
      if (req.user.id !== targetUserId) {
        return res.status(403).json({ error: '权限不足' });
      }
    }

    const transactions = db.prepare(`
      SELECT pt.*, mr.match_type, mr.game_mode
      FROM point_transactions pt
      LEFT JOIN match_records mr ON pt.match_record_id = mr.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
      LIMIT ? OFFSET ?
    `).all(targetUserId, parseInt(limit), parseInt(offset));

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM point_transactions WHERE user_id = ?
    `).get(targetUserId);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: total.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取积分历史错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

module.exports = router;
