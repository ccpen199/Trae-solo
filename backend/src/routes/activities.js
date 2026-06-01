const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, type } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM activities WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const activities = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM activities WHERE 1=1';
  const countParams = [];
  if (status) {
    countSql += ' AND status = ?';
    countParams.push(status);
  }
  if (type) {
    countSql += ' AND type = ?';
    countParams.push(type);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ data: activities, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const signupCount = db.prepare('SELECT COUNT(*) as count FROM activity_signups WHERE activity_id = ?').get(req.params.id).count;

  res.json({ ...activity, signupCount });
});

router.post('/', (req, res) => {
  const { title, description, type, location, start_time, end_time, max_participants, rule_id, points_per_participant, created_by } = req.body;

  if (!title || !type || !start_time || !end_time) {
    return res.status(400).json({ error: '参数不完整' });
  }

  const result = db.prepare(`
    INSERT INTO activities (title, description, type, location, start_time, end_time, max_participants, rule_id, points_per_participant, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(title, description || null, type, location || null, start_time, end_time, max_participants || null, rule_id || null, points_per_participant || null, created_by || 'admin');

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
  res.json(activity);
});

router.put('/:id', (req, res) => {
  const { title, description, type, location, start_time, end_time, max_participants, rule_id, points_per_participant, status } = req.body;

  const activity = db.prepare('SELECT id FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  db.prepare(`
    UPDATE activities
    SET title = ?, description = ?, type = ?, location = ?, start_time = ?, end_time = ?,
        max_participants = ?, rule_id = ?, points_per_participant = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description || null, type, location || null, start_time, end_time, max_participants || null, rule_id || null, points_per_participant || null, status || 'draft', req.params.id);

  const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/signup', (req, res) => {
  const { resident_id } = req.body;

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const resident = db.prepare('SELECT id FROM residents WHERE id = ? AND status = 1').get(resident_id);
  if (!resident) {
    return res.status(404).json({ error: '居民不存在' });
  }

  const existing = db.prepare('SELECT id FROM activity_signups WHERE activity_id = ? AND resident_id = ?').get(req.params.id, resident_id);
  if (existing) {
    return res.status(400).json({ error: '已报名该活动' });
  }

  if (activity.max_participants) {
    const signupCount = db.prepare('SELECT COUNT(*) as count FROM activity_signups WHERE activity_id = ?').get(req.params.id).count;
    if (signupCount >= activity.max_participants) {
      return res.status(400).json({ error: '活动名额已满' });
    }
  }

  db.prepare(`
    INSERT INTO activity_signups (activity_id, resident_id, status)
    VALUES (?, ?, 'signed_up')
  `).run(req.params.id, resident_id);

  const signup = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND resident_id = ?').get(req.params.id, resident_id);
  res.json(signup);
});

router.get('/:id/signups', (req, res) => {
  const signups = db.prepare(`
    SELECT s.*, r.name as resident_name, r.phone as resident_phone
    FROM activity_signups s
    JOIN residents r ON s.resident_id = r.id
    WHERE s.activity_id = ?
    ORDER BY s.signup_time DESC
  `).all(req.params.id);

  res.json(signups);
});

router.post('/:id/checkin', (req, res) => {
  const { resident_id, checkin_type, proof_image, is_anomalous, anomaly_reason } = req.body;

  const signup = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND resident_id = ?').get(req.params.id, resident_id);
  if (!signup) {
    return res.status(404).json({ error: '未找到报名记录' });
  }

  if (signup.checkin_time) {
    return res.status(400).json({ error: '已签到' });
  }

  db.prepare(`
    UPDATE activity_signups
    SET checkin_time = CURRENT_TIMESTAMP, checkin_type = ?, proof_image = ?, is_anomalous = ?, anomaly_reason = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE activity_id = ? AND resident_id = ?
  `).run(checkin_type || 'normal', proof_image || null, is_anomalous ? 1 : 0, anomaly_reason || null, is_anomalous ? 'pending_review' : 'checked_in', req.params.id, resident_id);

  const updated = db.prepare(`
    SELECT s.*, r.name as resident_name
    FROM activity_signups s
    JOIN residents r ON s.resident_id = r.id
    WHERE s.activity_id = ? AND s.resident_id = ?
  `).get(req.params.id, resident_id);

  res.json(updated);
});

