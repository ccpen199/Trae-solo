PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS enterprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unified_social_credit TEXT UNIQUE,
  legal_representative TEXT,
  registered_capital TEXT,
  establishment_date TEXT,
  business_scope TEXT,
  address TEXT,
  status TEXT DEFAULT '正常',
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS judicial_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  case_type TEXT,
  case_reason TEXT,
  court TEXT,
  case_number TEXT,
  filing_date TEXT,
  judgment_date TEXT,
  judgment_result TEXT,
  amount REAL,
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bidding_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  project_name TEXT,
  bidding_amount REAL,
  bidding_date TEXT,
  winning_status TEXT,
  tenderee TEXT,
  region TEXT,
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qualifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  qualification_type TEXT,
  qualification_level TEXT,
  certificate_number TEXT,
  issuing_authority TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  status TEXT DEFAULT '有效',
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS personnel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  name TEXT,
  position TEXT,
  id_card TEXT,
  qualification_certificates TEXT,
  registration_number TEXT,
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  credit_type TEXT,
  credit_level TEXT,
  description TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  display_deadline TEXT,
  status TEXT DEFAULT '有效',
  repair_status TEXT DEFAULT '未修复',
  repair_proof TEXT,
  repair_reviewed_by INTEGER,
  repair_reviewed_at TEXT,
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_abnormalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  abnormal_type TEXT,
  abnormal_reason TEXT,
  decision_authority TEXT,
  decision_date TEXT,
  removal_date TEXT,
  status TEXT DEFAULT '未移除',
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  processing_status TEXT DEFAULT '待处理',
  processing_result TEXT,
  processing_time TEXT,
  reviewer TEXT,
  review_result TEXT,
  review_time TEXT,
  display_deadline TEXT,
  countdown_days INTEGER,
  expiry_status TEXT DEFAULT '公示中',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bid_rigging_suspects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  project_name TEXT,
  bidding_date TEXT,
  suspicion_reason TEXT,
  risk_level TEXT,
  related_enterprises TEXT,
  status TEXT DEFAULT '待核实',
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  processing_status TEXT DEFAULT '待核实',
  processing_result TEXT,
  processing_time TEXT,
  reviewer TEXT,
  review_result TEXT,
  review_time TEXT,
  display_deadline TEXT,
  countdown_days INTEGER,
  expiry_status TEXT DEFAULT '公示中',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subcontractor_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  reason TEXT,
  inclusion_date TEXT,
  risk_level TEXT,
  status TEXT DEFAULT '黑名单中',
  data_source TEXT,
  data_updated_at TEXT,
  source_url TEXT,
  processing_status TEXT DEFAULT '待处理',
  processing_result TEXT,
  processing_time TEXT,
  reviewer TEXT,
  review_result TEXT,
  review_time TEXT,
  display_deadline TEXT,
  countdown_days INTEGER,
  expiry_status TEXT DEFAULT '公示中',
  credit_repair_available INTEGER DEFAULT 1,
  credit_repair_status TEXT,
  credit_repair_application_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  enterprise_id INTEGER,
  rule_name TEXT NOT NULL,
  rule_condition TEXT NOT NULL,
  rule_action TEXT NOT NULL,
  rule_level TEXT DEFAULT 'medium',
  is_enabled INTEGER DEFAULT 1,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS due_diligence_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  user_id INTEGER,
  report_name TEXT,
  report_type TEXT,
  file_path TEXT,
  status TEXT DEFAULT '生成中',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  company TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offline_archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  user_id INTEGER,
  archive_data TEXT,
  qr_code TEXT,
  downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL UNIQUE,
  total_score INTEGER DEFAULT 100,
  business_score INTEGER DEFAULT 25,
  judicial_score INTEGER DEFAULT 25,
  bidding_score INTEGER DEFAULT 15,
  qualification_score INTEGER DEFAULT 15,
  personnel_score INTEGER DEFAULT 10,
  credit_score INTEGER DEFAULT 10,
  risk_level TEXT DEFAULT '低风险',
  calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  business_score_details TEXT,
  judicial_score_details TEXT,
  bidding_score_details TEXT,
  qualification_score_details TEXT,
  personnel_score_details TEXT,
  credit_score_details TEXT,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_repair_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_record_id INTEGER NOT NULL,
  enterprise_id INTEGER NOT NULL,
  applicant TEXT,
  description TEXT,
  proof_file TEXT,
  status TEXT DEFAULT 'pending',
  review_comment TEXT,
  reviewed_by INTEGER,
  reviewed_at TEXT,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_record_id) REFERENCES credit_records(id) ON DELETE CASCADE,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  endpoint TEXT,
  method TEXT,
  params TEXT,
  status_code INTEGER,
  response_time INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
