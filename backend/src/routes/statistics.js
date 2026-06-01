const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE status = 1').get().count;
  
  const totalAssessments = db.prepare('SELECT COUNT(*) as count FROM risk_assessments').get().count;
  
  const highRiskCount = db.prepare(`
    SELECT COUNT(*) as count FROM risk_assessments 
    WHERE risk_level IN ('high', 'critical') AND status != 'closed'
  `).get().count;
  
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM recovery_tasks').get().count;
  
  const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM recovery_tasks WHERE status = 'pending'").get().count;
  
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM recovery_tasks WHERE status = 'completed'").get().count;
  
  const totalRecovered = db.prepare('SELECT SUM(recovered_amount) as total FROM recovery_tasks WHERE status = \'completed\'').get().total || 0;
  
  const recoveryRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const riskDistribution = db.prepare(`
    SELECT risk_level, COUNT(*) as count 
    FROM risk_assessments 
    GROUP BY risk_level
  `).all();
  
  const taskStatusDistribution = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM recovery_tasks 
    GROUP BY status
  `).all();
  
  const regionDistribution = db.prepare(`
    SELECT region, COUNT(*) as count 
    FROM customers 
    WHERE status = 1 AND region IS NOT NULL
    GROUP BY region
  `).all();
  
  const recentAssessments = db.prepare(`
    SELECT ra.*, c.name as customer_name, c.customer_no
    FROM risk_assessments ra
    LEFT JOIN customers c ON ra.customer_id = c.id
    ORDER BY ra.assessment_time DESC
    LIMIT 10
  `).all();
  
  const recentTasks = db.prepare(`
    SELECT rt.*, c.name as customer_name, u.name as assignee_name
    FROM recovery_tasks rt
    LEFT JOIN customers c ON rt.customer_id = c.id
    LEFT JOIN users u ON rt.assignee_id = u.id
    ORDER BY rt.created_at DESC
    LIMIT 10
  `).all();
  
  res.json({
    overview: {
      totalCustomers,
      totalAssessments,
      highRiskCount,
      totalTasks,
      pendingTasks,
      completedTasks,
      totalRecovered,
      recoveryRate
    },
    riskDistribution,
    taskStatusDistribution,
    regionDistribution,
    recentAssessments,
    recentTasks
  });
});

router.get('/trend', (req, res) => {
  const { days = 30 } = req.query;
  
  const dailyStats = db.prepare(`
    SELECT 
      DATE(created_at) as stat_date,
      COUNT(*) as count
    FROM risk_assessments
    WHERE created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY stat_date ASC
  `).all(days);
  
  const dailyTasks = db.prepare(`
    SELECT 
      DATE(created_at) as stat_date,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM recovery_tasks
    WHERE created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY stat_date ASC
  `).all(days);
  
  res.json({ dailyStats, dailyTasks });
});

router.get('/export', (req, res) => {
  const { type = 'assessments' } = req.query;
  
  let data;
  
  if (type === 'assessments') {
    data = db.prepare(`
      SELECT ra.assessment_no, c.customer_no, c.name as customer_name, 
             ra.risk_score, ra.risk_level, ra.status, ra.assessment_time,
             ra.risk_reasons, ra.review_result
      FROM risk_assessments ra
      LEFT JOIN customers c ON ra.customer_id = c.id
      ORDER BY ra.assessment_time DESC
    `).all();
  } else if (type === 'tasks') {
    data = db.prepare(`
      SELECT rt.task_no, c.customer_no, c.name as customer_name,
             rt.task_type, rt.task_title, rt.priority, rt.status,
             rt.due_date, rt.execution_result, rt.recovered_amount,
             rt.created_at
      FROM recovery_tasks rt
      LEFT JOIN customers c ON rt.customer_id = c.id
      ORDER BY rt.created_at DESC
    `).all();
  } else {
    data = db.prepare(`
      SELECT customer_no, name, company, industry, level, 
             contact_name, contact_phone, region, total_amount,
             last_payment_date, expiration_date, status
      FROM customers
      ORDER BY created_at DESC
    `).all();
  }
  
  res.json({ type, data });
});

module.exports = router;
