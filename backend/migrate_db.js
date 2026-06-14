const Database = require('better-sqlite3');
const path = require('path');
const PROJECT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.resolve(PROJECT_DIR, './data/app.sqlite');
console.log('DB_PATH:', DB_PATH);

const db = new Database(DB_PATH);

console.log('\n=== 开始数据库迁移 ===');

const addColumns = [
  'ALTER TABLE job_requirements ADD COLUMN detailed_address TEXT',
  'ALTER TABLE job_requirements ADD COLUMN skill_level_required TEXT',
  'ALTER TABLE job_requirements ADD COLUMN work_duration TEXT',
  'ALTER TABLE job_requirements ADD COLUMN daily_wage_min REAL',
  'ALTER TABLE job_requirements ADD COLUMN daily_wage_max REAL',
  'ALTER TABLE job_requirements ADD COLUMN payment_method TEXT',
  'ALTER TABLE job_requirements ADD COLUMN provides_food INTEGER DEFAULT 0',
  'ALTER TABLE job_requirements ADD COLUMN provides_lodging INTEGER DEFAULT 0',
  'ALTER TABLE job_requirements ADD COLUMN certificate_required INTEGER DEFAULT 0',
  'ALTER TABLE job_requirements ADD COLUMN certificate_types TEXT',
  'ALTER TABLE job_requirements ADD COLUMN safety_training TEXT',
  'ALTER TABLE job_requirements ADD COLUMN other_qualifications TEXT',
  'ALTER TABLE job_requirements ADD COLUMN project_intro TEXT',
  'ALTER TABLE job_requirements ADD COLUMN construction_environment TEXT',
  'ALTER TABLE job_requirements ADD COLUMN notes TEXT',
];

addColumns.forEach(sql => {
  try {
    db.prepare(sql).run();
    console.log('✓ 执行成功:', sql.substring(0, 60));
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('− 已存在，跳过:', sql.substring(0, 60));
    } else {
      console.error('✗ 执行失败:', sql.substring(0, 60), err.message);
    }
  }
});

console.log('\n=== 更新工人健康数据 ===');
const workerUpdates = [
  { id: 1, health_code_source: 'yueshengshi', health_code_updated_at: '2026-06-01', nucleic_acid_status: 'negative', vaccination_status: 'three_doses' },
  { id: 2, health_code_source: 'alipay', health_code_updated_at: '2026-06-02', nucleic_acid_status: 'negative', vaccination_status: 'two_doses' },
  { id: 3, health_code_source: 'national', health_code_updated_at: '2026-06-03', nucleic_acid_status: 'untested', vaccination_status: 'three_doses' },
  { id: 4, health_code_source: 'yueshengshi', health_code_updated_at: '2026-06-01', nucleic_acid_status: 'negative', vaccination_status: 'one_dose' },
  { id: 5, health_code_source: 'alipay', health_code_updated_at: '2026-06-04', nucleic_acid_status: 'positive', vaccination_status: 'three_doses' },
  { id: 6, health_code_source: 'national', health_code_updated_at: '2026-06-05', nucleic_acid_status: 'negative', vaccination_status: 'two_doses' },
  { id: 7, health_code_source: 'yueshengshi', health_code_updated_at: '2026-06-03', nucleic_acid_status: 'negative', vaccination_status: 'three_doses' },
  { id: 8, health_code_source: 'alipay', health_code_updated_at: '2026-06-02', nucleic_acid_status: 'untested', vaccination_status: 'unvaccinated' },
];

const updateStmt = db.prepare(`
  UPDATE workers SET 
    health_code_source = ?,
    health_code_updated_at = ?,
    nucleic_acid_status = ?,
    vaccination_status = ?
  WHERE id = ?
`);

workerUpdates.forEach(w => {
  updateStmt.run(w.health_code_source, w.health_code_updated_at, w.nucleic_acid_status, w.vaccination_status, w.id);
  console.log(`✓ 更新工人 ${w.id} 健康数据`);
});

console.log('\n=== 迁移完成 ===');

const jobColumns = db.prepare('PRAGMA table_info(job_requirements)').all();
console.log('\n=== job_requirements表字段 ===');
jobColumns.forEach(c => console.log(c.cid, c.name, c.type));

const worker = db.prepare('SELECT * FROM workers WHERE id = 1').get();
console.log('\n=== 工人1数据 ===');
console.log('health_code_source:', worker.health_code_source);
console.log('health_code_updated_at:', worker.health_code_updated_at);
console.log('nucleic_acid_status:', worker.nucleic_acid_status);
console.log('vaccination_status:', worker.vaccination_status);
