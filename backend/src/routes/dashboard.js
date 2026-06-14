const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

router.get('/overview', (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM enterprises) as total_enterprises,
      (SELECT COUNT(*) FROM enterprises WHERE status = '正常') as normal_enterprises,
      (SELECT COUNT(*) FROM enterprises WHERE status = '经营异常') as abnormal_enterprises,
      (SELECT COUNT(*) FROM judicial_records) as total_judicial,
      (SELECT COUNT(*) FROM bidding_records WHERE winning_status = '中标') as total_winning_bids,
      (SELECT COUNT(*) FROM bid_rigging_suspects WHERE status != '已排除') as rigging_suspects,
      (SELECT COUNT(*) FROM subcontractor_blacklist WHERE status = '黑名单中') as blacklist_count,
      (SELECT COUNT(*) FROM business_abnormalities WHERE status = '未移除') as pending_abnormalities
  `).get();
  
  const riskDistribution = db.prepare(`
    SELECT COALESCE(h.risk_level, '中风险') as risk_level, COUNT(*) as count
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    GROUP BY COALESCE(h.risk_level, '中风险')
  `).all();
  
  res.json({
    stats,
    riskDistribution
  });
});

router.get('/health-scores', (req, res) => {
  const { page = 1, pageSize = 10, riskLevel } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT e.name, e.unified_social_credit, e.status,
           e.id as enterprise_id,
           COALESCE(h.total_score, 75) as total_score,
           COALESCE(h.business_score, 20) as business_score,
           COALESCE(h.judicial_score, 18) as judicial_score,
           COALESCE(h.bidding_score, 12) as bidding_score,
           COALESCE(h.qualification_score, 12) as qualification_score,
           COALESCE(h.personnel_score, 8) as personnel_score,
           COALESCE(h.credit_score, 5) as credit_score,
           COALESCE(h.risk_level, '中风险') as risk_level,
           h.personnel_score_details,
           h.credit_score_details,
           h.business_score_details,
           h.judicial_score_details
    FROM enterprises e
    LEFT JOIN health_scores h ON h.enterprise_id = e.id
  `;
  let countSql = `SELECT COUNT(*) as count FROM enterprises e LEFT JOIN health_scores h ON h.enterprise_id = e.id`;
  let params = [];
  let countParams = [];
  
  if (riskLevel) {
    sql += ` WHERE COALESCE(h.risk_level, '中风险') = ?`;
    countSql += ` WHERE COALESCE(h.risk_level, '中风险') = ?`;
    params = [riskLevel];
    countParams = [riskLevel];
  }
  
  sql += ` ORDER BY COALESCE(h.total_score, 75) ASC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  
  list.forEach(item => {
    try {
      if (item.personnel_score_details) {
        item.personnel_score_details = JSON.parse(item.personnel_score_details);
      }
      if (item.credit_score_details) {
        item.credit_score_details = JSON.parse(item.credit_score_details);
      }
      if (item.business_score_details) {
        item.business_score_details = JSON.parse(item.business_score_details);
      }
      if (item.judicial_score_details) {
        item.judicial_score_details = JSON.parse(item.judicial_score_details);
      }
    } catch (e) {}
  });
  
  const { count } = db.prepare(countSql).get(...countParams);
  
  res.json({
    list,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/health-scores/:id/details', (req, res) => {
  const { id } = req.params;
  
  const score = db.prepare(`
    SELECT h.*, e.name, e.unified_social_credit
    FROM health_scores h
    JOIN enterprises e ON h.enterprise_id = e.id
    WHERE h.enterprise_id = ?
  `).get(id);
  
  if (!score) {
    return res.status(404).json({ error: '评分记录不存在' });
  }
  
  try {
    ['personnel_score_details', 'credit_score_details', 'business_score_details', 
     'judicial_score_details', 'bidding_score_details', 'qualification_score_details'].forEach(field => {
      if (score[field]) {
        score[field] = JSON.parse(score[field]);
      }
    });
  } catch (e) {}
  
  res.json(score);
});

router.get('/abnormal-alerts', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const list = db.prepare(`
    SELECT ba.*, e.name as enterprise_name, e.unified_social_credit
    FROM business_abnormalities ba
    JOIN enterprises e ON ba.enterprise_id = e.id
    WHERE ba.status = '未移除'
    ORDER BY ba.decision_date DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  list.forEach(item => {
    if (item.display_deadline) {
      const days = Math.ceil((new Date(item.display_deadline) - new Date()) / (1000 * 60 * 60 * 24));
      item.countdown_days = Math.max(0, days);
      item.expiry_status = days <= 0 ? '已到期' : (days <= 7 ? '即将到期' : '公示中');
    }
  });
  
  const { count } = db.prepare(`
    SELECT COUNT(*) as count FROM business_abnormalities WHERE status = '未移除'
  `).get();
  
  res.json({
    list,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/bid-rigging-suspects', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const list = db.prepare(`
    SELECT br.*, e.name as enterprise_name, e.unified_social_credit
    FROM bid_rigging_suspects br
    JOIN enterprises e ON br.enterprise_id = e.id
    WHERE br.status != '已排除'
    ORDER BY br.bidding_date DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  list.forEach(item => {
    if (item.display_deadline) {
      const days = Math.ceil((new Date(item.display_deadline) - new Date()) / (1000 * 60 * 60 * 24));
      item.countdown_days = Math.max(0, days);
      item.expiry_status = days <= 0 ? '已到期' : (days <= 7 ? '即将到期' : '公示中');
    }
  });
  
  const { count } = db.prepare(`
    SELECT COUNT(*) as count FROM bid_rigging_suspects WHERE status != '已排除'
  `).get();
  
  res.json({
    list,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/blacklist', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const list = db.prepare(`
    SELECT bl.*, e.name as enterprise_name, e.unified_social_credit
    FROM subcontractor_blacklist bl
    JOIN enterprises e ON bl.enterprise_id = e.id
    WHERE bl.status = '黑名单中'
    ORDER BY bl.inclusion_date DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  list.forEach(item => {
    if (item.display_deadline) {
      const days = Math.ceil((new Date(item.display_deadline) - new Date()) / (1000 * 60 * 60 * 24));
      item.countdown_days = Math.max(0, days);
      item.expiry_status = days <= 0 ? '已到期' : (days <= 7 ? '即将到期' : '公示中');
    }
    item.can_apply_repair = item.credit_repair_available === 1 && item.credit_repair_status !== 'repairing';
  });
  
  const { count } = db.prepare(`
    SELECT COUNT(*) as count FROM subcontractor_blacklist WHERE status = '黑名单中'
  `).get();
  
  res.json({
    list,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/risk-rule-hits', (req, res) => {
  const { page = 1, pageSize = 10, enterpriseId } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT 
      rhr.id,
      rhr.rule_id,
      rhr.enterprise_id,
      rhr.rule_name,
      rhr.rule_level,
      rhr.trigger_reason,
      rhr.action_type,
      rhr.action_result,
      rhr.processing_status,
      rhr.processing_result,
      rhr.reviewer,
      rhr.review_time,
      rhr.created_at as hit_time,
      e.name as enterprise_name,
      rr.hit_count,
      rr.last_hit_at,
      rr.is_enabled
    FROM rule_hit_records rhr
    LEFT JOIN enterprises e ON rhr.enterprise_id = e.id
    LEFT JOIN risk_rules rr ON rhr.rule_id = rr.id
    WHERE 1=1
  `;
  let params = [];
  
  if (enterpriseId) {
    sql += ` AND rhr.enterprise_id = ?`;
    params.push(parseInt(enterpriseId));
  }
  
  sql += ` ORDER BY rhr.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  
  list.forEach(item => {
    if (item.action_type) {
      const actionMap = {
        'downgrade': '自动降级',
        'blacklist': '加入黑名单',
        'warn': '风险预警',
        'remind': '自动提醒',
        'mark': '标记风险'
      };
      item.action_type_desc = actionMap[item.action_type] || item.action_type;
    }
    
    if (item.rule_level) {
      const levelMap = {
        'high': '高风险',
        'medium': '中风险',
        'low': '低风险'
      };
      item.rule_level_desc = levelMap[item.rule_level] || item.rule_level;
    }
  });
  
  const countSql = `SELECT COUNT(*) as total FROM rule_hit_records rhr WHERE 1=1`;
  let countParams = [];
  if (enterpriseId) {
    countSql += ` AND rhr.enterprise_id = ?`;
    countParams.push(parseInt(enterpriseId));
  }
  const total = db.prepare(countSql).get(...countParams).total;
  
  res.json({
    list,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/due-diligence-status', (req, res) => {
  const list = db.prepare(`
    SELECT d.*, e.name as enterprise_name
    FROM due_diligence_reports d
    JOIN enterprises e ON d.enterprise_id = e.id
    ORDER BY d.created_at DESC
    LIMIT 10
  `).all();
  
  res.json(list);
});

router.get('/offline-archives-status', (req, res) => {
  const list = db.prepare(`
    SELECT o.*, e.name as enterprise_name, e.unified_social_credit
    FROM offline_archives o
    JOIN enterprises e ON o.enterprise_id = e.id
    ORDER BY o.downloaded_at DESC
    LIMIT 10
  `).all();
  
  res.json(list);
});

router.post('/blacklist/check', (req, res) => {
  const { enterpriseIds } = req.body;
  
  if (!Array.isArray(enterpriseIds) || enterpriseIds.length === 0) {
    return res.json({ inBlacklist: [], details: [] });
  }
  
  const placeholders = enterpriseIds.map(() => '?').join(',');
  const list = db.prepare(`
    SELECT bl.*, e.name as enterprise_name
    FROM subcontractor_blacklist bl
    JOIN enterprises e ON bl.enterprise_id = e.id
    WHERE bl.enterprise_id IN (${placeholders}) AND bl.status = '黑名单中'
  `).all(...enterpriseIds);
  
  res.json({
    inBlacklist: list.map(item => item.enterprise_id),
    details: list
  });
});

router.get('/risk-trend', (req, res) => {
  const data = db.prepare(`
    SELECT 
      date(calculated_at, 'start of month') as month,
      AVG(total_score) as avg_score,
      SUM(CASE WHEN risk_level = '高风险' THEN 1 ELSE 0 END) as high_risk_count,
      SUM(CASE WHEN risk_level = '中风险' THEN 1 ELSE 0 END) as medium_risk_count,
      SUM(CASE WHEN risk_level = '低风险' THEN 1 ELSE 0 END) as low_risk_count
    FROM health_scores
    GROUP BY date(calculated_at, 'start of month')
    ORDER BY month DESC
    LIMIT 12
  `).all();
  
  res.json(data.reverse());
});

module.exports = router;
