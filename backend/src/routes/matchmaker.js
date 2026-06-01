const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../utils/db');

router.get('/matchmakers', (req, res) => {
  const matchmakers = allQuery(`
    SELECT m.*, u.username,
           (SELECT COUNT(*) FROM matchmaker_assignments WHERE matchmaker_id = m.id AND status = 'active') as active_clients
    FROM matchmakers m
    JOIN users u ON u.id = m.user_id
    WHERE m.status = 'active'
  `);
  res.json({ ok: true, matchmakers });
});

router.get('/:matchmakerId/clients', (req, res) => {
  const clients = allQuery(`
    SELECT a.*, p.*,
           (SELECT COUNT(*) FROM matches m WHERE m.profile_a_id = p.id OR m.profile_b_id = p.id) as match_count,
           (SELECT MAX(created_at) FROM follow_ups f WHERE f.profile_id = p.id) as last_follow_up
    FROM matchmaker_assignments a
    JOIN profiles p ON p.id = a.profile_id
    WHERE a.matchmaker_id = ? AND a.status = 'active'
    ORDER BY a.created_at DESC
  `, [req.params.matchmakerId]);
  res.json({ ok: true, clients });
});

router.get('/:matchmakerId/recommendations', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.*, m.match_score, m.match_reasons, m.status as match_status,
           pa.id as a_id, pa.name as a_name, pa.age as a_age, pa.city as a_city, pa.photo_url as a_photo, pa.real_name_verified as a_verified,
           pb.id as b_id, pb.name as b_name, pb.age as b_age, pb.city as b_city, pb.photo_url as b_photo, pb.real_name_verified as b_verified,
           mm.name as matchmaker_name
    FROM matchmaker_recommendations r
    JOIN matches m ON m.id = r.match_id
    JOIN profiles pa ON pa.id = m.profile_a_id
    JOIN profiles pb ON pb.id = m.profile_b_id
    JOIN matchmakers mm ON mm.id = r.matchmaker_id
    WHERE r.matchmaker_id = ?
  `;
  let params = [req.params.matchmakerId];
  
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC';
  
  const recommendations = allQuery(sql, params);
  res.json({ ok: true, recommendations });
});

router.post('/recommendations', (req, res) => {
  const { matchmaker_id, match_id, recommendation_reason, recommendation_note } = req.body;
  
  const result = runQuery(`
    INSERT INTO matchmaker_recommendations (matchmaker_id, match_id, recommendation_reason, recommendation_note, status)
    VALUES (?, ?, ?, ?, 'pending')
  `, [matchmaker_id, match_id, recommendation_reason, recommendation_note || '']);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_recommendation', 'matchmaker_recommendation', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/recommendations/:id', (req, res) => {
  const { a_feedback, b_feedback, a_rating, b_rating, status, recommendation_note } = req.body;
  
  const updates = [];
  const values = [];
  
  if (a_feedback !== undefined) { updates.push('a_feedback = ?'); values.push(a_feedback); }
  if (b_feedback !== undefined) { updates.push('b_feedback = ?'); values.push(b_feedback); }
  if (a_rating !== undefined) { updates.push('a_rating = ?'); values.push(a_rating); }
  if (b_rating !== undefined) { updates.push('b_rating = ?'); values.push(b_rating); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (recommendation_note !== undefined) { updates.push('recommendation_note = ?'); values.push(recommendation_note); }
  
  if (updates.length === 0) return res.json({ ok: true, message: 'no_changes' });
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  
  runQuery(`UPDATE matchmaker_recommendations SET ${updates.join(', ')} WHERE id = ?`, values);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['update_recommendation', 'matchmaker_recommendation', req.params.id, JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

router.get('/:matchmakerId/appointments', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT a.*, m.match_score,
           pa.name as a_name, pa.phone as a_phone, pa.photo_url as a_photo,
           pb.name as b_name, pb.phone as b_phone, pb.photo_url as b_photo,
           r.recommendation_reason, r.a_feedback, r.b_feedback
    FROM appointments a
    JOIN matches m ON m.id = a.match_id
    JOIN profiles pa ON pa.id = m.profile_a_id
    JOIN profiles pb ON pb.id = m.profile_b_id
    LEFT JOIN matchmaker_recommendations r ON r.match_id = a.match_id
    WHERE a.matchmaker_id = ?
  `;
  let params = [req.params.matchmakerId];
  
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
  
  const appointments = allQuery(sql, params);
  res.json({ ok: true, appointments });
});

