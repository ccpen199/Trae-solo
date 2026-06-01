const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../utils/db');

router.get('/', (req, res) => {
  const { city, verified, gender, min_age, max_age, education, marital_status, page = 1, page_size = 20 } = req.query;
  
  let sql = 'SELECT * FROM profiles WHERE status = ?';
  let params = ['active'];
  
  if (city && city !== '全部') {
    sql += ' AND city = ?';
    params.push(city);
  }
  if (verified) {
    sql += ' AND real_name_verified = ?';
    params.push(verified === 'true' ? 1 : 0);
  }
  if (gender) {
    sql += ' AND gender = ?';
    params.push(gender);
  }
  if (min_age) {
    sql += ' AND age >= ?';
    params.push(Number(min_age));
  }
  if (max_age) {
    sql += ' AND age <= ?';
    params.push(Number(max_age));
  }
  if (education) {
    sql += ' AND education LIKE ?';
    params.push(`%${education}%`);
  }
  if (marital_status) {
    sql += ' AND marital_status = ?';
    params.push(marital_status);
  }
  
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS count');
  const total = getQuery(countSql, params).count;
  
  sql += ' ORDER BY compatibility DESC, is_vip DESC LIMIT ? OFFSET ?';
  params.push(Number(page_size), (Number(page) - 1) * Number(page_size));
  
  const profiles = allQuery(sql, params);
  
  res.json({
    ok: true,
    profiles,
    pagination: { page: Number(page), page_size: Number(page_size), total, total_pages: Math.ceil(total / page_size) }
  });
});

