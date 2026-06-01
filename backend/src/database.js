import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const projectDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(projectDir, '.env') });

const dataPath = process.env.DATABASE_PATH || './data/app.sqlite';
const dbPath = path.resolve(projectDir, dataPath);
const schemaPath = path.join(projectDir, 'backend/database/schema.sql');
const migrationsPath = path.join(projectDir, 'backend/database/migrations.sql');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');

if (fs.existsSync(schemaPath)) {
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
}

if (fs.existsSync(migrationsPath)) {
  const migrationSQL = fs.readFileSync(migrationsPath, 'utf8');
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const stmt of statements) {
    try {
      db.exec(stmt);
    } catch (err) {
      if (err.message && (
        err.message.includes('duplicate column name') ||
        err.message.includes('already exists') ||
        err.message.includes('Cannot add a column')
      )) {
        console.log(`Migration skipped: ${err.message}`);
      } else {
        throw err;
      }
    }
  }
}

function rowCount(table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function prepare(sql) {
  return db.prepare(sql);
}

function transaction(fn) {
  return function(...args) {
    db.exec('BEGIN TRANSACTION');
    try {
      const result = fn.apply(this, args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

function seedDemoData() {
  if (rowCount('students') > 0) return;

  const students = [
    ['林一诺', '女', '2014-03-12', '13800010001', '林女士', '13900010001', '周顾问', '小升初数学强化'],
    ['陈泽宇', '男', '2013-09-22', '13800010002', '陈先生', '13900010002', '赵顾问', '英语阅读与写作'],
    ['王若曦', '女', '2015-01-08', '13800010003', '王女士', '13900010003', '周顾问', '科学素养提升'],
    ['刘思远', '男', '2012-11-30', '13800010004', '刘先生', '13900010004', '钱顾问', '初中物理预科']
  ];
  const studentStmt = db.prepare(`
    INSERT INTO students (name, gender, birthday, phone, parent_name, parent_phone, consultant, learning_goal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  students.forEach((student) => studentStmt.run(...student));

  const packages = [
    ['30课时基础包', 30, 3600, 0.95, 2, 6],
    ['60课时进阶包', 60, 6600, 0.9, 6, 12],
    ['90课时冲刺包', 90, 9600, 0.86, 10, 18]
  ];
  const packageStmt = db.prepare(`
    INSERT INTO course_packages (name, total_hours, price, discount, gift_hours, valid_months)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  packages.forEach((pkg) => packageStmt.run(...pkg));

  const teachers = [
    ['张明', '13600020001', '数学', 180],
    ['李悦', '13600020002', '英语', 160],
    ['何老师', '13600020003', '科学', 170]
  ];
  const teacherStmt = db.prepare('INSERT INTO teachers (name, phone, subject, hourly_rate) VALUES (?, ?, ?, ?)');
  teachers.forEach((teacher) => teacherStmt.run(...teacher));

  const rooms = [
    ['A101', 12, '一层东区'],
    ['B203', 10, '二层西区'],
    ['Lab-1', 16, '科学实验室']
  ];
  const roomStmt = db.prepare('INSERT INTO classrooms (name, capacity, location) VALUES (?, ?, ?)');
  rooms.forEach((room) => roomStmt.run(...room));

  const classStmt = db.prepare(`
    INSERT INTO classes (name, subject, teacher_id, classroom_id, capacity, start_date, end_date, schedule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  classStmt.run('六年级数学A班', '数学', 1, 1, 10, '2026-05-01', '2026-08-31', '周二/周四 18:30-20:00');
  classStmt.run('英语阅读精品班', '英语', 2, 2, 8, '2026-05-10', '2026-09-10', '周三 19:00-20:30');
  classStmt.run('科学探究班', '科学', 3, 3, 12, '2026-05-15', '2026-07-30', '周六 10:00-11:30');

  const purchaseStmt = db.prepare(`
    INSERT INTO purchases (
      student_id, package_id, total_hours, gift_hours, used_hours, remaining_hours,
      unit_price, total_amount, discount_amount, paid_amount, has_invoice, invoice_amount,
      status, contract_no
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  purchaseStmt.run(1, 2, 60, 6, 14, 52, 99, 6600, 660, 5940, 1, 5940, 'active', 'HT20260528001');
  purchaseStmt.run(2, 1, 30, 2, 8, 24, 114, 3600, 180, 3420, 0, 0, 'active', 'HT20260528002');
  purchaseStmt.run(3, 1, 30, 2, 4, 28, 114, 3600, 180, 3420, 1, 3420, 'active', 'HT20260528003');
  purchaseStmt.run(4, 3, 90, 10, 22, 78, 92, 9600, 1344, 8256, 0, 0, 'active', 'HT20260528004');

  const scStmt = db.prepare('INSERT INTO student_classes (student_id, class_id, purchase_id, status) VALUES (?, ?, ?, ?)');
  [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 1, 4], [4, 3, 4]].forEach((item) => scStmt.run(...item, 'enrolled'));

  const scheduleStmt = db.prepare(`
    INSERT INTO schedules (class_id, teacher_id, classroom_id, course_date, start_time, end_time, capacity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  scheduleStmt.run(1, 1, 1, '2026-05-28', '18:30', '20:00', 10, 'scheduled');
  scheduleStmt.run(2, 2, 2, '2026-05-28', '19:00', '20:30', 8, 'scheduled');
  scheduleStmt.run(3, 3, 3, '2026-05-30', '10:00', '11:30', 12, 'scheduled');
  scheduleStmt.run(1, 1, 1, '2026-05-26', '18:30', '20:00', 10, 'completed');

  const attendanceStmt = db.prepare(`
    INSERT INTO attendances (schedule_id, student_id, purchase_id, status, checkin_time, consume_hours)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  attendanceStmt.run(4, 1, 1, 'normal', '2026-05-26 18:25:00', 1.5);
  attendanceStmt.run(4, 4, 4, 'normal', '2026-05-26 18:31:00', 1.5);
  attendanceStmt.run(1, 1, 1, 'reserved', null, 1.5);
  attendanceStmt.run(2, 2, 2, 'reserved', null, 1.5);

  const consumptionStmt = db.prepare(`
    INSERT INTO consumptions (student_id, purchase_id, attendance_id, schedule_id, hours, amount, unit_price, consume_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  consumptionStmt.run(1, 1, 1, 4, 1.5, 148.5, 99, '2026-05-26');
  consumptionStmt.run(4, 4, 2, 4, 1.5, 138, 92, '2026-05-26');

  run(`
    INSERT INTO refunds (student_id, purchase_id, refund_hours, refund_amount, reason, has_invoice, approval_status, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [2, 2, 2, 228, '调课余额退费', 0, 'pending', null]);

  run(`
    INSERT INTO transfers (from_student_id, to_student_id, purchase_id, transfer_hours, reason, approval_status, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [4, 3, 4, 3, '兄妹课时共享', 'approved', '教务主管']);
}

seedDemoData();

export { db, run, get, all, prepare, transaction, rowCount };
export default db;
