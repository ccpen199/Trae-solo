const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { ROLES } = require('../engines/permissionRuleEngine');

const router = express.Router();

router.get('/dashboard', authenticateToken, (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.KNOWLEDGE_MANAGER;

  const docCounts = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM documents 
    WHERE is_deleted = 0
    GROUP BY status
  `).all();

  const statusCounts = {};
  docCounts.forEach(c => {
    statusCounts[c.status] = c.count;
  });

  let myCreatedCount = 0;
  let myResponsibleCount = 0;
  let myTodoCount = 0;

  if (!isAdmin) {
    myCreatedCount = db.prepare(`
      SELECT COUNT(*) as count FROM documents WHERE created_by = ? AND is_deleted = 0
    `).get(req.user.id).count;

    myResponsibleCount = db.prepare(`
      SELECT COUNT(*) as count FROM documents WHERE responsible_id = ? AND is_deleted = 0
    `).get(req.user.id).count;
  }

  myTodoCount = db.prepare(`
    SELECT COUNT(*) as count FROM todo_messages WHERE user_id = ? AND is_read = 0
  `).get(req.user.id).count;

  const recentDocuments = db.prepare(`
    SELECT d.id, d.main_order_no, d.title, d.status, d.created_at, u.name as creator_name
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE d.is_deleted = 0
    ORDER BY d.updated_at DESC
    LIMIT 10
  `).all();

  const stats = {
    totalDocuments: docCounts.reduce((sum, c) => sum + c.count, 0),
    byStatus: statusCounts,
    pendingCreation: statusCounts['pending_creation'] || 0,
    pendingReview: statusCounts['pending_review'] || 0,
    published: statusCounts['published'] || 0,
    pendingUse: statusCounts['pending_use'] || 0,
    pendingUpdate: statusCounts['pending_update'] || 0,
    recentDocuments,
    myTodoCount
  };

  if (!isAdmin) {
    stats.myCreatedCount = myCreatedCount;
    stats.myResponsibleCount = myResponsibleCount;
  }

  res.json(stats);
});

router.get('/documents-by-status', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { start_date, end_date } = req.query;

  let query = `
    SELECT status, COUNT(*) as count 
    FROM documents 
    WHERE is_deleted = 0
  `;
  const params = [];

  if (start_date) {
    query += ' AND DATE(created_at) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(created_at) <= ?';
    params.push(end_date);
  }

  query += ' GROUP BY status';

  const results = db.prepare(query).all(...params);
  res.json({ results });
});

router.get('/workflow-overview', authenticateToken, (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.KNOWLEDGE_MANAGER;

  const workflowStats = db.prepare(`
    SELECT 
      ws.step_name,
      ws.status,
      COUNT(*) as count
    FROM workflow_steps ws
    JOIN documents d ON ws.document_id = d.id
    WHERE d.is_deleted = 0
    GROUP BY ws.step_name, ws.status
  `).all();

  const stepStats = {};
  workflowStats.forEach(s => {
    if (!stepStats[s.step_name]) {
      stepStats[s.step_name] = {};
    }
    stepStats[s.step_name][s.status] = s.count;
  });

  const activeSteps = db.prepare(`
    SELECT 
      ws.step_name,
      ws.status,
      d.main_order_no,
      d.title,
      d.id as document_id,
      u.name as handler_name
    FROM workflow_steps ws
    JOIN documents d ON ws.document_id = d.id
    LEFT JOIN users u ON ws.handler_id = u.id
    WHERE d.is_deleted = 0 AND ws.status IN ('pending', 'in_progress')
    ORDER BY ws.started_at DESC
    LIMIT 20
  `).all();

  res.json({
    stepStats,
    activeSteps,
    isAdmin
  });
});

router.get('/my-documents', authenticateToken, (req, res) => {
  const created = db.prepare(`
    SELECT d.id, d.main_order_no, d.title, d.status, d.created_at, d.updated_at
    FROM documents d
    WHERE d.created_by = ? AND d.is_deleted = 0
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  const responsible = db.prepare(`
    SELECT d.id, d.main_order_no, d.title, d.status, d.created_at, d.updated_at
    FROM documents d
    WHERE d.responsible_id = ? AND d.is_deleted = 0
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  res.json({ created, responsible });
});

module.exports = router;