router.get('/:id', (req, res) => {
  const profile = getQuery('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
  if (!profile) {
    return res.status(404).json({ ok: false, error: 'profile_not_found' });
  }
  
  const photos = allQuery('SELECT * FROM profile_photos WHERE profile_id = ? ORDER BY sort_order', [req.params.id]);
  const blacklisted = allQuery(`
    SELECT b.*, p.name as blocked_name, p.city as blocked_city 
    FROM blacklist b 
    JOIN profiles p ON p.id = b.blocked_profile_id 
    WHERE b.profile_id = ?
  `, [req.params.id]);
  
  const matchHistory = allQuery(`
    SELECT m.*, 
           CASE WHEN m.profile_a_id = ? THEN pb.name ELSE pa.name END as other_name,
           CASE WHEN m.profile_a_id = ? THEN pb.photo_url ELSE pa.photo_url END as other_photo,
           CASE WHEN m.profile_a_id = ? THEN pb.city ELSE pa.city END as other_city,
           CASE WHEN m.profile_a_id = ? THEN pb.age ELSE pa.age END as other_age
    FROM matches m
    JOIN profiles pa ON pa.id = m.profile_a_id
    JOIN profiles pb ON pb.id = m.profile_b_id
    WHERE m.profile_a_id = ? OR m.profile_b_id = ?
    ORDER BY m.created_at DESC
    LIMIT 10
  `, [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id]);
  
  res.json({ ok: true, profile, photos, blacklisted, matchHistory });
});

router.post('/', (req, res) => {
  const {
    name, gender, age, city, occupation, education, marital_status,
    birthday, height, weight, hometown, company, school, income,
    children, ethnicity, religion, smoking, drinking, personality,
    hobbies, self_introduction, values_marriage, values_family, values_career,
    values_finance, values_lifestyle, mate_age_min, mate_age_max,
    mate_education, mate_income, mate_marital_status, mate_city,
    mate_personality, mate_hobbies, mate_no_conditions, privacy_scope
  } = req.body;
  
  const result = runQuery(`
    INSERT INTO profiles (
      name, gender, age, city, occupation, education, marital_status,
      birthday, height, weight, hometown, company, school, income,
      children, ethnicity, religion, smoking, drinking, personality,
      hobbies, self_introduction, values_marriage, values_family, values_career,
      values_finance, values_lifestyle, mate_age_min, mate_age_max,
      mate_education, mate_income, mate_marital_status, mate_city,
      mate_personality, mate_hobbies, mate_no_conditions, privacy_scope,
      compatibility, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    name, gender, age, city, occupation, education, marital_status,
    birthday || null, height || null, weight || null, hometown || null,
    company || null, school || null, income || null, children || null,
    ethnicity || null, religion || null, smoking || null, drinking || null,
    personality || null, hobbies || null, self_introduction || null,
    values_marriage || null, values_family || null, values_career || null,
    values_finance || null, values_lifestyle || null, mate_age_min || null,
    mate_age_max || null, mate_education || null, mate_income || null,
    mate_marital_status || null, mate_city || null, mate_personality || null,
    mate_hobbies || null, mate_no_conditions || null, privacy_scope || 'public',
    0, personality || ''
  ]);
  
  runQuery(`
    INSERT INTO audit_logs (action, target_type, target_id, new_value)
    VALUES (?, ?, ?, ?)
  `, ['create_profile', 'profile', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const profile = getQuery('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
  if (!profile) {
    return res.status(404).json({ ok: false, error: 'profile_not_found' });
  }
  
  const updates = [];
  const values = [];
  const allowedFields = [
    'name', 'gender', 'age', 'city', 'occupation', 'education', 'marital_status',
    'birthday', 'height', 'weight', 'hometown', 'company', 'school', 'income',
    'children', 'ethnicity', 'religion', 'smoking', 'drinking', 'personality',
    'hobbies', 'self_introduction', 'values_marriage', 'values_family', 'values_career',
    'values_finance', 'values_lifestyle', 'mate_age_min', 'mate_age_max',
    'mate_education', 'mate_income', 'mate_marital_status', 'mate_city',
    'mate_personality', 'mate_hobbies', 'mate_no_conditions', 'privacy_scope',
    'real_name_verified', 'real_name', 'id_card', 'photo_verified', 'photo_url',
    'work_verified', 'education_verified', 'contact_visible', 'is_vip', 'vip_expire_at', 'status'
  ];
  
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }
  
  if (updates.length === 0) {
    return res.json({ ok: true, message: 'no_changes' });
  }
  
  values.push('CURRENT_TIMESTAMP');
  updates.push('updated_at = ?');
  values.push(req.params.id);
  
  runQuery(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`, values);
  
  runQuery(`
    INSERT INTO audit_logs (action, target_type, target_id, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  `, ['update_profile', 'profile', req.params.id, JSON.stringify(profile), JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

router.post('/:id/photos', (req, res) => {
  const { photo_url, is_avatar } = req.body;
  const result = runQuery(`
    INSERT INTO profile_photos (profile_id, photo_url, is_avatar, verified)
    VALUES (?, ?, ?, 0)
  `, [req.params.id, photo_url, is_avatar ? 1 : 0]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.post('/:id/blacklist', (req, res) => {
  const { blocked_profile_id, reason } = req.body;
  
  const exists = getQuery('SELECT * FROM blacklist WHERE profile_id = ? AND blocked_profile_id = ?', [req.params.id, blocked_profile_id]);
  if (exists) {
    return res.status(400).json({ ok: false, error: 'already_blocked' });
  }
  
  runQuery(`
    INSERT INTO blacklist (profile_id, blocked_profile_id, reason)
    VALUES (?, ?, ?)
  `, [req.params.id, blocked_profile_id, reason || '']);
  
  runQuery(`
    INSERT INTO audit_logs (action, target_type, target_id, new_value)
    VALUES (?, ?, ?, ?)
  `, ['add_blacklist', 'blacklist', null, JSON.stringify({ profile_id: req.params.id, blocked_profile_id, reason })]);
  
  res.json({ ok: true });
});

router.delete('/:id/blacklist/:blockedId', (req, res) => {
  runQuery(`
    DELETE FROM blacklist WHERE profile_id = ? AND blocked_profile_id = ?
  `, [req.params.id, req.params.blockedId]);
  
  res.json({ ok: true });
});

router.put('/:id/verify', (req, res) => {
  const { verify_type, verified, note } = req.body;
  
  const fieldMap = {
    real_name: 'real_name_verified',
    photo: 'photo_verified',
    work: 'work_verified',
    education: 'education_verified'
  };
  
  const field = fieldMap[verify_type];
  if (!field) {
    return res.status(400).json({ ok: false, error: 'invalid_verify_type' });
  }
  
  runQuery(`
    UPDATE profiles SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `, [verified ? 1 : 0, req.params.id]);
  
  if (field === 'photo_verified') {
    runQuery(`
      UPDATE profile_photos SET verified = ?, verified_at = CURRENT_TIMESTAMP, verify_note = ? WHERE profile_id = ? AND is_avatar = 1
    `, [verified ? 1 : 0, note || '', req.params.id]);
  }
  
  runQuery(`
    INSERT INTO audit_logs (action, target_type, target_id, new_value)
    VALUES (?, ?, ?, ?)
  `, ['verify_profile', 'profile', req.params.id, JSON.stringify({ verify_type, verified, note })]);
  
  res.json({ ok: true });
});

module.exports = router;
