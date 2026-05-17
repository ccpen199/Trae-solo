const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/records', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 30, startDate, endDate } = req.query;
    const userId = req.user.userId;

    let query = 'SELECT * FROM sleep_records WHERE user_id = ?';
    let params = [userId];

    if (startDate) {
      query += ' AND sleep_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND sleep_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY sleep_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const records = await db.all(query, params);

    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM sleep_records WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        records,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取睡眠记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const record = await db.get(
      'SELECT * FROM sleep_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '睡眠记录不存在'
      });
    }

    const avgStats = await db.get(`
      SELECT 
        AVG(duration) as avg_duration,
        AVG(deep_sleep_duration) as avg_deep_sleep,
        AVG(sleep_quality_score) as avg_score
      FROM sleep_records 
      WHERE user_id = ? AND sleep_date >= DATE('now', '-30 days')
    `, [userId]);

    res.json({
      success: true,
      data: {
        record,
        peerComparison: {
          avgDuration: avgStats.avg_duration || 0,
          avgDeepSleep: avgStats.avg_deep_sleep || 0,
          avgScore: avgStats.avg_score || 0
        }
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取睡眠详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      sleepDate,
      startTime,
      endTime,
      duration,
      deepSleepDuration,
      lightSleepDuration,
      remSleepDuration,
      awakeDuration,
      avgHeartRate,
      avgTemperature,
      movementCount,
      wakeUpCount,
      snoringDuration,
      sleepTalkingCount,
      sleepQualityScore
    } = req.body;

    if (!sleepDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: '睡眠日期和开始时间不能为空'
      });
    }

    const result = await db.run(`
      INSERT INTO sleep_records (
        user_id, sleep_date, start_time, end_time, duration,
        deep_sleep_duration, light_sleep_duration, rem_sleep_duration, awake_duration,
        avg_heart_rate, avg_temperature, movement_count, wake_up_count,
        snoring_duration, sleep_talking_count, sleep_quality_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, sleepDate, startTime, endTime || null, duration || null,
      deepSleepDuration || null, lightSleepDuration || null, remSleepDuration || null, awakeDuration || null,
      avgHeartRate || null, avgTemperature || null, movementCount || 0, wakeUpCount || 0,
      snoringDuration || null, sleepTalkingCount || 0, sleepQualityScore || null
    ]);

    res.json({
      success: true,
      data: { id: result.id },
      message: '睡眠记录创建成功'
    });
  } catch (error) {
    console.error('创建睡眠记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 7 } = req.query;

    const stats = await db.all(`
      SELECT 
        sleep_date,
        duration,
        deep_sleep_duration,
        sleep_quality_score
      FROM sleep_records 
      WHERE user_id = ? AND sleep_date >= DATE('now', '-' || ? || ' days')
      ORDER BY sleep_date ASC
    `, [userId, days]);

    const summary = await db.get(`
      SELECT 
        COUNT(*) as total_days,
        AVG(duration) as avg_duration,
        AVG(deep_sleep_duration) as avg_deep_sleep,
        AVG(sleep_quality_score) as avg_score
      FROM sleep_records 
      WHERE user_id = ? AND sleep_date >= DATE('now', '-' || ? || ' days')
    `, [userId, days]);

    res.json({
      success: true,
      data: {
        stats,
        summary: {
          totalDays: summary.total_days,
          avgDuration: summary.avg_duration,
          avgDeepSleep: summary.avg_deep_sleep,
          avgScore: summary.avg_score
        }
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取睡眠统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