router.post('/appointments', (req, res) => {
  const { match_id, matchmaker_id, appointment_date, appointment_time, location } = req.body;
  
  const result = runQuery(`
    INSERT INTO appointments (match_id, matchmaker_id, appointment_date, appointment_time, location, status)
    VALUES (?, ?, ?, ?, ?, 'scheduled')
  `, [match_id, matchmaker_id, appointment_date, appointment_time, location]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_appointment', 'appointment', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/appointments/:id', (req, res) => {
  const { a_confirmed, b_confirmed, a_attended, b_attended, a_feedback, b_feedback, result, follow_up_plan, status } = req.body;
  
  const updates = [];
  const values = [];
  
  if (a_confirmed !== undefined) { updates.push('a_confirmed = ?'); values.push(a_confirmed); }
  if (b_confirmed !== undefined) { updates.push('b_confirmed = ?'); values.push(b_confirmed); }
  if (a_attended !== undefined) { updates.push('a_attended = ?'); values.push(a_attended); }
  if (b_attended !== undefined) { updates.push('b_attended = ?'); values.push(b_attended); }
  if (a_feedback !== undefined) { updates.push('a_feedback = ?'); values.push(a_feedback); }
  if (b_feedback !== undefined) { updates.push('b_feedback = ?'); values.push(b_feedback); }
  if (result !== undefined) { updates.push('result = ?'); values.push(result); }
  if (follow_up_plan !== undefined) { updates.push('follow_up_plan = ?'); values.push(follow_up_plan); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  
  if (updates.length === 0) return res.json({ ok: true, message: 'no_changes' });
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  
  runQuery(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['update_appointment', 'appointment', req.params.id, JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

router.get('/:matchmakerId/followups', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT f.*, p.name as profile_name, p.photo_url as profile_photo,
           m.match_score, pa.name as a_name, pb.name as b_name
    FROM follow_ups f
    LEFT JOIN profiles p ON p.id = f.profile_id
    LEFT JOIN matches m ON m.id = f.match_id
    LEFT JOIN profiles pa ON pa.id = m.profile_a_id
    LEFT JOIN profiles pb ON pb.id = m.profile_b_id
    WHERE f.matchmaker_id = ?
  `;
  let params = [req.params.matchmakerId];
  
  if (status) { sql += ' AND f.status = ?'; params.push(status); }
  sql += ' ORDER BY f.follow_up_date DESC, f.created_at DESC';
  
  const followups = allQuery(sql, params);
  res.json({ ok: true, followups });
});

router.post('/followups', (req, res) => {
  const { matchmaker_id, match_id, profile_id, follow_up_type, follow_up_content, follow_up_date, next_follow_up_date } = req.body;
  
  const result = runQuery(`
    INSERT INTO follow_ups (matchmaker_id, match_id, profile_id, follow_up_type, follow_up_content, follow_up_date, next_follow_up_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `, [matchmaker_id, match_id || null, profile_id || null, follow_up_type, follow_up_content, follow_up_date, next_follow_up_date || null]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_followup', 'follow_up', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/followups/:id', (req, res) => {
  const { follow_up_content, follow_up_date, next_follow_up_date, result, status } = req.body;
  
  const updates = [];
  const values = [];
  
  if (follow_up_content !== undefined) { updates.push('follow_up_content = ?'); values.push(follow_up_content); }
  if (follow_up_date !== undefined) { updates.push('follow_up_date = ?'); values.push(follow_up_date); }
  if (next_follow_up_date !== undefined) { updates.push('next_follow_up_date = ?'); values.push(next_follow_up_date); }
  if (result !== undefined) { updates.push('result = ?'); values.push(result); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  
  if (updates.length === 0) return res.json({ ok: true, message: 'no_changes' });
  
  values.push(req.params.id);
  runQuery(`UPDATE follow_ups SET ${updates.join(', ')} WHERE id = ?`, values);
  
  res.json({ ok: true });
});

router.post('/assign', (req, res) => {
  const { matchmaker_id, profile_id, assignment_reason } = req.body;
  
  const exists = getQuery('SELECT * FROM matchmaker_assignments WHERE matchmaker_id = ? AND profile_id = ? AND status = ?',
    [matchmaker_id, profile_id, 'active']);
  if (exists) return res.status(400).json({ ok: false, error: 'already_assigned' });
  
  runQuery('UPDATE matchmaker_assignments SET status = ? WHERE profile_id = ? AND status = ?', ['inactive', profile_id, 'active']);
  runQuery(`INSERT INTO matchmaker_assignments (matchmaker_id, profile_id, assignment_reason, status) VALUES (?, ?, ?, 'active')`,
    [matchmaker_id, profile_id, assignment_reason || '']);
  runQuery('UPDATE matchmakers SET client_count = client_count + 1 WHERE id = ?', [matchmaker_id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['assign_matchmaker', 'matchmaker_assignment', null, JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

module.exports = router;
