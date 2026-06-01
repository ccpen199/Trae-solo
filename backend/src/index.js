import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { all, get, run, prepare, transaction, projectDir } from './database.js';
import { logger, requestLogger } from '../middleware/logger.js';
import { errorHandler, notFound } from '../middleware/errorHandler.js';
import { upload } from '../middleware/upload.js';
import dayjs from 'dayjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(projectDir, '.env') });

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || 53453);
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 43453);

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(requestLogger);

function todayStr() {
  return dayjs().format('YYYY-MM-DD');
}

function nowStr() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function calcDurationHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

function calcConsumptionAmount(unitPrice, hours, consumeType) {
  const amount = unitPrice * hours;
  if (consumeType === 'trial' || consumeType === 'makeup') {
    return 0;
  }
  return amount;
}

app.get('/api/health', (req, res) => {
  const students = get('SELECT COUNT(*) AS count FROM students').count;
  res.json({
    status: 'ok',
    service: 'training-center-management',
    db: 'connected',
    students,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard', (req, res) => {
  const stats = {
    students: get('SELECT COUNT(*) AS count FROM students WHERE status = ?', ['active']).count,
    teachers: get('SELECT COUNT(*) AS count FROM teachers WHERE status = ?', ['active']).count,
    classes: get('SELECT COUNT(*) AS count FROM classes WHERE status = ?', ['active']).count,
    activePurchases: get("SELECT COUNT(*) AS count FROM purchases WHERE status = 'active'").count,
    remainingHours: get('SELECT COALESCE(SUM(remaining_hours), 0) AS value FROM purchases WHERE status = ?', ['active']).value,
    paidAmount: get('SELECT COALESCE(SUM(paid_amount), 0) AS value FROM purchases').value,
    todaySchedules: get("SELECT COUNT(*) AS count FROM schedules WHERE course_date = ?", [todayStr()]).count,
    totalRefunded: get("SELECT COALESCE(SUM(refund_amount), 0) AS value FROM refunds WHERE approval_status = 'approved'").value
  };

  const upcoming = all(`
    SELECT s.*, c.name AS class_name, c.subject, t.name AS teacher_name, cr.name AS classroom_name,
      (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = s.class_id AND sc.status = 'enrolled') AS enrolled_count
    FROM schedules s
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN teachers t ON t.id = s.teacher_id
    LEFT JOIN classrooms cr ON cr.id = s.classroom_id
    WHERE s.course_date >= ?
    ORDER BY s.course_date, s.start_time
    LIMIT 8
  `, [todayStr()]);

  const lowBalance = all(`
    SELECT st.id, st.name, st.parent_phone, st.consultant, st.learning_goal, st.contract_attachment,
      COALESCE(SUM(p.remaining_hours), 0) AS remaining_hours,
      COALESCE(SUM(p.paid_amount), 0) AS total_paid,
      COALESCE(SUM(p.used_hours), 0) AS total_used_hours
    FROM students st
    LEFT JOIN purchases p ON p.student_id = st.id AND p.status = 'active'
    GROUP BY st.id
    HAVING remaining_hours <= 28 AND remaining_hours > 0
    ORDER BY remaining_hours ASC
    LIMIT 10
  `);

  const consumedToday = all(`
    SELECT COALESCE(SUM(c.hours), 0) AS hours, COALESCE(SUM(c.amount), 0) AS amount
    FROM consumptions c
    WHERE c.consume_date = ?
  `, [todayStr()])[0];

  stats.todayConsumedHours = consumedToday.hours;
  stats.todayConsumedAmount = consumedToday.amount;

  const totalConsumed = all(`
    SELECT COALESCE(SUM(c.hours), 0) AS hours, COALESCE(SUM(c.amount), 0) AS amount
    FROM consumptions c
  `)[0];
  stats.totalConsumedHours = totalConsumed.hours;
  stats.totalConsumedAmount = totalConsumed.amount;

  const totalLiability = all(`
    SELECT COALESCE(SUM(p.remaining_hours * p.unit_price), 0) AS value
    FROM purchases p
    WHERE p.status = 'active'
  `)[0].value;
  stats.totalLiability = totalLiability;

  const revenueByPackage = all(`
    SELECT cp.name, COUNT(*) AS count, COALESCE(SUM(p.paid_amount), 0) AS amount
    FROM purchases p
    LEFT JOIN course_packages cp ON cp.id = p.package_id
    WHERE p.status = 'active'
    GROUP BY p.package_id
    ORDER BY amount DESC
  `);

  const consumptionByStatus = all(`
    SELECT 
      CASE a.status
        WHEN 'normal' THEN '正常出勤'
        WHEN 'leave' THEN '请假'
        WHEN 'absent' THEN '旷课'
        WHEN 'makeup' THEN '补课'
        WHEN 'trial' THEN '试听'
        ELSE a.status
      END AS status_name,
      a.status,
      COUNT(*) AS count,
      CASE 
        WHEN a.status IN ('normal', 'absent') THEN COALESCE(SUM(c.hours), 0)
        ELSE 0 
      END AS hours,
      CASE 
        WHEN a.status IN ('normal', 'absent') THEN COALESCE(SUM(c.amount), 0)
        ELSE 0 
      END AS amount
    FROM attendances a
    LEFT JOIN consumptions c ON c.attendance_id = a.id
    WHERE a.status != 'reserved'
    GROUP BY a.status
    ORDER BY amount DESC
  `);

  const refundSummary = all(`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(CASE WHEN approval_status = 'approved' THEN refund_amount ELSE 0 END), 0) AS approved_amount,
      COALESCE(SUM(CASE WHEN approval_status = 'pending' THEN refund_amount ELSE 0 END), 0) AS pending_amount
    FROM refunds
  `)[0];

  const transferSummary = all(`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(CASE WHEN approval_status = 'approved' THEN transfer_amount ELSE 0 END), 0) AS approved_amount,
      COALESCE(SUM(CASE WHEN approval_status = 'pending' THEN transfer_amount ELSE 0 END), 0) AS pending_amount
    FROM transfers
  `)[0];

  res.json({ 
    stats, 
    upcoming, 
    lowBalance, 
    revenueByPackage,
    consumptionByStatus,
    refundSummary,
    transferSummary
  });
});

app.get('/api/students', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT st.*,
      COALESCE(SUM(p.total_hours + p.gift_hours), 0) AS purchased_hours,
      COALESCE(SUM(p.used_hours), 0) AS used_hours,
      COALESCE(SUM(p.remaining_hours), 0) AS remaining_hours,
      COALESCE(SUM(p.paid_amount), 0) AS paid_amount,
      GROUP_CONCAT(DISTINCT c.name) AS class_names
    FROM students st
    LEFT JOIN purchases p ON p.student_id = st.id
    LEFT JOIN student_classes sc ON sc.student_id = st.id
    LEFT JOIN classes c ON c.id = sc.class_id
  `;
  const params = [];
  if (status) {
    sql += ' WHERE st.status = ?';
    params.push(status);
  }
  sql += ' GROUP BY st.id ORDER BY st.created_at DESC, st.id DESC';
  res.json(all(sql, params));
});

app.get('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const student = get('SELECT * FROM students WHERE id = ?', [id]);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const purchases = all(`
    SELECT p.*, cp.name AS package_name
    FROM purchases p
    LEFT JOIN course_packages cp ON cp.id = p.package_id
    WHERE p.student_id = ?
    ORDER BY p.created_at DESC
  `, [id]);
  const attendances = all(`
    SELECT a.*, s.course_date, s.start_time, s.end_time, c.name AS class_name
    FROM attendances a
    JOIN schedules s ON s.id = a.schedule_id
    JOIN classes c ON c.id = s.class_id
    WHERE a.student_id = ?
    ORDER BY s.course_date DESC, s.start_time DESC
    LIMIT 20
  `, [id]);
  const classes = all(`
    SELECT sc.*, c.name AS class_name, c.subject, t.name AS teacher_name
    FROM student_classes sc
    JOIN classes c ON c.id = sc.class_id
    LEFT JOIN teachers t ON t.id = c.teacher_id
    WHERE sc.student_id = ?
    ORDER BY sc.enroll_date DESC
  `, [id]);
  res.json({ ...student, purchases, attendances, classes });
});

app.post('/api/students', (req, res) => {
  const { name, gender = '', birthday = '', phone = '', parent_name = '', parent_phone = '', consultant = '', learning_goal = '' } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: '学员姓名不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO students (name, gender, birthday, phone, parent_name, parent_phone, consultant, learning_goal, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(String(name).trim(), gender, birthday, phone, parent_name, parent_phone, consultant, learning_goal, nowStr(), nowStr());

  res.status(201).json(get('SELECT * FROM students WHERE id = ?', [result.lastInsertRowid]));
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const existing = get('SELECT * FROM students WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: '学员不存在' });
  }
  const { name, gender, birthday, phone, parent_name, parent_phone, consultant, learning_goal, status } = req.body || {};
  
  db.prepare(`
    UPDATE students SET 
      name = COALESCE(?, name),
      gender = COALESCE(?, gender),
      birthday = COALESCE(?, birthday),
      phone = COALESCE(?, phone),
      parent_name = COALESCE(?, parent_name),
      parent_phone = COALESCE(?, parent_phone),
      consultant = COALESCE(?, consultant),
      learning_goal = COALESCE(?, learning_goal),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(name, gender, birthday, phone, parent_name, parent_phone, consultant, learning_goal, status, nowStr(), id);

  res.json(get('SELECT * FROM students WHERE id = ?', [id]));
});

app.post('/api/students/:id/upload', upload.single('contract'), (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE students SET contract_attachment = ?, updated_at = ? WHERE id = ?').run(filePath, nowStr(), id);
  res.json({ success: true, path: filePath, filename: req.file.filename });
});

app.post('/api/upload/contract', upload.single('contract'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的合同文件' });
  }
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: '仅支持 PDF 和图片格式' });
  }
  const maxSize = 10 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({ error: '文件大小不能超过 10MB' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    path: filePath, 
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

app.get('/api/course-packages', (req, res) => {
  res.json(all('SELECT * FROM course_packages WHERE status = ? ORDER BY price DESC', ['active']));
});

app.post('/api/course-packages', (req, res) => {
  const { name, total_hours, price, discount = 1, gift_hours = 0, valid_months = 12, description = '' } = req.body || {};
  if (!name || !total_hours || !price) {
    return res.status(400).json({ error: '课包名称、课时、价格不能为空' });
  }
  const result = db.prepare(`
    INSERT INTO course_packages (name, total_hours, price, discount, gift_hours, valid_months, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, total_hours, price, discount, gift_hours, valid_months, description);
  res.status(201).json(get('SELECT * FROM course_packages WHERE id = ?', [result.lastInsertRowid]));
});

app.get('/api/teachers', (req, res) => {
  res.json(all(`
    SELECT t.*,
      (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = t.id AND c.status = 'active') AS class_count,
      (SELECT COUNT(*) FROM schedules s WHERE s.teacher_id = t.id AND s.course_date >= ?) AS upcoming_lessons
    FROM teachers t
    WHERE t.status = 'active'
    ORDER BY t.created_at DESC
  `, [todayStr()]));
});

app.post('/api/teachers', (req, res) => {
  const { name, phone = '', subject = '', hourly_rate = 0 } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: '教师姓名不能为空' });
  }
  const result = db.prepare(`
    INSERT INTO teachers (name, phone, subject, hourly_rate)
    VALUES (?, ?, ?, ?)
  `).run(name, phone, subject, hourly_rate);
  res.status(201).json(get('SELECT * FROM teachers WHERE id = ?', [result.lastInsertRowid]));
});

app.get('/api/classrooms', (req, res) => {
  res.json(all('SELECT * FROM classrooms WHERE status = ? ORDER BY name', ['active']));
});

app.post('/api/classrooms', (req, res) => {
  const { name, capacity = 10, location = '', equipment = '' } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: '教室名称不能为空' });
  }
  const result = db.prepare(`
    INSERT INTO classrooms (name, capacity, location, equipment)
    VALUES (?, ?, ?, ?)
  `).run(name, capacity, location, equipment);
  res.status(201).json(get('SELECT * FROM classrooms WHERE id = ?', [result.lastInsertRowid]));
});

app.get('/api/classes', (req, res) => {
  res.json(all(`
    SELECT c.*, t.name AS teacher_name, t.subject, cr.name AS classroom_name,
      (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = c.id AND sc.status = 'enrolled') AS enrolled_count
    FROM classes c
    LEFT JOIN teachers t ON t.id = c.teacher_id
    LEFT JOIN classrooms cr ON cr.id = c.classroom_id
    WHERE c.status = 'active'
    ORDER BY c.created_at DESC
  `));
});

app.post('/api/classes', (req, res) => {
  const { name, subject = '', teacher_id, classroom_id, capacity = 10, start_date = '', end_date = '', schedule = '' } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: '班级名称不能为空' });
  }
  const result = db.prepare(`
    INSERT INTO classes (name, subject, teacher_id, classroom_id, capacity, start_date, end_date, schedule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, subject, teacher_id, classroom_id, capacity, start_date, end_date, schedule);
  res.status(201).json(get(`
    SELECT c.*, t.name AS teacher_name, cr.name AS classroom_name
    FROM classes c
    LEFT JOIN teachers t ON t.id = c.teacher_id
    LEFT JOIN classrooms cr ON cr.id = c.classroom_id
    WHERE c.id = ?
  `, [result.lastInsertRowid]));
});

app.get('/api/student-classes', (req, res) => {
  const { class_id, student_id } = req.query;
  let sql = `
    SELECT sc.*, st.name AS student_name, st.parent_phone, c.name AS class_name, c.subject,
      p.remaining_hours, p.unit_price
    FROM student_classes sc
    JOIN students st ON st.id = sc.student_id
    JOIN classes c ON c.id = sc.class_id
    LEFT JOIN purchases p ON p.id = sc.purchase_id
    WHERE 1=1
  `;
  const params = [];
  if (class_id) {
    sql += ' AND sc.class_id = ?';
    params.push(class_id);
  }
  if (student_id) {
    sql += ' AND sc.student_id = ?';
    params.push(student_id);
  }
  sql += ' ORDER BY sc.enroll_date DESC, sc.id DESC';
  res.json(all(sql, params));
});

app.post('/api/student-classes', (req, res) => {
  const { student_id, class_id, purchase_id } = req.body || {};
  if (!student_id || !class_id) {
    return res.status(400).json({ error: '学员和班级不能为空' });
  }
  const existing = get('SELECT * FROM student_classes WHERE student_id = ? AND class_id = ? AND status = "enrolled"', [student_id, class_id]);
  if (existing) {
    return res.status(400).json({ error: '该学员已在此班级' });
  }
  const cls = get('SELECT * FROM classes WHERE id = ?', [class_id]);
  const enrolledCount = get('SELECT COUNT(*) AS count FROM student_classes WHERE class_id = ? AND status = "enrolled"', [class_id]).count;
  if (cls && enrolledCount >= cls.capacity) {
    return res.status(400).json({ error: '班级人数已满' });
  }
  const result = db.prepare(`
    INSERT INTO student_classes (student_id, class_id, purchase_id, status, enroll_date)
    VALUES (?, ?, ?, 'enrolled', ?)
  `).run(student_id, class_id, purchase_id, todayStr());
  res.status(201).json(get('SELECT * FROM student_classes WHERE id = ?', [result.lastInsertRowid]));
});

app.get('/api/purchases', (req, res) => {
  const { student_id, status } = req.query;
  let sql = `
    SELECT p.*, st.name AS student_name, cp.name AS package_name
    FROM purchases p
    LEFT JOIN students st ON st.id = p.student_id
    LEFT JOIN course_packages cp ON cp.id = p.package_id
    WHERE 1=1
  `;
  const params = [];
  if (student_id) {
    sql += ' AND p.student_id = ?';
    params.push(student_id);
  }
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY p.created_at DESC, p.id DESC';
  res.json(all(sql, params));
});

app.post('/api/purchases', (req, res) => {
  const { student_id, package_id, total_hours, gift_hours, unit_price, total_amount, discount_amount = 0, paid_amount, has_invoice = 0, invoice_amount = 0, contract_no = '', effective_date = '', expiry_date = '', remark = '' } = req.body || {};
  
  if (!student_id || !paid_amount) {
    return res.status(400).json({ error: '学员和实付金额不能为空' });
  }

  const student = get('SELECT * FROM students WHERE id = ?', [student_id]);
  if (!student) {
    return res.status(404).json({ error: '学员不存在' });
  }

  let pkg = null;
  if (package_id) {
    pkg = get('SELECT * FROM course_packages WHERE id = ?', [package_id]);
    if (!pkg) {
      return res.status(404).json({ error: '课包不存在' });
    }
  }

  const finalTotalHours = total_hours || (pkg ? pkg.total_hours : 0);
  const finalGiftHours = gift_hours !== undefined ? gift_hours : (pkg ? pkg.gift_hours : 0);
  const discount = req.body.discount || (pkg ? pkg.discount : 1);
  const packagePrice = pkg ? pkg.price : 0;
  const finalTotalAmount = total_amount || (packagePrice > 0 ? packagePrice : (finalTotalHours * (unit_price || 0)));
  const finalDiscountAmount = discount_amount || (finalTotalAmount * (1 - discount));
  const finalPaidAmount = paid_amount;
  const finalUnitPrice = unit_price || (finalTotalHours > 0 ? (finalTotalAmount - finalDiscountAmount) / finalTotalHours : 0);
  const finalExpiryDate = expiry_date || (pkg && pkg.valid_months ? new Date(Date.now() + pkg.valid_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '');
  
  if (!finalTotalHours || finalTotalHours <= 0) {
    return res.status(400).json({ error: '课时不能为空' });
  }

  const remaining = finalTotalHours + finalGiftHours;

  const result = db.prepare(`
    INSERT INTO purchases (
      student_id, package_id, total_hours, gift_hours, used_hours, remaining_hours,
      unit_price, total_amount, discount_amount, paid_amount, has_invoice, invoice_amount,
      contract_no, effective_date, expiry_date, status, remark, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).run(
    student_id, package_id, finalTotalHours, finalGiftHours, remaining,
    finalUnitPrice, finalTotalAmount, finalDiscountAmount, finalPaidAmount,
    has_invoice, invoice_amount, contract_no, effective_date || todayStr(),
    finalExpiryDate, remark, nowStr(), nowStr()
  );

  res.status(201).json(get(`
    SELECT p.*, st.name AS student_name, cp.name AS package_name
    FROM purchases p
    LEFT JOIN students st ON st.id = p.student_id
    LEFT JOIN course_packages cp ON cp.id = p.package_id
    WHERE p.id = ?
  `, [result.lastInsertRowid]));
});

app.get('/api/schedules', (req, res) => {
  const { date, class_id, teacher_id } = req.query;
  let sql = `
    SELECT s.*, c.name AS class_name, c.subject, t.name AS teacher_name, cr.name AS classroom_name,
      COUNT(a.id) AS attendance_count,
      (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = s.class_id AND sc.status = 'enrolled') AS enrolled_count
    FROM schedules s
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN teachers t ON t.id = s.teacher_id
    LEFT JOIN classrooms cr ON cr.id = s.classroom_id
    LEFT JOIN attendances a ON a.schedule_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (date) {
    sql += ' AND s.course_date = ?';
    params.push(date);
  }
  if (class_id) {
    sql += ' AND s.class_id = ?';
    params.push(class_id);
  }
  if (teacher_id) {
    sql += ' AND s.teacher_id = ?';
    params.push(teacher_id);
  }
  sql += ' GROUP BY s.id ORDER BY s.course_date DESC, s.start_time DESC';
  res.json(all(sql, params));
});

app.get('/api/schedules/check-conflict', (req, res) => {
  const { course_date, start_time, end_time, teacher_id, classroom_id } = req.query;
  
  if (!course_date || !start_time || !end_time) {
    return res.json({ teacher_conflict: false, classroom_conflict: false });
  }
  
  let teacherConflict = null;
  let classroomConflict = null;
  let teacherName = '';
  let classroomName = '';
  
  if (teacher_id) {
    teacherConflict = get(`
      SELECT s.*, c.name AS class_name, t.name AS teacher_name
      FROM schedules s
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN teachers t ON t.id = s.teacher_id
      WHERE s.teacher_id = ? AND s.course_date = ? 
      AND ((s.start_time < ? AND s.end_time > ?) 
        OR (s.start_time < ? AND s.end_time > ?) 
        OR (s.start_time >= ? AND s.end_time <= ?))
      AND s.status != 'cancelled'
      LIMIT 1
    `, [teacher_id, course_date, end_time, start_time, end_time, start_time, start_time, end_time]);
    if (teacherConflict) teacherName = teacherConflict.teacher_name;
  }
  
  if (classroom_id) {
    classroomConflict = get(`
      SELECT s.*, c.name AS class_name, cr.name AS classroom_name
      FROM schedules s
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN classrooms cr ON cr.id = s.classroom_id
      WHERE s.classroom_id = ? AND s.course_date = ? 
      AND ((s.start_time < ? AND s.end_time > ?) 
        OR (s.start_time < ? AND s.end_time > ?) 
        OR (s.start_time >= ? AND s.end_time <= ?))
      AND s.status != 'cancelled'
      LIMIT 1
    `, [classroom_id, course_date, end_time, start_time, end_time, start_time, start_time, end_time]);
    if (classroomConflict) classroomName = classroomConflict.classroom_name;
  }
  
  res.json({
    teacher_conflict: !!teacherConflict,
    teacher_name: teacherName,
    classroom_conflict: !!classroomConflict,
    classroom_name: classroomName,
    conflict_schedule: teacherConflict || classroomConflict || null
  });
});

app.get('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const schedule = get(`
    SELECT s.*, c.name AS class_name, c.subject, t.name AS teacher_name, cr.name AS classroom_name,
      (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = s.class_id AND sc.status = 'enrolled') AS enrolled_count
    FROM schedules s
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN teachers t ON t.id = s.teacher_id
    LEFT JOIN classrooms cr ON cr.id = s.classroom_id
    WHERE s.id = ?
  `, [id]);
  if (!schedule) {
    return res.status(404).json({ error: '课程不存在' });
  }
  const attendances = all(`
    SELECT a.*, st.name AS student_name, st.parent_phone, p.remaining_hours
    FROM attendances a
    JOIN students st ON st.id = a.student_id
    JOIN purchases p ON p.id = a.purchase_id
    WHERE a.schedule_id = ?
    ORDER BY a.created_at
  `, [id]);
  const enrolledStudents = all(`
    SELECT sc.*, st.name AS student_name, st.parent_phone,
      p.id AS purchase_id, p.remaining_hours, p.unit_price
    FROM student_classes sc
    JOIN students st ON st.id = sc.student_id
    JOIN purchases p ON p.student_id = st.id AND p.status = 'active'
    WHERE sc.class_id = ? AND sc.status = 'enrolled'
    ORDER BY st.name
  `, [schedule.class_id]);
  res.json({ ...schedule, attendances, enrolledStudents });
});

app.post('/api/schedules', (req, res) => {
  const { class_id, teacher_id, classroom_id, course_date, start_time, end_time, capacity, lesson_plan = '' } = req.body || {};
  
  if (!class_id || !course_date || !start_time || !end_time) {
    return res.status(400).json({ error: '班级、日期、起止时间不能为空' });
  }

  const cls = get('SELECT * FROM classes WHERE id = ?', [class_id]);
  if (!cls) {
    return res.status(404).json({ error: '班级不存在' });
  }

  const conflict = get(`
    SELECT * FROM schedules 
    WHERE classroom_id = ? AND course_date = ? 
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))
    AND status != 'cancelled'
  `, [classroom_id, course_date, end_time, start_time, end_time, start_time, start_time, end_time]);
  
  if (conflict) {
    return res.status(400).json({ error: '该教室此时间段已有课程安排' });
  }

  const duration = calcDurationHours(start_time, end_time);
  const result = db.prepare(`
    INSERT INTO schedules (class_id, teacher_id, classroom_id, course_date, start_time, end_time, capacity, lesson_plan, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
  `).run(class_id, teacher_id || cls.teacher_id, classroom_id || cls.classroom_id, course_date, start_time, end_time, capacity || cls.capacity, lesson_plan);

  const scheduleId = result.lastInsertRowid;
  
  const enrolledStudents = all(`
    SELECT sc.student_id, p.id AS purchase_id, p.remaining_hours, p.unit_price
    FROM student_classes sc
    JOIN purchases p ON p.student_id = sc.student_id AND p.status = 'active'
    WHERE sc.class_id = ? AND sc.status = 'enrolled'
    ORDER BY sc.id
  `, [class_id]);

  const attendanceStmt = db.prepare(`
    INSERT INTO attendances (schedule_id, student_id, purchase_id, status, consume_hours, created_at, updated_at)
    VALUES (?, ?, ?, 'reserved', ?, ?, ?)
  `);

  for (const es of enrolledStudents) {
    attendanceStmt.run(scheduleId, es.student_id, es.purchase_id, duration, nowStr(), nowStr());
  }

  res.status(201).json(get(`
    SELECT s.*, c.name AS class_name, t.name AS teacher_name, cr.name AS classroom_name
    FROM schedules s
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN teachers t ON t.id = s.teacher_id
    LEFT JOIN classrooms cr ON cr.id = s.classroom_id
    WHERE s.id = ?
  `, [scheduleId]));
});

app.put('/api/schedules/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  db.prepare('UPDATE schedules SET status = ?, updated_at = ? WHERE id = ?').run(status, nowStr(), id);
  res.json({ success: true, status });
});

app.get('/api/attendance', (req, res) => {
  const { schedule_id, student_id, date } = req.query;
  let sql = `
    SELECT DISTINCT a.*, st.name AS student_name, c.name AS class_name, s.course_date, s.start_time, s.end_time,
      CASE 
        WHEN a.status IN ('normal', 'absent') THEN COALESCE((SELECT SUM(amount) FROM consumptions WHERE attendance_id = a.id), a.consume_hours * p.unit_price)
        ELSE 0 
      END AS consume_amount
    FROM attendances a
    LEFT JOIN students st ON st.id = a.student_id
    LEFT JOIN schedules s ON s.id = a.schedule_id
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN purchases p ON p.id = a.purchase_id
    WHERE 1=1
  `;
  const params = [];
  if (schedule_id) {
    sql += ' AND a.schedule_id = ?';
    params.push(schedule_id);
  }
  if (student_id) {
    sql += ' AND a.student_id = ?';
    params.push(student_id);
  }
  if (date) {
    sql += ' AND s.course_date = ?';
    params.push(date);
  }
  sql += ' ORDER BY s.course_date DESC, s.start_time DESC, a.id DESC';
  res.json(all(sql, params));
});

app.post('/api/attendance/:id/checkin', (req, res) => {
  const { id } = req.params;
  const { status, checkin_time, remark = '' } = req.body || {};

  const validStatuses = ['normal', 'leave', 'absent', 'makeup', 'trial'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的签到状态' });
  }

  const attendance = get('SELECT * FROM attendances WHERE id = ?', [id]);
  if (!attendance) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  if (attendance.status !== 'reserved') {
    return res.status(400).json({ error: '该记录已签到，请勿重复操作' });
  }

  const duplicateCheck = get(`
    SELECT COUNT(*) as count FROM attendances 
    WHERE student_id = ? AND schedule_id = ? AND status != 'reserved' AND id != ?
  `, [attendance.student_id, attendance.schedule_id, id]);
  
  if (duplicateCheck?.count > 0) {
    return res.status(400).json({ error: '该学员在此课程中已有签到记录，请勿重复签到' });
  }

  const purchase = get('SELECT * FROM purchases WHERE id = ?', [attendance.purchase_id]);
  if (!purchase) {
    return res.status(404).json({ error: '购课记录不存在' });
  }

  const schedule = get('SELECT * FROM schedules WHERE id = ?', [attendance.schedule_id]);
  if (!schedule) {
    return res.status(404).json({ error: '课程安排不存在' });
  }

  if (purchase.remaining_hours < attendance.consume_hours && !['leave', 'trial', 'makeup'].includes(status)) {
    return res.status(400).json({ error: '剩余课时不足，请先续费' });
  }

  const doCheckin = transaction(() => {
    db.prepare(`
      UPDATE attendances 
      SET status = ?, checkin_time = ?, remark = ?, updated_at = ?
      WHERE id = ?
    `).run(status, checkin_time || nowStr(), remark, nowStr(), id);

    let consumeHours = attendance.consume_hours;
    let consumeType = 'normal';

    if (status === 'leave') {
      return { success: true, consumed: false, message: '已请假，不扣课时' };
    }
    if (status === 'trial') {
      consumeType = 'trial';
      consumeHours = 0;
    }
    if (status === 'makeup') {
      consumeType = 'makeup';
    }

    const consumeAmount = calcConsumptionAmount(purchase.unit_price, attendance.consume_hours, consumeType);

    if (consumeHours > 0) {
      db.prepare(`
        UPDATE purchases 
        SET used_hours = used_hours + ?, remaining_hours = remaining_hours - ?, updated_at = ?
        WHERE id = ?
      `).run(consumeHours, consumeHours, nowStr(), attendance.purchase_id);

      db.prepare(`
        INSERT INTO consumptions (student_id, purchase_id, attendance_id, schedule_id, hours, unit_price, amount, consume_date, consume_type, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        attendance.student_id, attendance.purchase_id, id, attendance.schedule_id,
        attendance.consume_hours, purchase.unit_price, consumeAmount,
        schedule.course_date, consumeType, remark
      );
    }

    return { success: true, consumed: true, hours: consumeHours, amount: consumeAmount, type: consumeType };
  });

  try {
    const result = doCheckin();
    
    const updatedPurchase = get('SELECT * FROM purchases WHERE id = ?', [attendance.purchase_id]);
    result.balanceAfter = updatedPurchase?.remaining_hours || 0;
    result.unitPrice = updatedPurchase?.unit_price || 0;
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '签到失败: ' + err.message });
  }
});

