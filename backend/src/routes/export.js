const express = require('express');
const db = require('../utils/db');
const { authenticateToken, logOperation } = require('../middleware/auth');
const { calculateGoalProgress, calculateKRProgress } = require('../utils/progress');
const dayjs = require('dayjs');

const router = express.Router();
router.use(authenticateToken);

router.get('/report/:year', (req, res) => {
  const { year } = req.params;
  const { privacy_mode = 'false' } = req.query;
  const userId = req.user.id;
  const isPrivacyMode = privacy_mode === 'true';
  
  const goals = db.prepare(`
    SELECT g.* FROM goals g 
    WHERE g.user_id = ? AND g.year = ?
    ORDER BY g.weight DESC
  `).all(userId, year);
  
  const goalsWithDetails = goals.map(goal => {
    const krs = db.prepare('SELECT * FROM key_results WHERE goal_id = ?').all(goal.id).map(kr => ({
      ...kr,
      progress: calculateKRProgress(kr.id),
      milestones: db.prepare('SELECT * FROM milestones WHERE key_result_id = ? ORDER BY target_date').all(kr.id),
      deviations: db.prepare('SELECT * FROM deviation_analyses WHERE key_result_id = ? ORDER BY created_at DESC').all(kr.id),
      execution_records: db.prepare('SELECT record_date, description, progress_value, time_spent FROM execution_records WHERE key_result_id = ? ORDER BY record_date DESC LIMIT 50').all(kr.id)
    }));
    
    return {
      ...goal,
      progress: calculateGoalProgress(goal.id),
      key_results: krs
    };
  });
  
  const deviations = db.prepare(`
    SELECT da.*, kr.title as kr_title, g.title as goal_title, g.dimension
    FROM deviation_analyses da
    JOIN key_results kr ON da.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE g.user_id = ? AND g.year = ?
    ORDER BY da.created_at DESC
  `).all(userId, year);
  
  const executionStats = db.prepare(`
    SELECT 
      COUNT(*) as total_records,
      SUM(time_spent) as total_time,
      DATE(record_date, '%Y-%m') as month
    FROM execution_records er
    JOIN key_results kr ON er.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE g.user_id = ? AND g.year = ?
    GROUP BY DATE(record_date, '%Y-%m')
    ORDER BY month
  `).all(userId, year);
  
  const habitStats = db.prepare(`
    SELECT 
      h.name,
      COUNT(hc.id) as checkin_count,
      h.frequency,
      strftime('%Y-%m', hc.checkin_date) as month
    FROM habits h
    LEFT JOIN habit_checkins hc ON h.id = hc.habit_id
    WHERE h.user_id = ? AND strftime('%Y', hc.checkin_date) = ?
    GROUP BY h.id, strftime('%Y-%m', hc.checkin_date)
  `).all(userId, year);
  
  const review = db.prepare('SELECT * FROM annual_reviews WHERE user_id = ? AND year = ?').get(userId, year);
  
  const timeline = buildTimeline(goalsWithDetails, deviations, executionStats);
  const actionItems = generateActionItems(goalsWithDetails, deviations, review);
  
  const report = {
    year,
    generated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    privacy_mode: isPrivacyMode,
    summary: {
      total_goals: goals.length,
      completed_goals: goalsWithDetails.filter(g => g.progress >= 100).length,
      total_krs: goalsWithDetails.reduce((sum, g) => sum + g.key_results.length, 0),
      completed_krs: goalsWithDetails.reduce((sum, g) => sum + g.key_results.filter(kr => kr.progress >= 100).length, 0),
      total_deviations: deviations.length,
      total_time: executionStats.reduce((sum, s) => sum + (s.total_time || 0), 0),
      average_progress: goals.length > 0 
        ? Math.round(goalsWithDetails.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0
    },
    goals: isPrivacyMode ? sanitizeData(goalsWithDetails) : goalsWithDetails,
    deviations: isPrivacyMode ? sanitizeData(deviations) : deviations,
    executionStats,
    habitStats,
    timeline,
    action_items: actionItems,
    review: isPrivacyMode ? sanitizeData(review) : review
  };
  
  logOperation(req, 'export_report', 'report', null, { year, privacy_mode: isPrivacyMode });
  
  res.json(report);
});

function buildTimeline(goals, deviations, executionStats) {
  const events = [];
  
  goals.forEach(goal => {
    goal.key_results.forEach(kr => {
      kr.milestones.forEach(m => {
        events.push({
          date: m.target_date,
          type: 'milestone',
          title: m.title,
          completed: m.is_completed === 1,
          goal: goal.title,
          kr: kr.title
        });
      });
      
      kr.execution_records.forEach(r => {
        events.push({
          date: r.record_date,
          type: 'execution',
          title: r.description,
          progress: r.progress_value,
          goal: goal.title,
          kr: kr.title
        });
      });
      
      kr.deviations.forEach(d => {
        events.push({
          date: d.created_at.substring(0, 10),
          type: 'deviation',
          title: `${d.type}: ${d.reason}`,
          goal: goal.title,
          kr: kr.title
        });
      });
    });
  });
  
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function generateActionItems(goals, deviations, review) {
  const items = [];
  
  goals.forEach(goal => {
    goal.key_results.forEach(kr => {
      if (kr.progress < 100 && kr.status !== 'cancelled') {
        items.push({
          type: 'incomplete_kr',
          priority: 'high',
          title: `完成关键结果: ${kr.title}`,
          goal: goal.title,
          current_progress: kr.progress,
          suggestion: '制定详细的执行计划，每周追踪进度'
        });
      }
      
      kr.milestones.forEach(m => {
        if (!m.is_completed && new Date(m.target_date) < new Date()) {
          items.push({
            type: 'overdue_milestone',
            priority: 'high',
            title: `逾期里程碑: ${m.title}`,
            goal: goal.title,
            kr: kr.title,
            target_date: m.target_date,
            suggestion: '评估延期原因，重新设置目标日期'
          });
        }
      });
    });
  });
  
  deviations.forEach(d => {
    if (!d.solution) {
      items.push({
        type: 'unsolved_deviation',
        priority: 'medium',
        title: `未解决的偏差: ${d.type}`,
        reason: d.reason,
        suggestion: '制定解决方案并跟踪执行'
      });
    }
  });
  
  if (review && review.next_year_suggestions) {
    items.push({
      type: 'next_year_suggestion',
      priority: 'low',
      title: '下一年度建议',
      content: review.next_year_suggestions,
      suggestion: '在制定明年目标时参考这些建议'
    });
  }
  
  return items;
}

function sanitizeData(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    const sensitiveFields = ['description', 'reason', 'impact', 'solution', 'evidence', 
      'summary', 'achievements', 'harvest', 'regrets', 'lessons', 'next_year_suggestions', 'note'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[隐私保护]';
      }
    });
    
    return sanitized;
  }
  
  return data;
}

router.get('/years', (req, res) => {
  const userId = req.user.id;
  
  const years = db.prepare(`
    SELECT DISTINCT year FROM goals WHERE user_id = ?
    UNION
    SELECT DISTINCT year FROM annual_reviews WHERE user_id = ?
    ORDER BY year DESC
  `).all(userId, userId);
  
  res.json({ years: years.map(y => y.year) });
});

module.exports = router;
