const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getAsync, allAsync, runAsync } = require('./database');

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码', errorType: 'empty' });
    }
    
    const user = await getAsync('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: '账号不存在，请检查用户名', errorType: 'user_not_found' });
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '密码错误，请重试', errorType: 'wrong_password' });
    }
    
    if (!['student', 'teacher', 'coach', 'admin', 'platform', 'ops'].includes(user.role)) {
      return res.status(403).json({ error: '该账号角色不可用，请联系管理员', errorType: 'invalid_role' });
    }
    
    delete user.password;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '登录失败，请稍后重试', errorType: 'server_error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await allAsync('SELECT id, name, role, username, phone, avatar, created_at FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, password, name, role, phone } = req.body;
    const hash = bcrypt.hashSync(password || '123456', 10);
    
    const result = await runAsync(
      'INSERT INTO users (username, password, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [username, hash, name, role, phone]
    );
    res.json({ id: result.lastID, username, name, role, phone });
  } catch (e) {
    res.status(400).json({ error: '用户名已存在' });
  }
});

router.get('/camps', async (req, res) => {
  try {
    const camps = await allAsync(`
      SELECT tc.*, u.name as creator_name,
        (SELECT COUNT(*) FROM camp_enrollments WHERE camp_id = tc.id) as student_count
      FROM training_camps tc
      LEFT JOIN users u ON tc.created_by = u.id
      ORDER BY tc.created_at DESC
    `);
    res.json(camps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camps/:id', async (req, res) => {
  try {
    const camp = await getAsync('SELECT * FROM training_camps WHERE id = ?', [req.params.id]);
    if (!camp) return res.status(404).json({ error: '训练营不存在' });
    res.json(camp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/camps', async (req, res) => {
  try {
    const { name, description, start_date, end_date, total_days, max_makeup_days, created_by } = req.body;
    const result = await runAsync(`
      INSERT INTO training_camps (name, description, start_date, end_date, total_days, max_makeup_days, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, start_date, end_date, total_days, max_makeup_days || 3, created_by]);
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/camps/:id', async (req, res) => {
  try {
    const { name, description, start_date, end_date, total_days, max_makeup_days, status } = req.body;
    await runAsync(`
      UPDATE training_camps SET name=?, description=?, start_date=?, end_date=?, total_days=?, max_makeup_days=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [name, description, start_date, end_date, total_days, max_makeup_days, status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camps/:id/tasks', async (req, res) => {
  try {
    const tasks = await allAsync('SELECT * FROM daily_tasks WHERE camp_id = ? ORDER BY day_number', [req.params.id]);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/camps/:id/tasks', async (req, res) => {
  try {
    const { day_number, title, content, materials, checkin_rule } = req.body;
    const result = await runAsync(`
      INSERT INTO daily_tasks (camp_id, day_number, title, content, materials, checkin_rule)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.params.id, day_number, title, content, materials, checkin_rule]);
    res.json({ id: result.lastID });
  } catch (e) {
    res.status(400).json({ error: '该日任务已存在' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { title, content, materials, checkin_rule } = req.body;
    await runAsync('UPDATE daily_tasks SET title=?, content=?, materials=?, checkin_rule=? WHERE id=?',
      [title, content, materials, checkin_rule, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camps/:id/groups', async (req, res) => {
  try {
    const groups = await allAsync(`
      SELECT g.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM camp_enrollments WHERE group_id = g.id) as student_count
      FROM groups g
      LEFT JOIN users u ON g.teacher_id = u.id
      WHERE g.camp_id = ?
    `, [req.params.id]);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/camps/:id/groups', async (req, res) => {
  try {
    const { name, teacher_id } = req.body;
    const result = await runAsync('INSERT INTO groups (camp_id, name, teacher_id) VALUES (?, ?, ?)',
      [req.params.id, name, teacher_id]);
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camps/:id/enrollments', async (req, res) => {
  try {
    const enrollments = await allAsync(`
      SELECT ce.*, u.name as user_name, u.phone, g.name as group_name
      FROM camp_enrollments ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN groups g ON ce.group_id = g.id
      WHERE ce.camp_id = ?
    `, [req.params.id]);
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/camps/:id/enroll', async (req, res) => {
  try {
    const { user_id, group_id } = req.body;
    const result = await runAsync('INSERT INTO camp_enrollments (camp_id, user_id, group_id) VALUES (?, ?, ?)',
      [req.params.id, user_id, group_id]);
    res.json({ id: result.lastID });
  } catch (e) {
    res.status(400).json({ error: '该学员已加入训练营' });
  }
});

router.get('/student/:userId/camps', async (req, res) => {
  try {
    const camps = await allAsync(`
      SELECT tc.*, ce.points, ce.streak, ce.max_streak, ce.makeup_days_used, ce.status as enrollment_status,
        g.name as group_name, u.name as teacher_name
      FROM camp_enrollments ce
      JOIN training_camps tc ON ce.camp_id = tc.id
      LEFT JOIN groups g ON ce.group_id = g.id
      LEFT JOIN users u ON g.teacher_id = u.id
      WHERE ce.user_id = ?
    `, [req.params.userId]);
    res.json(camps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:userId/camps/:campId/dashboard', async (req, res) => {
  try {
    const { userId, campId } = req.params;
    
    const enrollment = await getAsync(`
      SELECT ce.*, tc.name as camp_name, tc.total_days, tc.max_makeup_days, tc.start_date, tc.end_date
      FROM camp_enrollments ce
      JOIN training_camps tc ON ce.camp_id = tc.id
      WHERE ce.user_id = ? AND ce.camp_id = ?
    `, [userId, campId]);
    
    if (!enrollment) return res.status(404).json({ error: '未加入该训练营' });
    
    const startDate = new Date(enrollment.start_date);
    const today = new Date();
    const dayNumber = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(dayNumber, enrollment.total_days);
    
    const todayTask = await getAsync('SELECT * FROM daily_tasks WHERE camp_id = ? AND day_number = ?', [campId, currentDay]);
    
    const todayCheckin = await getAsync('SELECT * FROM checkin_records WHERE camp_id = ? AND user_id = ? AND day_number = ?',
      [campId, userId, dayNumber]);
    
    const checkinCountRow = await getAsync('SELECT COUNT(*) as count FROM checkin_records WHERE camp_id = ? AND user_id = ? AND status != "rejected"',
      [campId, userId]);
    const checkinCount = checkinCountRow.count;
    
    const recentCheckins = await allAsync(`
      SELECT cr.*, dt.title as task_title
      FROM checkin_records cr
      LEFT JOIN daily_tasks dt ON cr.task_id = dt.id
      WHERE cr.camp_id = ? AND cr.user_id = ?
      ORDER BY cr.day_number DESC LIMIT 7
    `, [campId, userId]);
    
    const rankings = await allAsync(`
      SELECT ce.user_id, u.name, ce.points, ce.streak
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ?
      ORDER BY ce.points DESC, ce.streak DESC
    `, [campId]);
    
    const myRank = rankings.findIndex(r => r.user_id === parseInt(userId)) + 1;
    
    res.json({
      enrollment,
      currentDay,
      todayTask,
      todayCheckin,
      checkinCount,
      recentCheckins,
      myRank,
      totalStudents: rankings.length,
      rankings: rankings.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/checkin', async (req, res) => {
  try {
    const { camp_id, user_id, task_id, day_number, content, images, audio_url, video_url, visibility, is_makeup } = req.body;
    
    const existing = await getAsync('SELECT * FROM checkin_records WHERE camp_id = ? AND user_id = ? AND day_number = ?',
      [camp_id, user_id, day_number]);
    
    if (existing && !is_makeup) {
      return res.status(400).json({ error: '今日已打卡' });
    }
    
    const result = await runAsync(`
      INSERT INTO checkin_records (camp_id, user_id, task_id, day_number, content, images, audio_url, video_url, visibility, is_makeup)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [camp_id, user_id, task_id, day_number, content, images, audio_url, video_url, visibility || 'public', is_makeup ? 1 : 0]);
    
    const enrollment = await getAsync('SELECT * FROM camp_enrollments WHERE camp_id = ? AND user_id = ?', [camp_id, user_id]);
    const newPoints = (enrollment.points || 0) + 10;
    const newStreak = (enrollment.streak || 0) + 1;
    const newMaxStreak = Math.max(enrollment.max_streak || 0, newStreak);
    
    await runAsync('UPDATE camp_enrollments SET points = ?, streak = ?, max_streak = ? WHERE camp_id = ? AND user_id = ?',
      [newPoints, newStreak, newMaxStreak, camp_id, user_id]);
    
    await runAsync('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user_id, 'checkin', `训练营${camp_id}第${day_number}天打卡`]);
    
    res.json({ id: result.lastID, points: newPoints, streak: newStreak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camps/:id/checkins', async (req, res) => {
  try {
    const { status, user_id, day_number } = req.query;
    let sql = `
      SELECT cr.*, u.name as user_name, dt.title as task_title,
        c.name as coach_name
      FROM checkin_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN daily_tasks dt ON cr.task_id = dt.id
      LEFT JOIN users c ON cr.coach_id = c.id
      WHERE cr.camp_id = ?
    `;
    const params = [req.params.id];
    
    if (status) {
      sql += ' AND cr.status = ?';
      params.push(status);
    }
    if (user_id) {
      sql += ' AND cr.user_id = ?';
      params.push(user_id);
    }
    if (day_number) {
      sql += ' AND cr.day_number = ?';
      params.push(day_number);
    }
    
    sql += ' ORDER BY cr.created_at DESC';
    const checkins = await allAsync(sql, params);
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/checkins/:id/review', async (req, res) => {
  try {
    const { coach_id, coach_comment, coach_rating, status } = req.body;
    await runAsync(`
      UPDATE checkin_records SET coach_id=?, coach_comment=?, coach_rating=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [coach_id, coach_comment, coach_rating, status, req.params.id]);
    
    if (status === 'excellent') {
      const checkin = await getAsync('SELECT user_id, camp_id FROM checkin_records WHERE id = ?', [req.params.id]);
      await runAsync('UPDATE camp_enrollments SET points = points + 20 WHERE camp_id = ? AND user_id = ?',
        [checkin.camp_id, checkin.user_id]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaves', async (req, res) => {
  try {
    const leaves = await allAsync(`
      SELECT lr.*, u.name as user_name, tc.name as camp_name, a.name as approver_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN training_camps tc ON lr.camp_id = tc.id
      LEFT JOIN users a ON lr.approved_by = a.id
      ORDER BY lr.created_at DESC
    `);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leaves', async (req, res) => {
  try {
    const { camp_id, user_id, start_date, end_date, reason } = req.body;
    const result = await runAsync(`
      INSERT INTO leave_requests (camp_id, user_id, start_date, end_date, reason)
      VALUES (?, ?, ?, ?, ?)
    `, [camp_id, user_id, start_date, end_date, reason]);
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/leaves/:id/approve', async (req, res) => {
  try {
    const { approved_by, status } = req.body;
    await runAsync('UPDATE leave_requests SET status=?, approved_by=? WHERE id=?',
      [status, approved_by, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/:campId/completion', async (req, res) => {
  try {
    const { campId } = req.params;
    
    const totalStudentsRow = await getAsync('SELECT COUNT(*) as count FROM camp_enrollments WHERE camp_id = ?', [campId]);
    const totalStudents = totalStudentsRow.count;
    
    const camp = await getAsync('SELECT total_days FROM training_camps WHERE id = ?', [campId]);
    const totalDays = camp.total_days;
    
    const dailyCompletion = await allAsync(`
      SELECT day_number, COUNT(DISTINCT user_id) as completed_count
      FROM checkin_records
      WHERE camp_id = ? AND status != 'rejected'
      GROUP BY day_number
      ORDER BY day_number
    `, [campId]);
    
    const studentStats = await allAsync(`
      SELECT u.id, u.name, ce.points, ce.streak,
        COUNT(DISTINCT cr.day_number) as completed_days
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN checkin_records cr ON ce.camp_id = cr.camp_id AND ce.user_id = cr.user_id AND cr.status != 'rejected'
      WHERE ce.camp_id = ?
      GROUP BY ce.user_id
    `, [campId]);
    
    res.json({
      totalStudents,
      totalDays,
      dailyCompletion,
      studentStats,
      avgCompletionRate: studentStats.length > 0 
        ? studentStats.reduce((sum, s) => sum + (s.completed_days / totalDays * 100), 0) / studentStats.length 
        : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/:campId/activity', async (req, res) => {
  try {
    const { campId } = req.params;
    
    const checkinsByDay = await allAsync(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM checkin_records
      WHERE camp_id = ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [campId]);
    
    const avgResponseTimeRow = await getAsync(`
      SELECT AVG(JULIANDAY(cr.updated_at) - JULIANDAY(cr.created_at)) * 24 as avg_hours
      FROM checkin_records cr
      WHERE cr.camp_id = ? AND cr.coach_id IS NOT NULL
    `, [campId]);
    
    res.json({
      checkinsByDay,
      avgResponseTime: avgResponseTimeRow.avg_hours || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/referrals', async (req, res) => {
  try {
    const referrals = await allAsync(`
      SELECT r.*, u.name as referrer_name
      FROM referrals r
      LEFT JOIN users u ON r.referrer_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/referrals', async (req, res) => {
  try {
    const { referrer_id, referred_name, referred_phone, notes } = req.body;
    const result = await runAsync(`
      INSERT INTO referrals (referrer_id, referred_name, referred_phone, notes)
      VALUES (?, ?, ?, ?)
    `, [referrer_id, referred_name, referred_phone, notes]);
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/referrals/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await runAsync('UPDATE referrals SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/renewal-leads', async (req, res) => {
  try {
    const leads = await allAsync(`
      SELECT rl.*, u.name as user_name, u.phone, tc.name as camp_name
      FROM renewal_leads rl
      JOIN users u ON rl.user_id = u.id
      LEFT JOIN training_camps tc ON rl.camp_id = tc.id
      ORDER BY rl.created_at DESC
    `);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/renewal-leads', async (req, res) => {
  try {
    const { user_id, camp_id, interest_level, intended_camp, notes, status } = req.body;
    const result = await runAsync(`
      INSERT INTO renewal_leads (user_id, camp_id, interest_level, intended_camp, notes, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user_id, camp_id, interest_level || 0, intended_camp, notes, status || 'new']);
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/renewal-leads/:id', async (req, res) => {
  try {
    const { interest_level, intended_camp, notes, status } = req.body;
    await runAsync(`
      UPDATE renewal_leads SET interest_level=?, intended_camp=?, notes=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [interest_level, intended_camp, notes, status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
