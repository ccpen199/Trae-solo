const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/overview', (req, res) => {
  const totalCases = db.prepare('SELECT COUNT(*) as count FROM cases').get().count;
  const scheduledCases = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = ?').get('scheduled').count;
  const pendingCases = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = ?').get('pending_scheduling').count;
  const postponedCases = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = ?').get('postponed').count;

  const totalSchedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE status != ?').get('cancelled').count;
  const completedSchedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE status = ?').get('completed').count;

  const pendingNotifications = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE status = ?').get('pending').count;
  const failedNotifications = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE status = ?').get('failed').count;

  res.json({
    cases: {
      total: totalCases,
      scheduled: scheduledCases,
      pending: pendingCases,
      postponed: postponedCases
    },
    schedules: {
      total: totalSchedules,
      completed: completedSchedules
    },
    notifications: {
      pending: pendingNotifications,
      failed: failedNotifications
    }
  });
});

router.get('/by-court', (req, res) => {
  const { start_date, end_date } = req.query;
  const data = db.prepare(`
    SELECT ct.id, ct.name as court_name, COUNT(s.id) as schedule_count
    FROM courts ct
    LEFT JOIN schedules s ON ct.id = s.court_id 
      AND s.status != 'cancelled'
      AND (DATE(s.start_time) BETWEEN DATE(?) AND DATE(?) OR ? IS NULL)
    GROUP BY ct.id, ct.name
    ORDER BY schedule_count DESC
  `).all(start_date || '1970-01-01', end_date || '2099-12-31', start_date);

  res.json(data);
});

router.get('/by-judge', (req, res) => {
  const { start_date, end_date } = req.query;
  const data = db.prepare(`
    SELECT j.id, j.name as judge_name, j.title, COUNT(s.id) as schedule_count
    FROM judges j
    LEFT JOIN schedules s ON j.id = s.judge_id 
      AND s.status != 'cancelled'
      AND (DATE(s.start_time) BETWEEN DATE(?) AND DATE(?) OR ? IS NULL)
    GROUP BY j.id, j.name, j.title
    ORDER BY schedule_count DESC
  `).all(start_date || '1970-01-01', end_date || '2099-12-31', start_date);

  res.json(data);
});

router.get('/by-case-type', (req, res) => {
  const data = db.prepare(`
    SELECT case_type, COUNT(*) as count
    FROM cases
    GROUP BY case_type
  `).all();

  res.json(data);
});

router.get('/schedules-daily', (req, res) => {
  const { start_date, end_date } = req.query;
  const data = db.prepare(`
    SELECT DATE(start_time) as date, COUNT(*) as count
    FROM schedules
    WHERE status != 'cancelled'
    AND DATE(start_time) BETWEEN DATE(?) AND DATE(?)
    GROUP BY DATE(start_time)
    ORDER BY date
  `).all(start_date, end_date);

  res.json(data);
});

router.get('/drilldown', (req, res) => {
  const { type, id, start_date, end_date } = req.query;
  let query, params;

  if (type === 'court') {
    query = `
      SELECT s.*, c.case_number, c.case_reason, j.name as judge_name
      FROM schedules s
      JOIN cases c ON s.case_id = c.id
      JOIN judges j ON s.judge_id = j.id
      WHERE s.court_id = ?
      AND s.status != 'cancelled'
      AND DATE(s.start_time) BETWEEN DATE(?) AND DATE(?)
      ORDER BY s.start_time
    `;
    params = [id, start_date, end_date];
  } else if (type === 'judge') {
    query = `
      SELECT s.*, c.case_number, c.case_reason, ct.name as court_name
      FROM schedules s
      JOIN cases c ON s.case_id = c.id
      JOIN courts ct ON s.court_id = ct.id
      WHERE s.judge_id = ?
      AND s.status != 'cancelled'
      AND DATE(s.start_time) BETWEEN DATE(?) AND DATE(?)
      ORDER BY s.start_time
    `;
    params = [id, start_date, end_date];
  }

  const data = db.prepare(query).all(...params);
  res.json(data);
});

module.exports = router;