app.get('/api/finance', (req, res) => {
  const purchases = all(`
    SELECT p.*, st.name AS student_name, cp.name AS package_name
    FROM purchases p
    LEFT JOIN students st ON st.id = p.student_id
    LEFT JOIN course_packages cp ON cp.id = p.package_id
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT 100
  `);
  const refunds = all(`
    SELECT r.*, st.name AS student_name
    FROM refunds r
    LEFT JOIN students st ON st.id = r.student_id
    ORDER BY r.created_at DESC
  `);
  const transfers = all(`
    SELECT tr.*, fs.name AS from_student_name, ts.name AS to_student_name
    FROM transfers tr
    LEFT JOIN students fs ON fs.id = tr.from_student_id
    LEFT JOIN students ts ON ts.id = tr.to_student_id
    ORDER BY tr.created_at DESC
  `);
  const consumptions = all(`
    SELECT c.*, s.course_date, c.consume_type AS status, c.hours, c.amount,
      (SELECT name FROM classes WHERE id = (SELECT class_id FROM schedules WHERE id = c.schedule_id)) AS class_name,
      (SELECT status FROM attendances WHERE id = c.attendance_id) AS attendance_status
    FROM consumptions c
    LEFT JOIN schedules s ON s.id = c.schedule_id
    ORDER BY c.consume_date DESC, c.id DESC
    LIMIT 200
  `);
  
  const summary = {
    totalRevenue: get('SELECT COALESCE(SUM(paid_amount), 0) AS value FROM purchases').value,
    totalConsumed: get('SELECT COALESCE(SUM(amount), 0) AS value FROM consumptions WHERE consume_type = ?', ['normal']).value,
    totalLiability: get('SELECT COALESCE(SUM(remaining_hours * unit_price), 0) AS value FROM purchases WHERE status = ?', ['active']).value,
    pendingRefunds: get("SELECT COALESCE(SUM(refund_amount), 0) AS value FROM refunds WHERE approval_status = 'pending'").value
  };

  res.json({ purchases, refunds, transfers, consumptions, summary });
});

