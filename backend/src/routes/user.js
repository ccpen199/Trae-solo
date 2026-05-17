const express = require('express');
const { query, queryOne, run } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const favorites = await query(`
      SELECT a.*, c.name as category_name, uf.created_at as favorite_time
      FROM user_favorites uf
      LEFT JOIN albums a ON uf.album_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE uf.user_id = ? AND a.is_published = 1
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);

    const totalResult = await queryOne(`
      SELECT COUNT(*) as total FROM user_favorites uf
      LEFT JOIN albums a ON uf.album_id = a.id
      WHERE uf.user_id = ? AND a.is_published = 1
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        list: favorites,
        total: totalResult.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取收藏失败'
    });
  }
});

router.get('/subscribes', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const subscribes = await query(`
      SELECT a.*, c.name as category_name, us.created_at as subscribe_time
      FROM user_subscribes us
      LEFT JOIN albums a ON us.album_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE us.user_id = ? AND a.is_published = 1
      ORDER BY us.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);

    const totalResult = await queryOne(`
      SELECT COUNT(*) as total FROM user_subscribes us
      LEFT JOIN albums a ON us.album_id = a.id
      WHERE us.user_id = ? AND a.is_published = 1
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        list: subscribes,
        total: totalResult.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订阅失败'
    });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const history = await query(`
      SELECT DISTINCT 
        a.id as album_id,
        a.title as album_title,
        a.cover as album_cover,
        a.author_name,
        e.id as episode_id,
        e.title as episode_title,
        e.duration,
        h.progress,
        h.played_at
      FROM play_history h
      LEFT JOIN albums a ON h.album_id = a.id
      LEFT JOIN episodes e ON h.episode_id = e.id
      WHERE h.user_id = ? AND a.is_published = 1
      ORDER BY h.played_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);

    const totalResult = await queryOne(`
      SELECT COUNT(DISTINCT h.album_id) as total FROM play_history h
      LEFT JOIN albums a ON h.album_id = a.id
      WHERE h.user_id = ? AND a.is_published = 1
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        list: history,
        total: totalResult.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

router.post('/history', authMiddleware, async (req, res) => {
  try {
    const { album_id, episode_id, progress } = req.body;

    await run(
      'INSERT INTO play_history (user_id, album_id, episode_id, progress, played_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [req.user.id, album_id, episode_id, progress || 0]
    );

    res.json({
      success: true,
      message: '记录播放历史成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '记录播放历史失败'
    });
  }
});

router.get('/follows', authMiddleware, async (req, res) => {
  try {
    const follows = await query(`
      SELECT u.id, u.nickname, u.avatar, u.level, u.bio
      FROM user_follows uf
      LEFT JOIN users u ON uf.following_id = u.id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: follows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取关注列表失败'
    });
  }
});

router.post('/follows/:userId', authMiddleware, async (req, res) => {
  try {
    const followingId = req.params.userId;

    if (followingId == req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    const existing = await queryOne(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, followingId]
    );

    if (existing) {
      await run('DELETE FROM user_follows WHERE id = ?', [existing.id]);
      res.json({
        success: true,
        message: '取消关注成功',
        data: { is_following: false }
      });
    } else {
      await run('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, followingId]);
      res.json({
        success: true,
        message: '关注成功',
        data: { is_following: true }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/daily-tasks', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const tasks = [
      { type: 'login', name: '每日登录', reward: 10, completed: false },
      { type: 'listen', name: '收听30分钟', reward: 20, completed: false },
      { type: 'comment', name: '发表评论', reward: 15, completed: false },
      { type: 'share', name: '分享内容', reward: 15, completed: false }
    ];

    const userTasks = await query(
      'SELECT task_type, is_completed FROM daily_tasks WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );

    const completedTypes = userTasks.filter(t => t.is_completed).map(t => t.task_type);

    tasks.forEach(task => {
      task.completed = completedTypes.includes(task.type);
    });

    if (!completedTypes.includes('login')) {
      await run(
        'INSERT OR IGNORE INTO daily_tasks (user_id, task_type, is_completed, reward, date) VALUES (?, ?, 1, ?, ?)',
        [req.user.id, 'login', 10, today]
      );
      await run('UPDATE users SET fish_dried = fish_dried + 10 WHERE id = ?', [req.user.id]);
      tasks.find(t => t.type === 'login').completed = true;
    }

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取每日任务失败'
    });
  }
});

router.post('/daily-tasks/:type/complete', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const rewards = { login: 10, listen: 20, comment: 15, share: 15 };
    const reward = rewards[type] || 0;

    const existing = await queryOne(
      'SELECT id FROM daily_tasks WHERE user_id = ? AND task_type = ? AND date = ?',
      [req.user.id, type, today]
    );

    if (existing) {
      if (existing.is_completed) {
        return res.status(400).json({
          success: false,
          message: '任务已完成'
        });
      }
      await run('UPDATE daily_tasks SET is_completed = 1 WHERE id = ?', [existing.id]);
    } else {
      await run(
        'INSERT INTO daily_tasks (user_id, task_type, is_completed, reward, date) VALUES (?, ?, 1, ?, ?)',
        [req.user.id, type, reward, today]
      );
    }

    if (reward > 0) {
      await run('UPDATE users SET fish_dried = fish_dried + ? WHERE id = ?', [reward, req.user.id]);
    }

    res.json({
      success: true,
      message: '任务完成，奖励已发放',
      data: { reward }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '完成任务失败'
    });
  }
});

router.post('/feed', authMiddleware, async (req, res) => {
  try {
    const { content, images, audio_url } = req.body;

    if (!content?.trim() && !audio_url) {
      return res.status(400).json({
        success: false,
        message: '内容或音频不能为空'
      });
    }

    const result = await run(
      'INSERT INTO feeds (user_id, content, images, audio_url) VALUES (?, ?, ?, ?)',
      [req.user.id, content, images ? JSON.stringify(images) : null, audio_url]
    );

    const feed = await queryOne(`
      SELECT f.*, u.nickname, u.avatar, u.level
      FROM feeds f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `, [result.lastID]);

    res.json({
      success: true,
      message: '发布动态成功',
      data: feed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发布动态失败'
    });
  }
});

router.get('/feeds', async (req, res) => {
  try {
    const { page = 1, limit = 20, user_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE f.is_deleted = 0';
    const params = [];

    if (user_id) {
      whereClause += ' AND f.user_id = ?';
      params.push(user_id);
    }

    const feeds = await query(`
      SELECT f.*, u.nickname, u.avatar, u.level
      FROM feeds f
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalResult = await queryOne(`
      SELECT COUNT(*) as total FROM feeds f ${whereClause.replace('f.', '')}
    `, params);

    res.json({
      success: true,
      data: {
        list: feeds,
        total: totalResult.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取动态失败'
    });
  }
});

module.exports = router;
