import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();
const db = getDB();

router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM challenges';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const challenges = db.prepare(query).all(params);
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ success: false, message: '获取挑战列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    
    if (!challenge) {
      return res.status(404).json({ success: false, message: '挑战不存在' });
    }

    const participants = db.prepare(`
      SELECT cp.*, u.name, u.avatar
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.challenge_id = ?
      ORDER BY cp.joined_at DESC
    `).all(id);

    const completedCount = participants.filter(p => p.completed).length;

    res.json({ 
      success: true, 
      data: {
        ...challenge,
        participants,
        completed_count: completedCount,
        reward_per_completion: completedCount > 0 ? challenge.total_pool / completedCount : 0
      } 
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ success: false, message: '获取挑战详情失败' });
  }
});

router.post('/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: '缺少用户ID' });
    }

    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: '挑战不存在' });
    }

    if (challenge.status === 'ended') {
      return res.status(400).json({ success: false, message: '挑战已结束' });
    }

    const existing = db.prepare(`
      SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?
    `).get(id, user_id);

    if (existing) {
      return res.status(400).json({ success: false, message: '已加入该挑战' });
    }

    db.prepare(`
      INSERT INTO challenge_participants (challenge_id, user_id, deposit_paid)
      VALUES (?, ?, 1)
    `).run(id, user_id);

    db.prepare(`
      UPDATE challenges 
      SET total_pool = total_pool + ?, participant_count = participant_count + 1
      WHERE id = ?
    `).run(challenge.deposit_amount, id);

    const updatedChallenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    
    res.json({ 
      success: true, 
      data: {
        challenge: updatedChallenge,
        deposit_paid: challenge.deposit_amount
      },
      message: '成功加入挑战，保证金已支付'
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ success: false, message: '加入挑战失败' });
  }
});

router.post('/:id/update-progress', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, progress } = req.body;

    if (!user_id || progress === undefined) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const participant = db.prepare(`
      SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?
    `).get(id, user_id);

    if (!participant) {
      return res.status(404).json({ success: false, message: '未参加该挑战' });
    }

    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    const completed = progress >= challenge.target_value;

    db.prepare(`
      UPDATE challenge_participants 
      SET progress = ?, completed = ?
      WHERE challenge_id = ? AND user_id = ?
    `).run(progress, completed ? 1 : 0, id, user_id);

    const updated = db.prepare(`
      SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?
    `).get(id, user_id);

    res.json({ 
      success: true, 
      data: updated,
      message: completed ? '恭喜完成挑战！' : '进度已更新'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: '更新进度失败' });
  }
});

router.get('/user/:user_id', (req, res) => {
  try {
    const { user_id } = req.params;
    
    const participations = db.prepare(`
      SELECT cp.*, c.title, c.target_type, c.target_value, c.deposit_amount, c.status as challenge_status
      FROM challenge_participants cp
      JOIN challenges c ON cp.challenge_id = c.id
      WHERE cp.user_id = ?
      ORDER BY cp.joined_at DESC
    `).all(user_id);

    res.json({ success: true, data: participations });
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({ success: false, message: '获取用户挑战列表失败' });
  }
});

export default router;