router.post('/:id/review-checkin', (req, res) => {
  const { resident_id, approved, reviewed_by } = req.body;

  const signup = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND resident_id = ?').get(req.params.id, resident_id);
  if (!signup) {
    return res.status(404).json({ error: '未找到报名记录' });
  }

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

  const transaction = db.transaction(() => {
    let points_awarded = 0;

    if (approved) {
      points_awarded = activity.points_per_participant || 0;

      if (points_awarded > 0) {
        const account = db.prepare('SELECT * FROM point_accounts WHERE resident_id = ?').get(resident_id);
        const balanceAfter = account.available_points + points_awarded;

        db.prepare(`
          UPDATE point_accounts
          SET total_points = total_points + ?, available_points = available_points + ?, updated_at = CURRENT_TIMESTAMP
          WHERE resident_id = ?
        `).run(points_awarded, points_awarded, resident_id);

        db.prepare(`
          INSERT INTO point_transactions (resident_id, account_id, type, points, balance_before, balance_after, reason, source_type, source_id, operator)
          VALUES (?, ?, 'earn', ?, ?, ?, ?, 'activity', ?, ?)
        `).run(resident_id, account.id, points_awarded, account.available_points, balanceAfter, `活动积分: ${activity.title}`, signup.id, reviewed_by || 'admin');
      }
    }

    db.prepare(`
      UPDATE activity_signups
      SET status = ?, reviewed_by = ?, review_time = CURRENT_TIMESTAMP, points_awarded = ?, updated_at = CURRENT_TIMESTAMP
      WHERE activity_id = ? AND resident_id = ?
    `).run(approved ? 'approved' : 'rejected', reviewed_by || 'admin', points_awarded, req.params.id, resident_id);
  });

  transaction();

  const updated = db.prepare(`
    SELECT s.*, r.name as resident_name
    FROM activity_signups s
    JOIN residents r ON s.resident_id = r.id
    WHERE s.activity_id = ? AND s.resident_id = ?
  `).get(req.params.id, resident_id);

  res.json(updated);
});

router.post('/:id/grant-points', (req, res) => {
  const { reviewed_by } = req.body;

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const signups = db.prepare(`
    SELECT s.* FROM activity_signups s
    WHERE s.activity_id = ? AND s.status = 'checked_in' AND s.is_anomalous = 0
  `).all(req.params.id);

  const pointsPerPerson = activity.points_per_participant || 0;
  let grantedCount = 0;

  if (pointsPerPerson > 0) {
    const transaction = db.transaction(() => {
      signups.forEach(signup => {
        if (signup.points_awarded > 0) return;

        const account = db.prepare('SELECT * FROM point_accounts WHERE resident_id = ?').get(signup.resident_id);
        if (!account) return;

        const balanceAfter = account.available_points + pointsPerPerson;

        db.prepare(`
          UPDATE point_accounts
          SET total_points = total_points + ?, available_points = available_points + ?, updated_at = CURRENT_TIMESTAMP
          WHERE resident_id = ?
        `).run(pointsPerPerson, pointsPerPerson, signup.resident_id);

        db.prepare(`
          INSERT INTO point_transactions (resident_id, account_id, type, points, balance_before, balance_after, reason, source_type, source_id, operator)
          VALUES (?, ?, 'earn', ?, ?, ?, ?, 'activity', ?, ?)
        `).run(signup.resident_id, account.id, pointsPerPerson, account.available_points, balanceAfter, `活动积分: ${activity.title}`, signup.id, reviewed_by || 'admin');

        db.prepare(`
          UPDATE activity_signups
          SET points_awarded = ?, status = 'approved', reviewed_by = ?, review_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(pointsPerPerson, reviewed_by || 'admin', signup.id);

        grantedCount++;
      });
    });

    transaction();
  }

  res.json({ success: true, grantedCount, totalSignups: signups.length });
});

module.exports = router;
