const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('therapist', 'doctor', 'admin', 'patient')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      phone TEXT,
      diagnosis TEXT,
      contraindications TEXT,
      goals TEXT,
      therapist_id INTEGER,
      training_cycle TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (therapist_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      scale_name TEXT NOT NULL,
      scale_version TEXT NOT NULL,
      content TEXT NOT NULL,
      score REAL,
      assessor_id INTEGER,
      assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (assessor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      confirmed_by INTEGER,
      training_items TEXT NOT NULL,
      frequency TEXT,
      intensity TEXT,
      notes TEXT,
      assessment_nodes TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'executing', 'completed', 'cancelled')),
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS training_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      training_date DATE NOT NULL,
      completion_status TEXT NOT NULL,
      pain_score INTEGER DEFAULT 0,
      movement_quality TEXT,
      therapist_notes TEXT,
      abort_reason TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS efficacy_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      start_assessment_id INTEGER,
      end_assessment_id INTEGER,
      adherence_rate REAL,
      goal_achievement REAL,
      analysis TEXT,
      recommendations TEXT,
      analyzed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (start_assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (end_assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (analyzed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS prescription_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      changed_by INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)
    `);
    
    insertUser.run('admin', hash, '系统管理员', 'admin');
    insertUser.run('doctor1', hash, '张医生', 'doctor');
    insertUser.run('therapist1', hash, '李治疗师', 'therapist');
    
    const insertPatient = db.prepare(`
      INSERT INTO patients (patient_no, name, gender, age, phone, diagnosis, contraindications, goals, therapist_id, training_cycle, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPatient.run('P20240001', '王建国', '男', 58, '13800138001', '脑卒中后左侧肢体偏瘫', '严重心脏病、高血压三级', '恢复独立行走能力，提高日常生活自理能力', 3, '12周，每周5次', 'active');
    insertPatient.run('P20240002', '李秀英', '女', 65, '13800138002', '膝关节置换术后康复', '糖尿病、骨质疏松', '恢复膝关节正常活动范围，能独立上下楼', 3, '8周，每周3次', 'active');
    insertPatient.run('P20240003', '张志伟', '男', 45, '13800138003', '腰椎间盘突出症', '腰部急性损伤期', '缓解疼痛，恢复腰部功能，重返工作岗位', 3, '6周，每周4次', 'active');
    insertPatient.run('P20240004', '陈美玲', '女', 72, '13800138004', '帕金森病', '严重认知障碍', '改善平衡能力，延缓功能衰退', 3, '持续训练', 'active');
    insertPatient.run('P20240005', '刘大明', '男', 52, '13800138005', '骨折术后功能障碍', '无', '恢复患肢肌力和关节活动度', 3, '10周，每周4次', 'active');
    
    const insertAssessment = db.prepare(`
      INSERT INTO assessments (patient_id, scale_name, scale_version, content, score, assessor_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertAssessment.run(1, 'Fugl-Meyer 运动功能评估', '1.0', JSON.stringify({ upper: 35, lower: 20, balance: 12 }), 67, 2);
    insertAssessment.run(1, 'Barthel 指数评定', '1.0', JSON.stringify({ feeding: 5, bathing: 0, grooming: 5, dressing: 5 }), 45, 2);
    insertAssessment.run(2, 'HSS 膝关节评分', '1.0', JSON.stringify({ pain: 20, function: 15, rangeOfMotion: 10 }), 55, 2);
    insertAssessment.run(3, 'JOA 腰椎评分', '1.0', JSON.stringify({ subjective: 6, objective: 8, daily: 10 }), 24, 2);
    
    const insertPrescription = db.prepare(`
      INSERT INTO prescriptions (patient_id, created_by, confirmed_by, training_items, frequency, intensity, notes, assessment_nodes, status, confirmed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const items1 = JSON.stringify([
      { name: '偏瘫肢体综合训练', duration: '30', sets: '1', reps: '' },
      { name: '平衡功能训练', duration: '20', sets: '1', reps: '' },
      { name: '作业治疗', duration: '20', sets: '1', reps: '' }
    ]);
    const items2 = JSON.stringify([
      { name: '膝关节活动度训练', duration: '25', sets: '3', reps: '10' },
      { name: '股四头肌力量训练', duration: '20', sets: '3', reps: '15' },
      { name: '步行训练', duration: '15', sets: '1', reps: '' }
    ]);
    const items3 = JSON.stringify([
      { name: '核心稳定性训练', duration: '20', sets: '3', reps: '12' },
      { name: '麦肯基疗法', duration: '20', sets: '1', reps: '' },
      { name: '牵引治疗', duration: '15', sets: '1', reps: '' }
    ]);
    const nodes = JSON.stringify(['第2周', '第4周', '第8周', '第12周']);
    
    insertPrescription.run(1, 3, 2, items1, '每周5次', '中', '注意监测血压，训练中如感头晕立即停止', nodes, 'confirmed', '2024-01-15 10:00:00');
    insertPrescription.run(2, 3, 2, items2, '每周3次', '中', '训练后冰敷15分钟', nodes, 'confirmed', '2024-01-16 11:00:00');
    insertPrescription.run(3, 3, 2, items3, '每周4次', '低', '避免弯腰负重动作', nodes, 'confirmed', '2024-01-17 09:00:00');
    insertPrescription.run(4, 3, null, JSON.stringify([{ name: '关节活动度训练', duration: '20', sets: '2', reps: '10' }]), '每日1次', '低', '', nodes, 'pending', null);
    
    const insertTraining = db.prepare(`
      INSERT INTO training_records (prescription_id, patient_id, training_date, completion_status, pain_score, movement_quality, therapist_notes, abort_reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i - 1);
      const dateStr = date.toISOString().split('T')[0];
      
      insertTraining.run(1, 1, dateStr, 'completed', i === 2 ? 3 : 2, i === 3 ? '良好' : '一般', `第${5-i}次训练，患者表现${i === 1 ? '积极' : '稳定'}`, '', 3);
    }
    
    insertTraining.run(2, 2, new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0], 'completed', 5, '一般', '膝关节活动度有改善', '', 3);
    insertTraining.run(3, 3, new Date().toISOString().split('T')[0], 'completed', 2, '良好', '疼痛明显缓解', '', 3);
    
    const insertAnalysis = db.prepare(`
      INSERT INTO efficacy_analyses (patient_id, start_assessment_id, end_assessment_id, adherence_rate, goal_achievement, analysis, recommendations, analyzed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertAnalysis.run(1, 1, 2, 85, 60, 
      '起始评分67分，末次评分45分。患者训练依从性较好，但运动功能提升较慢，日常生活能力有改善趋势。',
      '建议：1. 增加一对一指导时间；2. 调整训练强度，循序渐进；3. 加强家属配合，增加居家训练。',
      2);
  }
}

module.exports = { db, initDatabase };