app.post('/api/refunds', (req, res) => {
  const { student_id, purchase_id, refund_hours, reason = '', has_invoice = 0, invoice_return_amount = 0, remark = '' } = req.body || {};

  if (!student_id || !purchase_id || !refund_hours) {
    return res.status(400).json({ error: '学员、购课记录、退费课时不能为空' });
  }

  const purchase = get('SELECT * FROM purchases WHERE id = ? AND student_id = ?', [purchase_id, student_id]);
  if (!purchase) {
    return res.status(404).json({ error: '购课记录不存在' });
  }

  if (refund_hours > purchase.remaining_hours) {
    return res.status(400).json({ error: `退费课时不能超过剩余课时 ${purchase.remaining_hours}` });
  }

  if (purchase.has_invoice && !has_invoice) {
    return res.status(400).json({ error: '该订单已开票，需要先退回发票' });
  }

  const usedPaidHours = Math.min(purchase.used_hours, purchase.total_hours);
  const giftUsed = Math.max(0, purchase.used_hours - purchase.total_hours);
  const refundRatio = refund_hours / (purchase.total_hours + purchase.gift_hours - purchase.used_hours);
  const refundAmount = Math.round(purchase.paid_amount * refundRatio * 100) / 100;

  const result = db.prepare(`
    INSERT INTO refunds (
      student_id, purchase_id, refund_hours, refund_amount, used_hours,
      has_invoice, invoice_return_amount, reason, approval_status, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(student_id, purchase_id, refund_hours, refundAmount, purchase.used_hours, has_invoice, invoice_return_amount, reason, remark);

  res.status(201).json(get('SELECT * FROM refunds WHERE id = ?', [result.lastInsertRowid]));
});

app.put('/api/refunds/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approved_by, status = 'approved' } = req.body || {};

  const refund = get('SELECT * FROM refunds WHERE id = ?', [id]);
  if (!refund) {
    return res.status(404).json({ error: '退费记录不存在' });
  }

  if (refund.approval_status !== 'pending') {
    return res.status(400).json({ error: '该申请已处理' });
  }

  const doApprove = transaction(() => {
    db.prepare(`
      UPDATE refunds 
      SET approval_status = ?, approved_by = ?, approved_at = ?
      WHERE id = ?
    `).run(status, approved_by || '教务主管', nowStr(), id);

    if (status === 'approved') {
      db.prepare(`
        UPDATE purchases 
        SET total_hours = total_hours - ?, 
            remaining_hours = remaining_hours - ?,
            status = CASE WHEN remaining_hours - ? <= 0 THEN 'refunded' ELSE status END,
            updated_at = ?
        WHERE id = ?
      `).run(refund.refund_hours, refund.refund_hours, refund.refund_hours, nowStr(), refund.purchase_id);
    }

    return { success: true, status };
  });

  try {
    const result = doApprove();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '审批失败: ' + err.message });
  }
});

app.post('/api/transfers', (req, res) => {
  const { from_student_id, to_student_id, purchase_id, transfer_hours, reason = '', remark = '' } = req.body || {};

  if (!from_student_id || !to_student_id || !purchase_id || !transfer_hours) {
    return res.status(400).json({ error: '转出学员、转入学员、购课记录、转课时数不能为空' });
  }

  if (from_student_id === to_student_id) {
    return res.status(400).json({ error: '转出和转入学员不能相同' });
  }

  const fromPurchase = get('SELECT * FROM purchases WHERE id = ? AND student_id = ?', [purchase_id, from_student_id]);
  if (!fromPurchase) {
    return res.status(404).json({ error: '转出购课记录不存在' });
  }

  if (transfer_hours > fromPurchase.remaining_hours) {
    return res.status(400).json({ error: `转课时数不能超过剩余课时 ${fromPurchase.remaining_hours}` });
  }

  const toStudent = get('SELECT * FROM students WHERE id = ?', [to_student_id]);
  if (!toStudent) {
    return res.status(404).json({ error: '转入学员不存在' });
  }

  const transferAmount = Math.round(transfer_hours * fromPurchase.unit_price * 100) / 100;

  const result = db.prepare(`
    INSERT INTO transfers (
      from_student_id, to_student_id, purchase_id, transfer_hours, transfer_amount,
      reason, approval_status, remark
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(from_student_id, to_student_id, purchase_id, transfer_hours, transferAmount, reason, remark);

  res.status(201).json(get(`
    SELECT tr.*, fs.name AS from_student_name, ts.name AS to_student_name
    FROM transfers tr
    LEFT JOIN students fs ON fs.id = tr.from_student_id
    LEFT JOIN students ts ON ts.id = tr.to_student_id
    WHERE tr.id = ?
  `, [result.lastInsertRowid]));
});

app.put('/api/transfers/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approved_by, status = 'approved' } = req.body || {};

  const transfer = get('SELECT * FROM transfers WHERE id = ?', [id]);
  if (!transfer) {
    return res.status(404).json({ error: '转课记录不存在' });
  }

  if (transfer.approval_status !== 'pending') {
    return res.status(400).json({ error: '该申请已处理' });
  }

  const doApprove = transaction(() => {
    db.prepare(`
      UPDATE transfers 
      SET approval_status = ?, approved_by = ?, approved_at = ?
      WHERE id = ?
    `).run(status, approved_by || '教务主管', nowStr(), id);

    if (status === 'approved') {
      db.prepare(`
        UPDATE purchases 
        SET remaining_hours = remaining_hours - ?, updated_at = ?
        WHERE id = ?
      `).run(transfer.transfer_hours, nowStr(), transfer.purchase_id);

      const fromPurchase = get('SELECT * FROM purchases WHERE id = ?', [transfer.purchase_id]);
      
      db.prepare(`
        INSERT INTO purchases (
          student_id, package_id, total_hours, gift_hours, used_hours, remaining_hours,
          unit_price, total_amount, discount_amount, paid_amount, has_invoice, invoice_amount,
          contract_no, effective_date, status, remark, created_at, updated_at
        ) VALUES (?, ?, ?, 0, 0, ?, ?, ?, 0, ?, 0, 0, ?, ?, 'active', ?, ?, ?)
      `).run(
        transfer.to_student_id, fromPurchase.package_id, transfer.transfer_hours,
        transfer.transfer_hours, fromPurchase.unit_price, transfer.transfer_amount, 0,
        fromPurchase.contract_no, todayStr(), `转课自学员#${transfer.from_student_id}`,
        nowStr(), nowStr()
      );
    }

    return { success: true, status };
  });

  try {
    const result = doApprove();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '审批失败: ' + err.message });
  }
});

