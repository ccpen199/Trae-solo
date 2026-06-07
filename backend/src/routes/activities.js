const express = require('express');
const router = express.Router();
const db = require('../database');
const { calculateDistance, detectMockLocation, scoreActivityMatch, generateBlockchainHash } = require('../utils');

router.get('/', (req, res) => {
  const { page = 1, limit = 20, status, org_id, lat, lng, volunteer_id } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT a.*, o.name as org_name FROM activities a LEFT JOIN organizations o ON a.org_id = o.id';
  let countQuery = 'SELECT COUNT(*) as count FROM activities a';
  let params = [];
  let conditions = [];
  
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  
  if (org_id) {
    conditions.push('a.org_id = ?');
    params.push(org_id);
  }
  
  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }
  
  query += ' ORDER BY a.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  let activities = db.prepare(query).all(...params);
  
  if (lat && lng && volunteer_id) {
    const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(volunteer_id);
    if (volunteer) {
      activities = activities.map(activity => ({
        ...activity,
        matchScore: scoreActivityMatch(activity, volunteer, { lat: parseFloat(lat), lng: parseFloat(lng) })
      }));
      activities.sort((a, b) => b.matchScore.total - a.matchScore.total);
    }
  }
  
  const total = db.prepare(countQuery).get(...params.slice(0, params.length - 2)).count;
  
  res.json({
    success: true,
    data: activities.map(a => ({
      ...a,
      required_skills: a.required_skills ? a.required_skills.split(',') : []
    })),
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/recommended', (req, res) => {
  const { lat, lng, volunteer_id, limit = 10 } = req.query;
  
  if (!lat || !lng || !volunteer_id) {
    return res.status(400).json({ success: false, message: '缺少定位或志愿者信息' });
  }
  
  const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(volunteer_id);
  if (!volunteer) {
    return res.status(404).json({ success: false, message: '志愿者不存在' });
  }
  
  const activities = db.prepare(`
    SELECT a.*, o.name as org_name 
    FROM activities a 
    LEFT JOIN organizations o ON a.org_id = o.id
    WHERE a.status = 'published' AND a.start_time > CURRENT_TIMESTAMP
  `).all();
  
  const scored = activities.map(activity => ({
    ...activity,
    required_skills: activity.required_skills ? activity.required_skills.split(',') : [],
    matchScore: scoreActivityMatch(activity, volunteer, { lat: parseFloat(lat), lng: parseFloat(lng) })
  }));
  
  scored.sort((a, b) => b.matchScore.total - a.matchScore.total);
  
  res.json({
    success: true,
    data: scored.slice(0, parseInt(limit))
  });
});

router.get('/:id', (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, o.name as org_name, o.credit_score as org_credit
    FROM activities a 
    LEFT JOIN organizations o ON a.org_id = o.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  
  activity.required_skills = activity.required_skills ? activity.required_skills.split(',') : [];
  
  const signups = db.prepare(`
    SELECT asu.*, v.name as volunteer_name, v.phone
    FROM activity_signups asu
    JOIN volunteers v ON asu.volunteer_id = v.id
    WHERE asu.activity_id = ?
  `).all(req.params.id);
  
  res.json({
    success: true,
    data: { ...activity, signups }
  });
});

router.post('/', (req, res) => {
  const { title, description, org_id, location_name, latitude, longitude, 
          geofence_radius, risk_level, insurance_covered, start_time, 
          end_time, required_hours, required_skills = [], max_volunteers } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude,
        geofence_radius, risk_level, insurance_covered, start_time, end_time,
        required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `).run(title, description, org_id, location_name, latitude, longitude,
      geofence_radius || 500, risk_level || 'low', insurance_covered ? 1 : 0,
      start_time, end_time, required_hours, required_skills.join(','), max_volunteers);
    
    db.prepare('UPDATE organizations SET activity_count = activity_count + 1 WHERE id = ?').run(org_id);
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid, title }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/signup', (req, res) => {
  const { volunteer_id } = req.body;
  const activity_id = req.params.id;
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  
  const existing = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND volunteer_id = ?').get(activity_id, volunteer_id);
  if (existing) {
    return res.status(400).json({ success: false, message: '已报名该活动' });
  }
  
  try {
    db.prepare(`
      INSERT INTO activity_signups (activity_id, volunteer_id, status)
      VALUES (?, ?, 'approved')
    `).run(activity_id, volunteer_id);
    
    res.json({ success: true, message: '报名成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/checkin', (req, res) => {
  const { volunteer_id, latitude, longitude, accuracy, location_source } = req.body;
  const activity_id = req.params.id;
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  
  const signup = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND volunteer_id = ?').get(activity_id, volunteer_id);
  if (!signup) {
    return res.status(400).json({ success: false, message: '未报名该活动' });
  }
  
  if (signup.checkin_time) {
    return res.status(400).json({ success: false, message: '已签到' });
  }
  
  const mockCheck = detectMockLocation(latitude, longitude, accuracy);
  if (mockCheck.isMock) {
    db.prepare(`
      INSERT INTO anti_fraud_logs (volunteer_id, activity_id, check_type, result, details)
      VALUES (?, ?, 'mock_location', 'rejected', ?)
    `).run(volunteer_id, activity_id, mockCheck.reason);
    
    return res.status(403).json({ 
      success: false, 
      message: '签到失败：疑似虚拟定位',
      reason: mockCheck.reason
    });
  }
  
  const distance = calculateDistance(
    activity.latitude, activity.longitude,
    latitude, longitude
  );
  
  if (distance > activity.geofence_radius) {
    db.prepare(`
      INSERT INTO anti_fraud_logs (volunteer_id, activity_id, check_type, result, details)
      VALUES (?, ?, 'geofence', 'rejected', ?)
    `).run(volunteer_id, activity_id, `距离活动地点${Math.round(distance)}米，超出围栏${activity.geofence_radius}米`);
    
    return res.status(403).json({ 
      success: false, 
      message: `签到失败：不在活动范围内`,
      distance: Math.round(distance),
      allowed: activity.geofence_radius
    });
  }
  
  const trajectory = JSON.stringify([{ lat: latitude, lng: longitude, time: Date.now() }]);
  
  db.prepare(`
    UPDATE activity_signups 
    SET checkin_time = CURRENT_TIMESTAMP, checkin_lat = ?, checkin_lng = ?, gps_trajectory = ?, status = 'checked_in'
    WHERE activity_id = ? AND volunteer_id = ?
  `).run(latitude, longitude, trajectory, activity_id, volunteer_id);
  
  db.prepare(`
    INSERT INTO anti_fraud_logs (volunteer_id, activity_id, check_type, result, details)
    VALUES (?, ?, 'checkin', 'passed', ?)
  `).run(volunteer_id, activity_id, `距离${Math.round(distance)}米，来源:${location_source || 'unknown'}`);
  
  res.json({
    success: true,
    message: '签到成功',
    data: { distance: Math.round(distance), checkin_time: new Date().toISOString() }
  });
});

router.post('/:id/checkout', (req, res) => {
  const { volunteer_id, latitude, longitude, trajectory } = req.body;
  const activity_id = req.params.id;
  
  const signup = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND volunteer_id = ?').get(activity_id, volunteer_id);
  if (!signup || !signup.checkin_time) {
    return res.status(400).json({ success: false, message: '未签到' });
  }
  
  const checkinTime = new Date(signup.checkin_time);
  const checkoutTime = new Date();
  const actualHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);
  
  const hash = generateBlockchainHash({
    volunteer_id,
    activity_id,
    checkin_time: signup.checkin_time,
    checkout_time: checkoutTime.toISOString(),
    actual_hours: actualHours
  });
  
  db.prepare(`
    UPDATE activity_signups 
    SET checkout_time = CURRENT_TIMESTAMP, checkout_lat = ?, checkout_lng = ?, 
        actual_hours = ?, blockchain_hash = ?, status = 'completed', gps_trajectory = ?
    WHERE activity_id = ? AND volunteer_id = ?
  `).run(latitude, longitude, actualHours.toFixed(2), hash, JSON.stringify(trajectory || []), activity_id, volunteer_id);
  
  db.prepare(`
    UPDATE volunteers 
    SET total_hours = total_hours + ?, last_active_at = CURRENT_TIMESTAMP, blockchain_hash = ?
    WHERE id = ?
  `).run(actualHours.toFixed(2), hash, volunteer_id);
  
  const coinRule = db.prepare('SELECT * FROM yicoin_rules WHERE is_active = 1 LIMIT 1').get();
  if (coinRule && actualHours >= coinRule.min_hours) {
    const coins = Math.min(Math.floor(actualHours * coinRule.coins_per_hour), coinRule.max_daily);
    
    db.prepare(`
      UPDATE yicoins 
      SET balance = balance + ?, total_earned = total_earned + ?, last_earned_at = CURRENT_TIMESTAMP
      WHERE volunteer_id = ?
    `).run(coins, coins, volunteer_id);
    
    db.prepare(`
      INSERT INTO yicoin_transactions (volunteer_id, type, amount, reason, activity_id)
      VALUES (?, 'earn', ?, ?, ?)
    `).run(volunteer_id, coins, `志愿服务${actualHours.toFixed(1)}小时奖励`, activity_id);
  }
  
  res.json({
    success: true,
    message: '签退成功',
    data: { actualHours: actualHours.toFixed(2), blockchain_hash: hash }
  });
});

module.exports = router;
