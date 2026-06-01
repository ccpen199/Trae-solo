const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/overview', (req, res) => {
  const db = getDb();
  
  const pendingCases = db.prepare(`
    SELECT COUNT(*) as count FROM infection_cases WHERE status = 'pending'
  `).get().count;
  
  const confirmedCases = db.prepare(`
    SELECT COUNT(*) as count FROM infection_cases WHERE status = 'confirmed'
  `).get().count;
  
  const pendingAlerts = db.prepare(`
    SELECT COUNT(*) as count FROM outbreak_alerts WHERE status = 'pending'
  `).get().count;
  
  const pendingTasks = db.prepare(`
    SELECT COUNT(*) as count FROM rectification_tasks WHERE status IN ('pending', 'in_progress', 'for_review')
  `).get().count;
  
  const overdueTasks = db.prepare(`
    SELECT COUNT(*) as count FROM rectification_tasks 
    WHERE status IN ('pending', 'in_progress') AND due_date < DATE('now')
  `).get().count;
  
  res.json({
    pendingCases,
    confirmedCases,
    pendingAlerts,
    pendingTasks,
    overdueTasks
  });
});

router.get('/infection-rate', (req, res) => {
  const db = getDb();
  
  const rates = db.prepare(`
    SELECT d.id, d.name, d.bed_count,
           COUNT(CASE WHEN ic.status = 'confirmed' THEN 1 END) as confirmed_count,
           ROUND(COUNT(CASE WHEN ic.status = 'confirmed' THEN 1 END) * 100.0 / NULLIF(d.bed_count, 0), 2) as infection_rate
    FROM departments d
    LEFT JOIN infection_cases ic ON d.id = ic.department_id
    GROUP BY d.id, d.name, d.bed_count
    ORDER BY infection_rate DESC
  `).all();
  
  res.json(rates);
});

router.get('/cases-by-department', (req, res) => {
  const db = getDb();
  
  const data = db.prepare(`
    SELECT d.id, d.name,
           COUNT(CASE WHEN ic.status = 'pending' THEN 1 END) as pending,
           COUNT(CASE WHEN ic.status = 'confirmed' THEN 1 END) as confirmed,
           COUNT(CASE WHEN ic.status = 'rejected' THEN 1 END) as rejected,
           COUNT(*) as total
    FROM departments d
    LEFT JOIN infection_cases ic ON d.id = ic.department_id
    GROUP BY d.id, d.name
    ORDER BY total DESC
  `).all();
  
  res.json(data);
});

router.get('/false-positive-rate', (req, res) => {
  const db = getDb();
  
  const data = db.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
      ROUND(COUNT(CASE WHEN status = 'rejected' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as false_positive_rate
    FROM infection_cases
    WHERE status IN ('confirmed', 'rejected')
  `).get();
  
  res.json(data);
});

router.get('/pathogens', (req, res) => {
  const db = getDb();
  
  const data = db.prepare(`
    SELECT pathogen, COUNT(*) as count
    FROM infection_cases
    WHERE pathogen IS NOT NULL AND status = 'confirmed'
    GROUP BY pathogen
    ORDER BY count DESC
  `).all();
  
  res.json(data);
});

router.get('/tasks-overdue', (req, res) => {
  const db = getDb();
  
  const data = db.prepare(`
    SELECT d.id, d.name,
           COUNT(CASE WHEN rt.status IN ('pending', 'in_progress') AND rt.due_date < DATE('now') THEN 1 END) as overdue,
           COUNT(CASE WHEN rt.status IN ('pending', 'in_progress') THEN 1 END) as total
    FROM departments d
    LEFT JOIN rectification_tasks rt ON d.id = rt.department_id
    GROUP BY d.id, d.name
    HAVING overdue > 0
    ORDER BY overdue DESC
  `).all();
  
  res.json(data);
});

module.exports = router;
