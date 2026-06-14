const path = require('path');
const fs = require('fs');

// 尝试从多个位置加载 better-sqlite3
let Database = null;
const possiblePaths = [
  path.join(__dirname, 'node_modules/better-sqlite3'),
  path.join(__dirname, 'backend/node_modules/better-sqlite3'),
];

for (const p of possiblePaths) {
  try {
    Database = require(p);
    console.log('✅ 从', p, '加载 better-sqlite3 成功');
    break;
  } catch (e) {
    console.log('⚠️  从', p, '加载失败:', e.message.substring(0, 100));
  }
}

if (!Database) {
  console.error('❌ 无法加载 better-sqlite3');
  process.exit(1);
}

const dbPath = path.resolve(__dirname, 'data/app.sqlite');
console.log('数据库路径:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 执行迁移
function migrateAbnormalitiesTable() {
  const columns = db.prepare("PRAGMA table_info(business_abnormalities)").all();
  const colNames = columns.map(c => c.name);
  console.log('business_abnormalities 现有字段:', colNames.length);
  
  const fields = [
    ['data_source', 'TEXT'],
    ['data_updated_at', 'TEXT'],
    ['source_url', 'TEXT'],
    ['processing_status', 'TEXT DEFAULT \'待处理\''],
    ['processing_result', 'TEXT'],
    ['processing_time', 'TEXT'],
    ['reviewer', 'TEXT'],
    ['review_result', 'TEXT'],
    ['review_time', 'TEXT'],
    ['display_deadline', 'TEXT'],
    ['countdown_days', 'INTEGER'],
    ['expiry_status', 'TEXT DEFAULT \'公示中\'']
  ];
  
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      console.log('添加字段:', name);
      db.prepare(`ALTER TABLE business_abnormalities ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  // 填充示例数据
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const update = db.prepare(`
    UPDATE business_abnormalities 
    SET data_source = ?, data_updated_at = ?, source_url = ?, 
        processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?
    WHERE data_source IS NULL
  `);
  const records = db.prepare(`SELECT id FROM business_abnormalities WHERE data_source IS NULL`).all();
  records.forEach(r => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    update.run('国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn', '待处理', deadline, days, '公示中');
  });
  console.log('✅ business_abnormalities 迁移完成，更新了', records.length, '条记录');
}

function migrateBidRiggingTable() {
  const columns = db.prepare("PRAGMA table_info(bid_rigging_suspects)").all();
  const colNames = columns.map(c => c.name);
  
  const fields = [
    ['data_source', 'TEXT'],
    ['data_updated_at', 'TEXT'],
    ['source_url', 'TEXT'],
    ['processing_status', 'TEXT DEFAULT \'待核实\''],
    ['processing_result', 'TEXT'],
    ['processing_time', 'TEXT'],
    ['reviewer', 'TEXT'],
    ['review_result', 'TEXT'],
    ['review_time', 'TEXT'],
    ['display_deadline', 'TEXT'],
    ['countdown_days', 'INTEGER'],
    ['expiry_status', 'TEXT DEFAULT \'公示中\'']
  ];
  
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      console.log('添加字段:', name);
      db.prepare(`ALTER TABLE bid_rigging_suspects ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const update = db.prepare(`
    UPDATE bid_rigging_suspects 
    SET data_source = ?, data_updated_at = ?, source_url = ?, 
        processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?
    WHERE data_source IS NULL
  `);
  const records = db.prepare(`SELECT id FROM bid_rigging_suspects WHERE data_source IS NULL`).all();
  records.forEach(r => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    update.run('全国公共资源交易平台', now, 'http://www.ggzy.gov.cn', '待核实', deadline, days, '公示中');
  });
  console.log('✅ bid_rigging_suspects 迁移完成，更新了', records.length, '条记录');
}

function migrateBlacklistTable() {
  const columns = db.prepare("PRAGMA table_info(subcontractor_blacklist)").all();
  const colNames = columns.map(c => c.name);
  
  const fields = [
    ['data_source', 'TEXT'],
    ['data_updated_at', 'TEXT'],
    ['source_url', 'TEXT'],
    ['processing_status', 'TEXT DEFAULT \'待处理\''],
    ['processing_result', 'TEXT'],
    ['processing_time', 'TEXT'],
    ['reviewer', 'TEXT'],
    ['review_result', 'TEXT'],
    ['review_time', 'TEXT'],
    ['display_deadline', 'TEXT'],
    ['countdown_days', 'INTEGER'],
    ['expiry_status', 'TEXT DEFAULT \'公示中\''],
    ['credit_repair_available', 'INTEGER DEFAULT 1'],
    ['credit_repair_status', 'TEXT'],
    ['credit_repair_application_id', 'INTEGER']
  ];
  
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      console.log('添加字段:', name);
      db.prepare(`ALTER TABLE subcontractor_blacklist ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const update = db.prepare(`
    UPDATE subcontractor_blacklist 
    SET data_source = ?, data_updated_at = ?, source_url = ?, 
        processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?,
        credit_repair_available = ?
    WHERE data_source IS NULL
  `);
  const records = db.prepare(`SELECT id FROM subcontractor_blacklist WHERE data_source IS NULL`).all();
  records.forEach(r => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    update.run('全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn', '待处理', deadline, days, '公示中', 1);
  });
  console.log('✅ subcontractor_blacklist 迁移完成，更新了', records.length, '条记录');
}

function migrateHealthScoresTable() {
  const columns = db.prepare("PRAGMA table_info(health_scores)").all();
  const colNames = columns.map(c => c.name);
  
  const fields = [
    ['business_score_details', 'TEXT'],
    ['judicial_score_details', 'TEXT'],
    ['bidding_score_details', 'TEXT'],
    ['qualification_score_details', 'TEXT'],
    ['personnel_score_details', 'TEXT'],
    ['credit_score_details', 'TEXT']
  ];
  
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      console.log('添加字段:', name);
      db.prepare(`ALTER TABLE health_scores ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const details = {
    business: [
      { source: '工商登记信息', deduction: 0, reason: '信息完整', record_id: 'bus-001' },
      { source: '年报公示', deduction: 2, reason: '年报逾期30天', record_id: 'bus-002' },
      { source: '经营异常记录', deduction: 3, reason: '存在经营异常记录', record_id: 'abn-001' }
    ],
    judicial: [
      { source: '裁判文书网', deduction: 3, reason: '存在合同纠纷判决', record_id: 'jud-001' },
      { source: '失信被执行人', deduction: 0, reason: '无失信记录', record_id: 'jud-002' },
      { source: '被执行人信息', deduction: 2, reason: '存在被执行记录', record_id: 'jud-003' }
    ],
    personnel: [
      { source: '注册建造师', deduction: 0, reason: '人员配置完整', record_id: 'per-001' },
      { source: '技术职称', deduction: 0, reason: '职称人员达标', record_id: 'per-002' }
    ],
    credit: [
      { source: '行政处罚记录', deduction: 3, reason: '存在行政处罚记录', record_id: 'cre-001' },
      { source: '信用评价', deduction: 2, reason: '信用等级一般', record_id: 'cre-002' }
    ]
  };
  
  const update = db.prepare(`
    UPDATE health_scores 
    SET personnel_score_details = ?, credit_score_details = ?,
        business_score_details = ?, judicial_score_details = ?
    WHERE personnel_score_details IS NULL
  `);
  const scores = db.prepare(`SELECT id FROM health_scores WHERE personnel_score_details IS NULL`).all();
  scores.forEach(s => {
    update.run(
      JSON.stringify(details.personnel),
      JSON.stringify(details.credit),
      JSON.stringify(details.business),
      JSON.stringify(details.judicial)
    );
  });
  console.log('✅ health_scores 迁移完成，更新了', scores.length, '条记录');
}

// 执行所有迁移
console.log('\n🚀 开始数据库迁移...\n');
migrateAbnormalitiesTable();
migrateBidRiggingTable();
migrateBlacklistTable();
migrateHealthScoresTable();

// 验证结果
console.log('\n✅ 迁移验证:');
const r = db.prepare('SELECT id, data_source, source_url, processing_status, countdown_days FROM business_abnormalities LIMIT 1').get();
console.log('经营异常示例:', JSON.stringify(r));
const s = db.prepare('SELECT id, personnel_score_details FROM health_scores WHERE personnel_score_details IS NOT NULL LIMIT 1').get();
console.log('评分详情示例:', s ? '存在' : '不存在');

db.close();
console.log('\n🎉 所有迁移完成！');
