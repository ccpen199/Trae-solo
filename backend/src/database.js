const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'data', 'app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS insured_persons (
      id TEXT PRIMARY KEY,
      id_card TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('男', '女')),
      birth_date TEXT,
      phone TEXT,
      address TEXT,
      insurance_type TEXT CHECK(insurance_type IN ('职工医保', '居民医保', '新农合')),
      insurance_area TEXT,
      insured_date TEXT,
      status TEXT CHECK(status IN ('正常参保', '暂停参保', '终止参保')) DEFAULT '正常参保',
      medical_card_number TEXT UNIQUE,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS electronic_credentials (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      credential_number TEXT UNIQUE NOT NULL,
      qr_code TEXT,
      biometric_hash TEXT,
      status TEXT CHECK(status IN ('有效', '失效', '冻结')) DEFAULT '有效',
      issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      last_used_at TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      hospital_id TEXT,
      hospital_name TEXT,
      doctor_id TEXT,
      doctor_name TEXT,
      diagnosis TEXT,
      prescription_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('待审核', '已审核', '已流转', '已核销', '已过期')) DEFAULT '待审核',
      total_amount REAL,
      reimbursement_amount REAL DEFAULT 0,
      self_pay_amount REAL DEFAULT 0,
      pharmacy_id TEXT,
      verification_time TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS prescription_items (
      id TEXT PRIMARY KEY,
      prescription_id TEXT NOT NULL,
      drug_code TEXT,
      drug_name TEXT,
      specification TEXT,
      quantity INTEGER,
      unit TEXT,
      unit_price REAL,
      total_price REAL,
      dosage TEXT,
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    );

    CREATE TABLE IF NOT EXISTS offsite_records (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      record_type TEXT CHECK(record_type IN ('异地就医备案', '转诊转院', '异地安置')),
      from_area TEXT,
      to_area TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT CHECK(status IN ('待审核', '已通过', '已驳回', '已过期')) DEFAULT '待审核',
      reason TEXT,
      auditor TEXT,
      audit_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_continuation (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      from_area TEXT,
      to_area TEXT,
      status TEXT CHECK(status IN ('申请中', '转出地处理', '转入地处理', '已完成', '已驳回')) DEFAULT '申请中',
      application_date TEXT DEFAULT CURRENT_TIMESTAMP,
      completion_date TEXT,
      transfer_amount REAL DEFAULT 0,
      current_step TEXT,
      remarks TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_records (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      offsite_record_id TEXT,
      settlement_type TEXT CHECK(settlement_type IN ('普通门诊', '门诊慢特病', '住院', '药店购药')),
      hospital_name TEXT,
      settlement_date TEXT DEFAULT CURRENT_TIMESTAMP,
      total_amount REAL,
      insurance_pay REAL DEFAULT 0,
      individual_pay REAL DEFAULT 0,
      account_pay REAL DEFAULT 0,
      province_code TEXT,
      is_cross_province INTEGER DEFAULT 0,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id),
      FOREIGN KEY (offsite_record_id) REFERENCES offsite_records(id)
    );

    CREATE TABLE IF NOT EXISTS family_accounts (
      id TEXT PRIMARY KEY,
      main_insured_id TEXT NOT NULL,
      family_member_id TEXT NOT NULL,
      relation TEXT CHECK(relation IN ('配偶', '子女', '父母', '其他')),
      auth_status TEXT CHECK(auth_status IN ('已授权', '已取消')) DEFAULT '已授权',
      auth_date TEXT DEFAULT CURRENT_TIMESTAMP,
      cancel_date TEXT,
      FOREIGN KEY (main_insured_id) REFERENCES insured_persons(id),
      FOREIGN KEY (family_member_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS abnormal_behavior_alerts (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      alert_type TEXT CHECK(alert_type IN ('高频购药', '超量购药', '重复就诊', '异地异常', '其他')),
      alert_level TEXT CHECK(alert_level IN ('低', '中', '高')),
      description TEXT,
      detect_time TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('待处理', '处理中', '已排除', '已处罚')) DEFAULT '待处理',
      handler TEXT,
      handle_time TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS qualification_verifications (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL,
      verify_type TEXT CHECK(verify_type IN ('远程视频', '人脸识别', '生物特征')),
      verify_time TEXT DEFAULT CURRENT_TIMESTAMP,
      result TEXT CHECK(result IN ('通过', '未通过', '待核验')),
      verifier TEXT,
      video_url TEXT,
      similarity_score REAL,
      remarks TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS medical_institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('医院', '药店', '诊所', '体检中心')),
      level TEXT,
      address TEXT,
      contact TEXT,
      is_pointed INTEGER DEFAULT 1,
      inspection_status TEXT CHECK(inspection_status IN ('正常', '待巡检', '整改中', '已取消')) DEFAULT '正常',
      last_inspection_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_knowledge (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      content TEXT,
      keywords TEXT,
      effective_date TEXT,
      expiry_date TEXT,
      status TEXT CHECK(status IN ('生效中', '已废止')) DEFAULT '生效中',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insured_profiles (
      id TEXT PRIMARY KEY,
      insured_person_id TEXT NOT NULL UNIQUE,
      tags TEXT,
      chronic_disease_risk REAL DEFAULT 0,
      visit_frequency TEXT,
      average_cost REAL DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      module TEXT,
      description TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('数据库初始化完成');
}

module.exports = { db, initDatabase };
