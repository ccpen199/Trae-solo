const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../utils/db');

router.get('/dashboard', (req, res) => {
  const { period = '30d' } = req.query;
  const dateFilter = period === 'today' ? "AND DATE(created_at) = DATE('now')" :
                      period === '7d' ? "AND created_at >= DATE('now', '-7 days')" :
                      "AND created_at >= DATE('now', '-30 days')";
  
  const verifiedUsers = getQuery(`SELECT COUNT(*) as count FROM profiles WHERE real_name_verified = 1`);
  const totalProfiles = getQuery(`SELECT COUNT(*) as count FROM profiles`);
  const avgMatch = getQuery(`SELECT AVG(match_score) as avg FROM matches WHERE match_score > 0`);
  const totalMatches = getQuery(`SELECT COUNT(*) as count FROM matches`);
  const totalEvents = getQuery(`SELECT COUNT(*) as count FROM events`);
  const activeConversations = getQuery(`SELECT COUNT(DISTINCT id) as count FROM conversations WHERE updated_at >= DATE('now', '-7 days')`);
  const todayMessages = getQuery(`SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = DATE('now')`);
  const pendingReports = getQuery(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`);
  const pendingFraud = getQuery(`SELECT COUNT(*) as count FROM fraud_risks WHERE status = 'pending'`);
  const paidMembers = getQuery(`SELECT COUNT(DISTINCT profile_id) as count FROM payments WHERE status = 'success' AND expires_at > DATE('now')`);
  const totalRevenue = getQuery(`SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE status = 'success'`);
  
  const successMatches = getQuery(`SELECT COUNT(*) as count FROM matches WHERE status = 'matched' OR status = 'dating'`);
  const successRate = totalMatches.count > 0 ? Math.round((successMatches.count / totalMatches.count) * 100) : 0;
  
  const appointments = getQuery(`SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'`);
  const totalScheduled = getQuery(`SELECT COUNT(*) as count FROM appointments WHERE status != 'cancelled'`);
  const appointmentRate = totalScheduled.count > 0 ? Math.round((appointments.count / totalScheduled.count) * 100) : 0;
  
  const pendingComplaints = getQuery(`SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'`);
  
  const matchmakers = allQuery(`
    SELECT m.*, u.username,
           (SELECT COUNT(*) FROM matchmaker_assignments WHERE matchmaker_id = m.id AND status = 'active') as active_clients,
           (SELECT COUNT(*) FROM matchmaker_recommendations WHERE matchmaker_id = m.id AND status = 'success') as success_count,
           (SELECT COUNT(*) FROM appointments WHERE matchmaker_id = m.id AND status = 'completed') as completed_appointments
    FROM matchmakers m JOIN users u ON u.id = m.user_id WHERE m.status = 'active'
  `);
  
  const matchmakerStats = matchmakers.map(mm => ({
    ...mm,
    success_rate: mm.active_clients > 0 ? Math.round((mm.success_count / mm.active_clients) * 100) : 0
  }));
  
  res.json({
    ok: true,
    stats: {
      total_profiles: totalProfiles.count,
      verified_users: verifiedUsers.count,
      avg_match_score: Math.round(avgMatch.avg || 0),
      total_matches: totalMatches.count,
      match_success_rate: successRate,
      total_events: totalEvents.count,
      active_conversations: activeConversations.count,
      today_messages: todayMessages.count,
      appointment_rate: appointmentRate,
      paid_members: paidMembers.count,
      total_revenue: totalRevenue.sum,
      pending_reports: pendingReports.count,
      pending_fraud_risks: pendingFraud.count,
      pending_complaints: pendingComplaints.count
    },
    matchmaker_performance: matchmakerStats
  });
});

router.get('/match-success-rate', (req, res) => {
  const { by = 'day' } = req.query;
  const groupBy = by === 'week' ? "strftime('%Y-%W', created_at)" : "strftime('%Y-%m-%d', created_at)";
  
  const data = allQuery(`
    SELECT 
      ${groupBy} as period,
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('matched', 'dating') THEN 1 ELSE 0 END) as success,
      ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN status IN ('matched', 'dating') THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) ELSE 0 END, 1) as rate
    FROM matches
    WHERE created_at >= DATE('now', '-90 days')
    GROUP BY ${groupBy}
    ORDER BY period DESC
    LIMIT 30
  `);
  res.json({ ok: true, data });
});

router.get('/appointment-rate', (req, res) => {
  const { by = 'day' } = req.query;
  const groupBy = by === 'week' ? "strftime('%Y-%W', appointment_date)" : "strftime('%Y-%m-%d', appointment_date)";
  
  const data = allQuery(`
    SELECT 
      ${groupBy} as period,
      COUNT(*) as total,
      SUM(CASE WHEN a_attended = 1 AND b_attended = 1 THEN 1 ELSE 0 END) as attended,
      SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) as success,
      ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN a_attended = 1 AND b_attended = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) ELSE 0 END, 1) as attend_rate,
      ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) ELSE 0 END, 1) as success_rate
    FROM appointments
    WHERE appointment_date >= DATE('now', '-90 days')
    GROUP BY ${groupBy}
    ORDER BY period DESC
    LIMIT 30
  `);
  res.json({ ok: true, data });
});

router.get('/paid-members', (req, res) => {
  const { by = 'month' } = req.query;
  const groupBy = by === 'week' ? "strftime('%Y-%W', created_at)" : "strftime('%Y-%m', created_at)";
  
  const data = allQuery(`
    SELECT 
      ${groupBy} as period,
      COUNT(DISTINCT profile_id) as new_members,
      COUNT(*) as payments,
      SUM(amount) as revenue
    FROM payments
    WHERE status = 'success' AND created_at >= DATE('now', '-365 days')
    GROUP BY ${groupBy}
    ORDER BY period DESC
    LIMIT 12
  `);
  res.json({ ok: true, data });
});

router.get('/complaints', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT c.*,
           reporter.name as reporter_name, reporter.photo_url as reporter_photo,
           target.name as target_name, target.photo_url as target_photo,
           handler.username as handler_name
    FROM complaints c
    JOIN profiles reporter ON reporter.id = c.reporter_profile_id
    LEFT JOIN profiles target ON target.id = c.target_profile_id
    LEFT JOIN users handler ON handler.id = c.handled_by
    WHERE 1=1
  `;
  let params = [];
  
  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  sql += ' ORDER BY c.created_at DESC LIMIT 100';
  
  const complaints = allQuery(sql, params);
  res.json({ ok: true, complaints });
});

router.post('/complaints', (req, res) => {
  const { reporter_profile_id, target_profile_id, complaint_type, complaint_content, related_ticket_id } = req.body;
  
  const result = runQuery(`
    INSERT INTO complaints (reporter_profile_id, target_profile_id, complaint_type, complaint_content, related_ticket_id, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `, [reporter_profile_id, target_profile_id || null, complaint_type, complaint_content, related_ticket_id || null]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_complaint', 'complaint', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/complaints/:id', (req, res) => {
  const { status, handled_by, handling_result } = req.body;
  
  runQuery(`UPDATE complaints SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handling_result = ? WHERE id = ?`,
    [status, handled_by || null, handling_result || '', req.params.id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['handle_complaint', 'complaint', req.params.id, JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

router.get('/audit-logs', (req, res) => {
  const { target_type, target_id, action } = req.query;
  
  let sql = `
    SELECT a.*, u.username as operator_name
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.operator_id
    WHERE 1=1
  `;
  let params = [];
  
  if (target_type) { sql += ' AND a.target_type = ?'; params.push(target_type); }
  if (target_id) { sql += ' AND a.target_id = ?'; params.push(target_id); }
  if (action) { sql += ' AND a.action = ?'; params.push(action); }
  sql += ' ORDER BY a.created_at DESC LIMIT 200';
  
  const logs = allQuery(sql, params);
  res.json({ ok: true, logs });
});

router.get('/matchmaker-performance', (req, res) => {
  const { period = '30d' } = req.query;
  const dateFilter = period === 'today' ? "AND DATE(created_at) = DATE('now')" :
                      period === '7d' ? "AND created_at >= DATE('now', '-7 days')" :
                      "AND created_at >= DATE('now', '-30 days')";
  
  const data = allQuery(`
    SELECT 
      m.id, m.name, u.username, m.specialty,
      (SELECT COUNT(*) FROM matchmaker_assignments a WHERE a.matchmaker_id = m.id AND a.status = 'active') as active_clients,
      (SELECT COUNT(*) FROM matchmaker_recommendations r WHERE r.matchmaker_id = m.id ${dateFilter}) as total_recommendations,
      (SELECT COUNT(*) FROM matchmaker_recommendations r WHERE r.matchmaker_id = m.id AND r.status = 'success' ${dateFilter}) as success_recommendations,
      (SELECT COUNT(*) FROM appointments a WHERE a.matchmaker_id = m.id ${dateFilter}) as total_appointments,
      (SELECT COUNT(*) FROM appointments a WHERE a.matchmaker_id = m.id AND a.status = 'completed' ${dateFilter}) as completed_appointments,
      (SELECT COUNT(*) FROM follow_ups f WHERE f.matchmaker_id = m.id ${dateFilter}) as total_followups
    FROM matchmakers m
    JOIN users u ON u.id = m.user_id
    WHERE m.status = 'active'
    ORDER BY success_recommendations DESC
  `);
  res.json({ ok: true, data });
});

module.exports = router;
