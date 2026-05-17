const express = require('express');
const { success, error } = require('../utils/response');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/today', authMiddleware, (req, res) => {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];

  try {
    db.get('SELECT * FROM nowhere_today WHERE date = ?', [today], (err, todayContent) => {
      if (err) {
        console.error('Get today content error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }
      
      if (!todayContent) {
        todayContent = {
          date: today,
          title: '今日冥想：活在当下',
          description: '让我们一起觉察当下的每一刻，感受呼吸的流动',
          audio_url: '/audio/today-default.mp3',
          duration: 10
        };
      }

      db.get(`
        SELECT duration, self_score, notes 
        FROM daily_practices 
        WHERE user_id = ? AND practice_date = ?
      `, [req.user.id, today], (err, todayPractice) => {
        if (err) {
          console.error('Get today practice error:', err);
          return res.status(500).json(error('获取失败，请稍后重试'));
        }

        res.json(success({
          content: todayContent,
          practice: todayPractice || null
        }));
      });
    });
  } catch (err) {
    console.error('Get today error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

router.get('/stats', authMiddleware, (req, res) => {
  const db = getDB();

  try {
    db.get(`
      SELECT total_meditation_minutes, meditation_days, last_meditation_date 
      FROM users 
      WHERE id = ?
    `, [req.user.id], (err, userStats) => {
      if (err) {
        console.error('Get user stats error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }

      db.get(`
        SELECT COUNT(*) as count 
        FROM user_plan_progress 
        WHERE user_id = ?
      `, [req.user.id], (err, activePlansResult) => {
        if (err) {
          console.error('Get active plans error:', err);
          return res.status(500).json(error('获取失败，请稍后重试'));
        }

        db.all(`
          SELECT practice_date, SUM(duration) as duration
          FROM daily_practices 
          WHERE user_id = ? AND practice_date >= date('now', '-30 days')
          GROUP BY practice_date
          ORDER BY practice_date
        `, [req.user.id], (err, practices30Days) => {
          if (err) {
            console.error('Get 30 days practices error:', err);
            return res.status(500).json(error('获取失败，请稍后重试'));
          }

          const today = new Date();
          const last30Days = [];
          for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const practice = practices30Days.find(p => p.practice_date === dateStr);
            last30Days.push({
              date: dateStr,
              duration: practice?.duration || 0
            });
          }

          res.json(success({
            totalMinutes: userStats.total_meditation_minutes || 0,
            meditationDays: userStats.meditation_days || 0,
            lastMeditationDate: userStats.last_meditation_date,
            activePlans: activePlansResult.count,
            chartData: last30Days
          }));
        });
      });
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

router.post('/record', authMiddleware, (req, res) => {
  const db = getDB();
  const { planId, duration, selfScore, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];

  if (!duration || duration <= 0) {
    return res.status(400).json(error('练习时长不能为空'));
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(`
      INSERT INTO daily_practices (user_id, plan_id, practice_date, duration, self_score, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, planId || null, today, duration, selfScore || null, notes || null], function(err) {
      if (err) {
        db.run('ROLLBACK');
        console.error('Record practice error:', err);
        return res.status(500).json(error('记录失败，请稍后重试'));
      }

      db.get('SELECT total_meditation_minutes, meditation_days, last_meditation_date FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Get user stats error:', err);
          return res.status(500).json(error('记录失败，请稍后重试'));
        }

        const isNewDay = user.last_meditation_date !== today;
        
        db.run(`
          UPDATE users 
          SET total_meditation_minutes = total_meditation_minutes + ?,
              meditation_days = meditation_days + ?,
              last_meditation_date = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [duration, isNewDay ? 1 : 0, today, req.user.id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Update user stats error:', err);
            return res.status(500).json(error('记录失败，请稍后重试'));
          }

          if (planId) {
            db.get('SELECT current_day, completed_days, total_minutes FROM user_plan_progress WHERE user_id = ? AND plan_id = ?', [req.user.id, planId], (err, progress) => {
              if (err) {
                db.run('ROLLBACK');
                console.error('Get plan progress error:', err);
                return res.status(500).json(error('记录失败，请稍后重试'));
              }
              
              if (progress) {
                const completedDays = JSON.parse(progress.completed_days || '[]');
                if (!completedDays.includes(progress.current_day)) {
                  completedDays.push(progress.current_day);
                }
                
                db.run(`
                  UPDATE user_plan_progress 
                  SET current_day = current_day + 1,
                      completed_days = ?,
                      total_minutes = total_minutes + ?,
                      last_practice_at = CURRENT_TIMESTAMP,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE user_id = ? AND plan_id = ?
                `, [JSON.stringify(completedDays), duration, req.user.id, planId], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('Update plan progress error:', err);
                    return res.status(500).json(error('记录失败，请稍后重试'));
                  }

                  db.run('COMMIT');
                  res.json(success({ recorded: true }, '记录成功'));
                });
              } else {
                db.run('COMMIT');
                res.json(success({ recorded: true }, '记录成功'));
              }
            });
          } else {
            db.run('COMMIT');
            res.json(success({ recorded: true }, '记录成功'));
          }
        });
      });
    });
  });
});

module.exports = router;
