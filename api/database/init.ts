import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db from './index.js';
import { runMigrations } from './migrate.js';

async function initDatabase(): Promise<void> {
  await runMigrations();
  
  console.log('Seeding initial data...');
  
  const passwordHash = bcrypt.hashSync('123456', 10);
  
  const schoolCount = db.prepare('SELECT COUNT(*) as count FROM schools').get() as { count: number };
  if (schoolCount.count === 0) {
    const insertSchool = db.prepare(`
      INSERT INTO schools (id, name, address, city, district) VALUES (?, ?, ?, ?, ?)
    `);
    insertSchool.run(1, '河南省第一中等职业学校', '郑州市金水区文化路100号', '郑州市', '金水区');
    insertSchool.run(2, '郑州市职业教育中心', '郑州市中原区中原路200号', '郑州市', '中原区');
    console.log('  Inserted schools');
  }
  
  const fenceCount = db.prepare('SELECT COUNT(*) as count FROM geo_fences').get() as { count: number };
  if (fenceCount.count === 0) {
    const insertFence = db.prepare(`
      INSERT INTO geo_fences (school_id, center_lat, center_lng, radius) VALUES (?, ?, ?, ?)
    `);
    insertFence.run(1, 34.7586, 113.6632, 500);
    insertFence.run(2, 34.7466, 113.6254, 500);
    console.log('  Inserted geo fences');
  }
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, role, school_id, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(1, 'admin', passwordHash, '市级管理员', 'city_admin', null, '13800138000', 'active');
    insertUser.run(2, 'school1', passwordHash, '张校长', 'school_admin', 1, '13800138001', 'active');
    insertUser.run(3, 'school2', passwordHash, '李校长', 'school_admin', 2, '13800138002', 'active');
    console.log('  Inserted users');
  }
  
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
  if (studentCount.count === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO students (student_no, name, gender, grade, class, school_id, id_card, is_poverty, is_funding_eligible, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStudent.run('2024001', '张三', 'male', '2024级', '计算机1班', 1, '410101200801010001', 1, 1, 'active');
    insertStudent.run('2024002', '李四', 'female', '2024级', '计算机1班', 1, '410101200801010002', 0, 1, 'active');
    insertStudent.run('2024003', '王五', 'male', '2024级', '计算机2班', 1, '410101200801010003', 1, 1, 'active');
    insertStudent.run('2024004', '赵六', 'female', '2024级', '计算机2班', 1, '410101200801010004', 1, 0, 'active');
    insertStudent.run('2024005', '孙七', 'male', '2024级', '机电1班', 2, '410102200801010005', 0, 1, 'active');
    insertStudent.run('2024006', '周八', 'female', '2024级', '机电1班', 2, '410102200801010006', 1, 1, 'active');
    console.log('  Inserted students');
  }
  
  const fundingCount = db.prepare('SELECT COUNT(*) as count FROM funding_records').get() as { count: number };
  if (fundingCount.count === 0) {
    const insertFunding = db.prepare(`
      INSERT INTO funding_records (student_id, student_name, school_id, funding_type, amount, batch_no, status) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertFunding.run(1, '张三', 1, '国家助学金', 2000, '202401', 'approved');
    insertFunding.run(3, '王五', 1, '国家助学金', 2000, '202401', 'distributed');
    insertFunding.run(4, '赵六', 1, '国家助学金', 2000, '202401', 'pending');
    insertFunding.run(6, '周八', 2, '国家助学金', 2000, '202401', 'received');
    console.log('  Inserted funding records');
  }
  
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alert_records').get() as { count: number };
  if (alertCount.count === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO alert_records (school_id, type, level, student_id, student_name, title, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlert.run(1, 'absent', 'medium', 2, '李四', '学生缺勤预警', '李四今日未打卡，请及时联系确认情况。', 'pending');
    insertAlert.run(1, 'abnormal_leave', 'high', 1, '张三', '异常离校预警', '张三在校外打卡，疑似异常离校，请核查。', 'pending');
    insertAlert.run(2, 'funding_exception', 'low', null, null, '资助名单异常', '学校资助名单与学籍库存在差异，请复核。', 'pending');
    console.log('  Inserted alert records');
  }
  
  console.log('Database initialization completed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
  });
}

export { initDatabase };
