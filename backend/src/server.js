require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const attendanceRoutes = require('./routes/attendance');
const orderRoutes = require('./routes/orders');
const db = require('./database/db');

const app = express();
const PORT = process.env.BACKEND_PORT || 58831;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48831}`, `http://localhost:${process.env.FRONTEND_PORT || 48831}`],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/api/grades', (req, res) => {
  const grades = db.prepare('SELECT * FROM grades ORDER BY level').all();
  res.json(grades);
});

app.get('/api/classrooms', (req, res) => {
  const classrooms = db.prepare('SELECT * FROM classrooms ORDER BY name').all();
  res.json(classrooms);
});

app.get('/api/teachers', (req, res) => {
  const teachers = db.prepare("SELECT id, name, username FROM users WHERE role = 'teacher' ORDER BY name").all();
  res.json(teachers);
});

app.get('/api/students', (req, res) => {
  const { grade_id } = req.query;
  let query = "SELECT u.id, u.name, u.grade_id, g.name as grade_name FROM users u LEFT JOIN grades g ON u.grade_id = g.id WHERE u.role = 'student'";
  const params = [];
  
  if (grade_id) {
    query += ' AND u.grade_id = ?';
    params.push(grade_id);
  }
  
  query += ' ORDER BY u.name';
  const students = db.prepare(query).all(...params);
  res.json(students);
});

app.get('/api/notifications', require('./middleware/auth').authenticateToken, (req, res) => {
  const { read } = req.query;
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [req.user.id];
  
  if (read !== undefined) {
    query += ' AND read = ?';
    params.push(read === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC LIMIT 50';
  const notifications = db.prepare(query).all(...params);
  res.json(notifications);
});

app.post('/api/notifications/:id/read', require('./middleware/auth').authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: '已标记为已读' });
});

app.get('/api/dashboard/stats', require('./middleware/auth').authenticateToken, (req, res) => {
  const stats = {};
  
  if (req.user.role === 'admin') {
    stats.totalCourses = db.prepare("SELECT COUNT(*) as count FROM courses WHERE status = 'published'").get().count;
    stats.totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    stats.totalEnrollments = db.prepare("SELECT COUNT(*) as count FROM enrollments WHERE status = 'enrolled'").get().count;
    stats.totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'paid'").get().total;
  } else if (req.user.role === 'teacher') {
    stats.myCourses = db.prepare("SELECT COUNT(*) as count FROM courses WHERE teacher_id = ? AND status = 'published'").get(req.user.id).count;
    stats.totalStudents = db.prepare("SELECT COUNT(DISTINCT e.student_id) as count FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ? AND e.status = 'enrolled'").get(req.user.id).count;
  } else if (req.user.role === 'parent') {
    const children = db.prepare('SELECT id FROM users WHERE parent_id = ?').all(req.user.id);
    const childIds = children.map(c => c.id).join(',') || '0';
    stats.myChildren = children.length;
    stats.enrolledCourses = db.prepare(`SELECT COUNT(*) as count FROM enrollments WHERE student_id IN (${childIds}) AND status = 'enrolled'`).get().count;
  } else if (req.user.role === 'student') {
    stats.enrolledCourses = db.prepare("SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = 'enrolled'").get(req.user.id).count;
  }
  
  res.json(stats);
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
