const express = require('express');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../utils/auth');

const router = express.Router();

router.get('/agencies', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.query;
  
  let query = `SELECT * FROM agencies`;
  const params = [];
  
  if (status) {
    query += ` WHERE verification_status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  db.all(query, params, (err, agencies) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: agencies });
  });
});

router.post('/agencies/:id/verify', authMiddleware, adminMiddleware, (req, res) => {
  const { status, qualification_level, notes } = req.body;
  
  db.run(
    `UPDATE agencies SET verification_status = ?, qualification_level = ?, verified_at = DATETIME('now') WHERE id = ?`,
    [status, qualification_level, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: '机构资质核验完成' });
    }
  );
});

router.get('/cases', authMiddleware, adminMiddleware, (req, res) => {
  db.all(
    `SELECT c.*, u.username as user_name, a.name as agency_name 
     FROM cases c 
     LEFT JOIN users u ON c.user_id = u.id 
     LEFT JOIN agencies a ON c.agency_id = a.id 
     ORDER BY c.updated_at DESC`,
    (err, cases) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, data: cases });
    }
  );
});

router.post('/cases/:id/progress', authMiddleware, adminMiddleware, (req, res) => {
  const { status, description, official_feedback } = req.body;
  
  const aiInterpretation = `【智能解读】根据最新官方反馈，当前案件状态为${status}。${description}。建议：及时关注后续审查意见，准备相关答复材料。`;
  
  db.run(
    `INSERT INTO case_progress_logs (case_id, status, description, official_document_url, ai_interpretation) 
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, status, description, official_feedback, aiInterpretation],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        `UPDATE cases SET status = ?, official_feedback = ?, updated_at = DATETIME('now') WHERE id = ?`,
        [status, official_feedback, req.params.id]
      );
      
      db.get(`SELECT user_id FROM cases WHERE id = ?`, [req.params.id], (err, row) => {
        if (row) {
          db.run(
            `INSERT INTO notifications (user_id, type, title, content, related_id, related_type) 
             VALUES (?, 'case_progress', ?, ?, ?, 'case')`,
            [row.user_id, `案件进度更新: ${status}`, description, req.params.id]
          );
        }
      });
      
      res.json({ success: true, message: '案件进度已更新，推送通知已发送', ai_interpretation: aiInterpretation });
    }
  );
});

router.get('/portfolio/evaluate/:user_id', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.params.user_id;
  
  db.get(`SELECT COUNT(*) as count FROM trademarks WHERE user_id = ?`, [userId], (err, tm) => {
    db.get(`SELECT COUNT(*) as count FROM patents WHERE user_id = ?`, [userId], (err, pt) => {
      db.get(`SELECT COUNT(*) as count FROM copyrights WHERE user_id = ?`, [userId], (err, cr) => {
        const trademarkValue = tm.count * 15000;
        const patentValue = pt.count * 50000;
        const copyrightValue = cr.count * 3000;
        const totalValue = trademarkValue + patentValue + copyrightValue;
        
        const riskScore = Math.min(100, Math.floor(Math.random() * 40 + 30));
        
        db.run(
          `INSERT OR REPLACE INTO ip_portfolio (id, user_id, total_trademarks, total_patents, total_copyrights, estimated_value, risk_score, last_evaluated_at) 
           VALUES (
             (SELECT id FROM ip_portfolio WHERE user_id = ?),
             ?, ?, ?, ?, ?, ?, DATETIME('now')
           )`,
          [userId, userId, tm.count, pt.count, cr.count, totalValue, riskScore],
          function() {
            res.json({
              success: true,
              data: {
                total_trademarks: tm.count,
                total_patents: pt.count,
                total_copyrights: cr.count,
                estimated_value: totalValue,
                risk_score: riskScore,
                value_breakdown: {
                  trademarks: trademarkValue,
                  patents: patentValue,
                  copyrights: copyrightValue
                },
                risk_factors: [
                  '专利年费缴纳监控',
                  '商标续展提醒',
                  '侵权风险监测'
                ]
              }
            });
          }
        );
      });
    });
  });
});

router.post('/cross-border/recommend', authMiddleware, (req, res) => {
  const { target_countries, ip_types, business_nature } = req.body;
  
  let strategyType = 'paris_convention';
  let recommendation = '';
  let estimatedCost = 0;
  let timeline = '';
  
  if (target_countries && target_countries.length > 3) {
    strategyType = 'madrid_system';
    recommendation = '鉴于目标国家数量较多，建议采用马德里体系进行商标国际注册，可一次申请指定多个成员国，降低申请成本和管理复杂度。';
    estimatedCost = target_countries.length * 8000 + 20000;
    timeline = '12-18个月';
  } else {
    recommendation = '建议采用巴黎公约途径，可享有6个月优先权期，逐国申请更具针对性。专利方面建议通过PCT途径进入国家阶段。';
    estimatedCost = (target_countries?.length || 1) * 15000;
    timeline = '18-24个月';
  }
  
  db.run(
    `INSERT INTO cross_border_layouts (user_id, target_countries, strategy_type, recommendation, estimated_cost, timeline, status) 
     VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
    [req.userId, JSON.stringify(target_countries), strategyType, recommendation, estimatedCost, timeline],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        success: true,
        data: {
          id: this.lastID,
          strategy_type: strategyType,
          recommendation,
          estimated_cost: estimatedCost,
          timeline,
          key_points: [
            '优先权期限监控',
            '目标国家法律调研',
            '语言翻译准备',
            '当地代理机构选聘'
          ]
        }
      });
    }
  );
});

router.get('/dashboard/stats', authMiddleware, (req, res) => {
  const userId = req.userId;
  
  db.get(`SELECT COUNT(*) as count FROM trademarks WHERE user_id = ?`, [userId], (err, tm) => {
    db.get(`SELECT COUNT(*) as count FROM patents WHERE user_id = ?`, [userId], (err, pt) => {
      db.get(`SELECT COUNT(*) as count FROM copyrights WHERE user_id = ?`, [userId], (err, cr) => {
        db.get(`SELECT COUNT(*) as count FROM cases WHERE user_id = ?`, [userId], (err, cases) => {
          db.all(`SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 5`, [userId], (err, notifications) => {
            db.all(`SELECT * FROM patent_fee_reminders pfr LEFT JOIN patents p ON pfr.patent_id = p.id WHERE p.user_id = ? AND pfr.status = 'pending' AND julianday(pfr.due_date) - julianday('now') <= 30`, [userId], (err, fees) => {
              res.json({
                success: true,
                data: {
                  summary: {
                    trademarks: tm.count,
                    patents: pt.count,
                    copyrights: cr.count,
                    cases: cases.count
                  },
                  pending_fees: fees,
                  notifications: notifications
                }
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
