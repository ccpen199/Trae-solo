const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/plans', (req, res) => {
  db.all('SELECT * FROM vip_plans ORDER BY sort_order ASC', (err, plans) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取VIP套餐失败'
      });
    }

    res.json({
      success: true,
      data: plans
    });
  });
});

router.post('/subscribe', authenticateToken, (req, res) => {
  const { plan_id } = req.body;
  const userId = req.user.id;

  db.get('SELECT * FROM vip_plans WHERE id = ?', [plan_id], (err, plan) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '数据库错误'
      });
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '套餐不存在'
      });
    }

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      let newExpireDate;
      const now = new Date();
      const currentExpire = user.vip_expire_at ? new Date(user.vip_expire_at) : now;
      const startDate = currentExpire > now ? currentExpire : now;
      
      newExpireDate = new Date(startDate);
      newExpireDate.setDate(newExpireDate.getDate() + plan.duration_days);

      db.run(
        'UPDATE users SET is_vip = 1, vip_expire_at = ? WHERE id = ?',
        [newExpireDate.toISOString(), userId],
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: '开通VIP失败'
            });
          }

          res.json({
            success: true,
            message: '开通VIP成功',
            data: {
              vip_expire_at: newExpireDate.toISOString()
            }
          });
        }
      );
    });
  });
});

module.exports = router;
