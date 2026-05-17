const express = require('express');
const { success, error } = require('../utils/response');
const { getDB } = require('../config/database');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthMiddleware, (req, res) => {
  const db = getDB();
  const { page = 1, pageSize = 10, category } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = '';
    const params = [];
    
    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }

    db.all(`
      SELECT * FROM meditation_plans 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), parseInt(offset)], (err, plans) => {
      if (err) {
        console.error('Get plans error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }

      db.get(`SELECT COUNT(*) as total FROM meditation_plans ${whereClause}`, params, (err, countResult) => {
        if (err) {
          console.error('Get plans count error:', err);
          return res.status(500).json(error('获取失败，请稍后重试'));
        }

        if (req.user) {
          db.all(`
            SELECT plan_id, current_day, completed_days 
            FROM user_plan_progress 
            WHERE user_id = ?
          `, [req.user.id], (err, userPlans) => {
            if (err) {
              console.error('Get user plans error:', err);
              return res.status(500).json(error('获取失败，请稍后重试'));
            }
            
            const progressMap = new Map();
            userPlans.forEach(up => progressMap.set(up.plan_id, {
              currentDay: up.current_day,
              completedDays: JSON.parse(up.completed_days || '[]')
            }));

            plans.forEach(plan => {
              plan.userProgress = progressMap.get(plan.id) || null;
              plan.isJoined = !!progressMap.get(plan.id);
              
              if ((!req.user || req.user.is_vip !== 1) && !plan.is_free) {
                delete plan.audio_url;
                delete plan.guide_text;
              }
            });

            res.json(success({
              list: plans,
              total: countResult.total,
              page: parseInt(page),
              pageSize: parseInt(pageSize)
            }));
          });
        } else {
          plans.forEach(plan => {
            delete plan.audio_url;
            delete plan.guide_text;
          });

          res.json(success({
            list: plans,
            total: countResult.total,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }));
        }
      });
    });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

router.get('/:id', optionalAuthMiddleware, (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    db.get('SELECT * FROM meditation_plans WHERE id = ?', [id], (err, plan) => {
      if (err) {
        console.error('Get plan detail error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }
      
      if (!plan) {
        return res.status(404).json(error('计划不存在'));
      }

      if (req.user) {
        db.get(`
          SELECT current_day, completed_days, total_minutes, last_practice_at 
          FROM user_plan_progress 
          WHERE user_id = ? AND plan_id = ?
        `, [req.user.id, id], (err, progress) => {
          if (err) {
            console.error('Get plan progress error:', err);
            return res.status(500).json(error('获取失败，请稍后重试'));
          }
          
          plan.userProgress = progress ? {
            currentDay: progress.current_day,
            completedDays: JSON.parse(progress.completed_days || '[]'),
            totalMinutes: progress.total_minutes,
            lastPracticeAt: progress.last_practice_at
          } : null;
          plan.isJoined = !!progress;

          if ((!req.user || req.user.is_vip !== 1) && !plan.is_free) {
            delete plan.audio_url;
            delete plan.guide_text;
          }

          res.json(success(plan));
        });
      } else {
        delete plan.audio_url;
        delete plan.guide_text;
        res.json(success(plan));
      }
    });
  } catch (err) {
    console.error('Get plan detail error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

router.post('/:id/join', authMiddleware, (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    db.get('SELECT id, is_free FROM meditation_plans WHERE id = ?', [id], (err, plan) => {
      if (err) {
        console.error('Get plan error:', err);
        return res.status(500).json(error('加入失败，请稍后重试'));
      }
      
      if (!plan) {
        return res.status(404).json(error('计划不存在'));
      }

      if (!plan.is_free && req.user.is_vip !== 1) {
        return res.status(403).json(error('该计划仅对会员开放，请先开通会员'));
      }

      db.get('SELECT id FROM user_plan_progress WHERE user_id = ? AND plan_id = ?', [req.user.id, id], (err, existing) => {
        if (err) {
          console.error('Check existing plan error:', err);
          return res.status(500).json(error('加入失败，请稍后重试'));
        }
        
        if (existing) {
          return res.json(success({ joined: true }, '您已加入该计划'));
        }

        db.run(`
          INSERT INTO user_plan_progress (user_id, plan_id, current_day, completed_days)
          VALUES (?, ?, 1, '[]')
        `, [req.user.id, id], (err) => {
          if (err) {
            console.error('Join plan error:', err);
            return res.status(500).json(error('加入失败，请稍后重试'));
          }

          res.json(success({ joined: true }, '加入成功'));
        });
      });
    });
  } catch (err) {
    console.error('Join plan error:', err);
    res.status(500).json(error('加入失败，请稍后重试'));
  }
});

router.get('/user/my', authMiddleware, (req, res) => {
  const db = getDB();

  try {
    db.all(`
      SELECT p.*, upp.current_day, upp.completed_days, upp.total_minutes, upp.last_practice_at
      FROM user_plan_progress upp
      JOIN meditation_plans p ON upp.plan_id = p.id
      WHERE upp.user_id = ?
      ORDER BY upp.updated_at DESC
    `, [req.user.id], (err, myPlans) => {
      if (err) {
        console.error('Get my plans error:', err);
        return res.status(500).json(error('获取失败，请稍后重试'));
      }

      myPlans.forEach(plan => {
        plan.userProgress = {
          currentDay: plan.current_day,
          completedDays: JSON.parse(plan.completed_days || '[]'),
          totalMinutes: plan.total_minutes,
          lastPracticeAt: plan.last_practice_at
        };
        delete plan.current_day;
        delete plan.completed_days;
        delete plan.total_minutes;
        delete plan.last_practice_at;
        
        if (!plan.is_free && req.user.is_vip !== 1) {
          delete plan.audio_url;
          delete plan.guide_text;
        }
      });

      res.json(success(myPlans));
    });
  } catch (err) {
    console.error('Get my plans error:', err);
    res.status(500).json(error('获取失败，请稍后重试'));
  }
});

module.exports = router;