app.get('/api/reports', (req, res) => {
  const { start_date, end_date, startDate, endDate } = req.query;
  const start = startDate || start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const end = endDate || end_date || todayStr();

  const revenueByPackage = all(`
    SELECT cp.name, COUNT(p.id) AS purchase_count, 
      COALESCE(SUM(p.paid_amount), 0) AS paid_amount,
      COALESCE(SUM(p.total_hours), 0) AS total_hours
    FROM course_packages cp
    LEFT JOIN purchases p ON p.package_id = cp.id AND p.created_at BETWEEN ? AND ?
    GROUP BY cp.id
    ORDER BY paid_amount DESC
  `, [start, end + ' 23:59:59']);

  const consumptionBySubject = all(`
    SELECT c.subject, 
      COALESCE(SUM(CASE WHEN co.consume_type = 'normal' THEN co.hours ELSE 0 END), 0) AS hours, 
      COALESCE(SUM(CASE WHEN co.consume_type = 'normal' THEN co.amount ELSE 0 END), 0) AS amount,
      COUNT(DISTINCT co.student_id) AS student_count
    FROM classes c
    LEFT JOIN schedules s ON s.class_id = c.id
    LEFT JOIN consumptions co ON co.schedule_id = s.id AND co.consume_date BETWEEN ? AND ?
    GROUP BY c.subject
    ORDER BY hours DESC
  `, [start, end]);

  const teacherLoad = all(`
    SELECT t.name, t.subject, t.hourly_rate,
      COUNT(DISTINCT s.id) AS scheduled_lessons,
      COALESCE(SUM(CASE WHEN co.consume_type = 'normal' THEN co.hours ELSE 0 END), 0) AS taught_hours,
      COALESCE(SUM(CASE WHEN co.consume_type = 'normal' THEN co.hours ELSE 0 END) * t.hourly_rate, 0) AS salary
    FROM teachers t
    LEFT JOIN schedules s ON s.teacher_id = t.id AND s.course_date BETWEEN ? AND ?
    LEFT JOIN consumptions co ON co.schedule_id = s.id
    GROUP BY t.id
    ORDER BY scheduled_lessons DESC
  `, [start, end]);

  const dailyConsumption = all(`
    SELECT co.consume_date,
      COALESCE(SUM(CASE WHEN co.consume_type = 'normal' THEN co.hours ELSE 0 END), 0) AS hours,
      COALESCE(SUM(CASE WHEN co.consume_type = 'normal' THEN co.amount ELSE 0 END), 0) AS amount,
      COUNT(DISTINCT co.student_id) AS student_count
    FROM consumptions co
    WHERE co.consume_date BETWEEN ? AND ?
    GROUP BY co.consume_date
    ORDER BY co.consume_date
  `, [start, end]);

  const renewalLeads = all(`
    SELECT st.id, st.name, st.parent_phone, st.consultant,
      COALESCE(SUM(p.remaining_hours), 0) AS remaining_hours,
      COALESCE(SUM(p.paid_amount), 0) AS historical_amount,
      MAX(p.created_at) AS last_purchase_date
    FROM students st
    JOIN purchases p ON p.student_id = st.id
    GROUP BY st.id
    HAVING remaining_hours <= 10 AND remaining_hours > 0
    ORDER BY remaining_hours ASC
  `);

  const overall = all(`
    SELECT
      (SELECT COALESCE(SUM(paid_amount), 0) FROM purchases) AS total_revenue,
      (SELECT COALESCE(SUM(CASE WHEN consume_type = 'normal' THEN amount ELSE 0 END), 0) FROM consumptions) AS total_consumed,
      (SELECT COALESCE(SUM(remaining_hours * unit_price), 0) FROM purchases WHERE status = 'active') AS total_liability,
      (SELECT COALESCE(SUM(refund_amount), 0) FROM refunds WHERE approval_status = 'approved') AS total_refunded,
      (SELECT COUNT(*) FROM students WHERE status = 'active') AS active_students,
      (SELECT COUNT(*) FROM purchases WHERE status = 'active') AS active_purchases
  `)[0];

  const periodStats = all(`
    SELECT
      (SELECT COALESCE(SUM(paid_amount), 0) FROM purchases WHERE created_at BETWEEN ? AND ?) AS period_revenue,
      (SELECT COALESCE(SUM(CASE WHEN consume_type = 'normal' THEN amount ELSE 0 END), 0) FROM consumptions WHERE consume_date BETWEEN ? AND ?) AS period_consumed,
      (SELECT COALESCE(SUM(refund_amount), 0) FROM refunds WHERE approval_status = 'approved' AND created_at BETWEEN ? AND ?) AS period_refunded
  `, [start, end + ' 23:59:59', start, end, start, end + ' 23:59:59'])[0];

  overall.period_revenue = periodStats.period_revenue;
  overall.period_consumed = periodStats.period_consumed;
  overall.period_refunded = periodStats.period_refunded;

  res.json({ 
    revenueByPackage, 
    consumptionBySubject, 
    teacherLoad, 
    dailyConsumption,
    renewalLeads,
    overall,
    dateRange: { startDate: start, endDate: end }
  });
});

app.get('/api/consumptions', (req, res) => {
  const { start_date, end_date, student_id } = req.query;
  let sql = `
    SELECT c.*, st.name AS student_name, s.course_date, s.start_time, cls.name AS class_name
    FROM consumptions c
    JOIN students st ON st.id = c.student_id
    LEFT JOIN schedules s ON s.id = c.schedule_id
    LEFT JOIN classes cls ON cls.id = s.class_id
    WHERE 1=1
  `;
  const params = [];
  if (start_date) {
    sql += ' AND c.consume_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND c.consume_date <= ?';
    params.push(end_date);
  }
  if (student_id) {
    sql += ' AND c.student_id = ?';
    params.push(student_id);
  }
  sql += ' ORDER BY c.consume_date DESC, c.id DESC LIMIT 200';
  res.json(all(sql, params));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API not found', path: req.path });
});

app.use(errorHandler);
app.use(notFound);

app.listen(PORT, HOST, () => {
  console.log(`Training center API listening at http://${HOST}:${PORT}`);
  console.log(`Frontend should run at http://${HOST}:${FRONTEND_PORT}`);
});
