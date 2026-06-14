const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const SQLITE_CLI = '/usr/bin/sqlite3';
const DB_PATH = path.join(__dirname, '..', 'data', 'app.sqlite');

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function replacePlaceholders(sql, params) {
  if (!params || params.length === 0) {
    return sql;
  }
  let result = sql;
  let paramIndex = 0;
  result = result.replace(/\?/g, () => {
    if (paramIndex >= params.length) {
      return '?';
    }
    return escapeValue(params[paramIndex++]);
  });
  return result;
}

function runSql(sql, params = [], jsonMode = false) {
  const finalSql = replacePlaceholders(sql, params);
  
  const input = (jsonMode ? '.mode json\n' : '') + finalSql + '\n';
  
  try {
    const args = [DB_PATH];
    if (jsonMode) {
      args.unshift('-json');
    }
    
    const output = execFileSync(SQLITE_CLI, args, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      input: input
    });
    
    if (jsonMode && output.trim()) {
      try {
        return JSON.parse(output);
      } catch (e) {
        return [];
      }
    }
    return output;
  } catch (error) {
    console.error('SQL error:', error.message, '\nSQL:', sql.substring(0, 100));
    throw error;
  }
}

function query(sql, params = []) {
  const result = runSql(sql, params, true);
  if (Array.isArray(result)) {
    return result.map(row => {
      const newRow = {};
      for (const key of Object.keys(row)) {
        let value = row[key];
        if (value === null || value === undefined) {
          newRow[key] = null;
        } else if (typeof value === 'string' && !isNaN(Number(value)) && value !== '' && !isNaN(parseFloat(value)) && isFinite(value)) {
          if (value.includes('.') || value.length > 15) {
            newRow[key] = value;
          } else {
            const num = Number(value);
            if (Number.isSafeInteger(num) && String(num) === value) {
              newRow[key] = num;
            } else {
              newRow[key] = value;
            }
          }
        } else {
          newRow[key] = value;
        }
      }
      return newRow;
    });
  }
  return [];
}

function execute(sql, params = []) {
  runSql(sql, params, false);
  return true;
}

function getLastInsertId() {
  const result = query('SELECT last_insert_rowid() as id');
  return result[0]?.id || 0;
}

function initDatabase() {
  const checkResult = query(`
    SELECT COUNT(*) as count FROM sqlite_master 
    WHERE type='table' AND name NOT IN ('notes', 'tasks')
  `);
  
  const tableCount = checkResult[0]?.count || 0;
  
  execute('PRAGMA journal_mode=WAL;');
  execute('PRAGMA foreign_keys=ON;');
  
  if (tableCount === 0) {
    const schemaSql = buildSchema();
    
    try {
      execFileSync(SQLITE_CLI, [DB_PATH], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
        input: schemaSql
      });
      console.log('Database initialized successfully with full schema');
    } catch (e) {
      console.warn('Some statements may have failed, but continuing:', e.message?.substring(0, 150));
    }
  }
  
  return true;
}

function buildSchema() {
  let sql = '';
  
  sql += `
.bail ON
.timeout 30000
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  user_type VARCHAR(20) NOT NULL DEFAULT 'personal',
  phone VARCHAR(20),
  email VARCHAR(100),
  id_card VARCHAR(18),
  avatar VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  region VARCHAR(100),
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 个人用户
CREATE TABLE IF NOT EXISTS personal_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  gender VARCHAR(10),
  birth_date DATE,
  education VARCHAR(50),
  employment_status VARCHAR(50),
  household_address VARCHAR(255),
  residential_address VARCHAR(255),
  ethnicity VARCHAR(50),
  marital_status VARCHAR(20),
  political_status VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS social_insurance_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insurance_type_id INTEGER NOT NULL,
  account_no VARCHAR(50) UNIQUE,
  personal_balance DECIMAL(15,2) DEFAULT 0,
  unit_balance DECIMAL(15,2) DEFAULT 0,
  accumulated_months INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'normal',
  first_payment_date DATE,
  last_payment_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
);

CREATE TABLE IF NOT EXISTS insurance_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insurance_account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  payment_year INTEGER NOT NULL,
  payment_month INTEGER NOT NULL,
  payment_base DECIMAL(15,2),
  personal_payment DECIMAL(15,2),
  unit_payment DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'paid',
  payment_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insurance_account_id) REFERENCES social_insurance_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insurance_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  personal_rate DECIMAL(5,4),
  unit_rate DECIMAL(5,4),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insurance_account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  payment_year INTEGER NOT NULL,
  payment_month INTEGER NOT NULL,
  payment_base DECIMAL(15,2),
  personal_payment DECIMAL(15,2),
  unit_payment DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'paid',
  payment_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insurance_account_id) REFERENCES social_insurance_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 企业用户
CREATE TABLE IF NOT EXISTS enterprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  enterprise_name VARCHAR(200) NOT NULL,
  unified_credit_code VARCHAR(18) UNIQUE NOT NULL,
  industry VARCHAR(100),
  enterprise_type VARCHAR(50),
  registration_date DATE,
  registered_capital DECIMAL(18,2),
  legal_representative VARCHAR(100),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  address VARCHAR(255),
  region VARCHAR(100),
  status VARCHAR(20) DEFAULT 'normal',
  business_license VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enterprise_employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position VARCHAR(100),
  department VARCHAR(100),
  entry_date DATE,
  employment_status VARCHAR(20) DEFAULT 'active',
  salary DECIMAL(15,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(enterprise_id, user_id)
);

-- 机构用户
CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  agency_name VARCHAR(200) NOT NULL,
  agency_code VARCHAR(50) UNIQUE,
  agency_level VARCHAR(20),
  region VARCHAR(100),
  address VARCHAR(255),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  jurisdiction TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agency_staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position VARCHAR(100),
  department VARCHAR(100),
  work_no VARCHAR(50),
  responsibilities TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(agency_id, user_id)
);

-- 社保服务
CREATE TABLE IF NOT EXISTS insurance_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insurance_type_id INTEGER NOT NULL,
  registration_type VARCHAR(50) NOT NULL,
  applicant_type VARCHAR(20) DEFAULT 'personal',
  region VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 3,
  application_materials TEXT,
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
);

CREATE TABLE IF NOT EXISTS base_declarations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  declaration_year INTEGER NOT NULL,
  declaration_month INTEGER NOT NULL,
  total_employees INTEGER DEFAULT 0,
  total_payment_base DECIMAL(18,2) DEFAULT 0,
  applicant_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS base_declaration_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  declaration_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  insurance_type_id INTEGER NOT NULL,
  payment_base DECIMAL(15,2),
  personal_payment DECIMAL(15,2),
  unit_payment DECIMAL(15,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (declaration_id) REFERENCES base_declarations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
);

CREATE TABLE IF NOT EXISTS benefit_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insurance_type_id INTEGER NOT NULL,
  certification_method VARCHAR(50) NOT NULL,
  certification_date DATETIME NOT NULL,
  certification_result VARCHAR(20) NOT NULL,
  face_image_data TEXT,
  location VARCHAR(255),
  next_certification_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
);

CREATE TABLE IF NOT EXISTS insurance_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insurance_type_id INTEGER NOT NULL,
  transfer_type VARCHAR(20) NOT NULL,
  from_region VARCHAR(100) NOT NULL,
  to_region VARCHAR(100) NOT NULL,
  personal_account_balance DECIMAL(15,2),
  unit_account_balance DECIMAL(15,2),
  total_months INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
);

CREATE TABLE IF NOT EXISTS electronic_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  certificate_type VARCHAR(50) NOT NULL,
  certificate_no VARCHAR(100) UNIQUE NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'valid',
  issued_by VARCHAR(200),
  qr_code_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificate_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id INTEGER NOT NULL,
  verifier_type VARCHAR(20),
  verifier_name VARCHAR(100),
  verifier_id_card VARCHAR(18),
  verification_result VARCHAR(20),
  verification_purpose VARCHAR(100),
  verification_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (certificate_id) REFERENCES electronic_certificates(id) ON DELETE CASCADE
);

-- 就业服务
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  job_type VARCHAR(50),
  industry VARCHAR(100),
  work_location VARCHAR(200),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_type VARCHAR(20) DEFAULT 'monthly',
  education_requirement VARCHAR(50),
  experience_requirement VARCHAR(100),
  job_description TEXT,
  job_requirements TEXT,
  benefits TEXT,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'published',
  publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  apply_count INTEGER DEFAULT 0,
  match_score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  resume_title VARCHAR(200),
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  expected_work_location VARCHAR(200),
  expected_job_type VARCHAR(50),
  self_introduction TEXT,
  skills TEXT,
  work_experience_years INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resume_id INTEGER NOT NULL,
  company_name VARCHAR(200),
  position VARCHAR(100),
  start_date DATE,
  end_date DATE,
  is_current INTEGER DEFAULT 0,
  salary INTEGER,
  work_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS education_experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resume_id INTEGER NOT NULL,
  school_name VARCHAR(200),
  degree VARCHAR(50),
  major VARCHAR(100),
  start_date DATE,
  end_date DATE,
  gpa DECIMAL(3,2),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  resume_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  current_stage VARCHAR(50) DEFAULT 'initial_screening',
  application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  employer_feedback TEXT,
  interview_date DATETIME,
  interview_location VARCHAR(255),
  offer_amount INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(id)
);

CREATE TABLE IF NOT EXISTS application_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  stage VARCHAR(50),
  status VARCHAR(20),
  operator_id INTEGER,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS job_fairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(200) NOT NULL,
  organizer VARCHAR(200),
  fair_type VARCHAR(50),
  start_time DATETIME,
  end_time DATETIME,
  location VARCHAR(255),
  online_url VARCHAR(255),
  description TEXT,
  max_enterprises INTEGER,
  max_attendees INTEGER,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_fair_user_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_fair_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_fair_id) REFERENCES job_fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_fair_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_name VARCHAR(200) NOT NULL,
  course_code VARCHAR(50) UNIQUE,
  category VARCHAR(50),
  level VARCHAR(20),
  description TEXT,
  total_hours INTEGER,
  total_credits INTEGER,
  fee DECIMAL(10,2) DEFAULT 0,
  subsidy_amount DECIMAL(10,2) DEFAULT 0,
  instructor VARCHAR(100),
  start_date DATE,
  end_date DATE,
  max_students INTEGER DEFAULT 50,
  enrolled_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  actual_fee DECIMAL(10,2),
  subsidy_received INTEGER DEFAULT 0,
  enrollment_status VARCHAR(20) DEFAULT 'enrolled',
  grade INTEGER,
  certificate_issued INTEGER DEFAULT 0,
  enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present',
  sign_in_time DATETIME,
  sign_out_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER,
  credit_type VARCHAR(50),
  credit_amount INTEGER,
  earned_date DATE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(id)
);

-- 考试服务
CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_name VARCHAR(200) NOT NULL,
  exam_code VARCHAR(50) UNIQUE,
  exam_type VARCHAR(50),
  organizer VARCHAR(200),
  description TEXT,
  exam_date DATE,
  exam_time VARCHAR(20),
  registration_start_date DATE,
  registration_end_date DATE,
  application_fee DECIMAL(10,2),
  exam_fee DECIMAL(10,2),
  exam_cities TEXT,
  status VARCHAR(20) DEFAULT 'registration_not_started',
  certificate_validity_period INTEGER,
  passing_score INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  announcement_type VARCHAR(50),
  publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  id_card VARCHAR(18) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  birth_date DATE,
  education VARCHAR(50),
  graduate_school VARCHAR(200),
  major VARCHAR(100),
  graduation_date DATE,
  work_unit VARCHAR(200),
  work_years INTEGER DEFAULT 0,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  exam_city VARCHAR(100),
  exam_district VARCHAR(100),
  exam_center VARCHAR(200),
  application_fee_paid INTEGER DEFAULT 0,
  exam_fee_paid INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(exam_id, user_id)
);

CREATE TABLE IF NOT EXISTS admission_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_registration_id INTEGER UNIQUE NOT NULL,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  exam_room VARCHAR(50),
  seat_number VARCHAR(20),
  exam_center_address VARCHAR(255),
  qr_code_data TEXT,
  printed_count INTEGER DEFAULT 0,
  last_printed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_registration_id) REFERENCES exam_registrations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_registration_id INTEGER UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  exam_id INTEGER NOT NULL,
  total_score INTEGER,
  written_score INTEGER,
  interview_score INTEGER,
  practical_score INTEGER,
  is_pass INTEGER DEFAULT 0,
  rank INTEGER,
  publish_date DATETIME,
  certificate_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_registration_id) REFERENCES exam_registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (certificate_id) REFERENCES electronic_certificates(id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exam_id INTEGER,
  certificate_type VARCHAR(50),
  certificate_no VARCHAR(100) UNIQUE,
  issue_date DATE,
  valid_from DATE,
  valid_to DATE,
  status VARCHAR(20) DEFAULT 'valid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- 政策咨询
CREATE TABLE IF NOT EXISTS policy_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  parent_id INTEGER,
  level INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES policy_categories(id)
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_code VARCHAR(50) UNIQUE,
  title VARCHAR(200) NOT NULL,
  policy_type VARCHAR(50),
  category VARCHAR(50),
  category_id INTEGER,
  issuing_agency VARCHAR(200),
  issue_date DATE,
  effective_date DATE,
  expiry_date DATE,
  target_audience VARCHAR(200),
  region VARCHAR(100),
  applicable_region VARCHAR(100),
  summary TEXT,
  content TEXT,
  keywords TEXT,
  created_by INTEGER,
  is_active INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES policy_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS policy_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  node_type VARCHAR(50),
  node_title VARCHAR(200),
  node_content TEXT,
  parent_node_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_node_id) REFERENCES policy_nodes(id)
);

CREATE TABLE IF NOT EXISTS policy_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  related_policy_id INTEGER NOT NULL,
  relation_type VARCHAR(50),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  FOREIGN KEY (related_policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  UNIQUE(policy_id, related_policy_id)
);

CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category VARCHAR(50),
  category_id INTEGER,
  policy_id INTEGER,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT,
  target_audience VARCHAR(200),
  applicable_region VARCHAR(100),
  auto_attribution_tags TEXT,
  source_policy_id INTEGER,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES policy_categories(id),
  FOREIGN KEY (policy_id) REFERENCES policies(id),
  FOREIGN KEY (source_policy_id) REFERENCES policies(id)
);

CREATE TABLE IF NOT EXISTS consultation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  consultation_type VARCHAR(50),
  subject VARCHAR(200),
  content TEXT,
  related_policy_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to_id INTEGER,
  response TEXT,
  response_time DATETIME,
  satisfaction_rating INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_policy_id) REFERENCES policies(id),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS consulting_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_type VARCHAR(20),
  session_type VARCHAR(20) DEFAULT 'text',
  question TEXT,
  question_voice_url VARCHAR(255),
  question_voice_duration INTEGER,
  initial_intent VARCHAR(100),
  confidence_score DECIMAL(5,4),
  matched_policy_id INTEGER,
  matched_faq_id INTEGER,
  auto_answer TEXT,
  is_manual_transfer INTEGER DEFAULT 0,
  transfer_reason TEXT,
  operator_id INTEGER,
  satisfaction_rating INTEGER,
  satisfaction_comment TEXT,
  status VARCHAR(20) DEFAULT 'active',
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  messages_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (operator_id) REFERENCES users(id),
  FOREIGN KEY (matched_policy_id) REFERENCES policies(id),
  FOREIGN KEY (matched_faq_id) REFERENCES faqs(id)
);

CREATE TABLE IF NOT EXISTS knowledge_graph (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type VARCHAR(50) NOT NULL,
  entity_name VARCHAR(200) NOT NULL,
  entity_value TEXT,
  relation_type VARCHAR(50),
  target_entity_type VARCHAR(50),
  target_entity_name VARCHAR(200),
  weight DECIMAL(5,4) DEFAULT 1.0,
  source VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 工作流
CREATE TABLE IF NOT EXISTS business_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_code VARCHAR(50) UNIQUE NOT NULL,
  workflow_name VARCHAR(200) NOT NULL,
  service_id INTEGER,
  description TEXT,
  total_steps INTEGER DEFAULT 1,
  step_definitions TEXT,
  timeout_days INTEGER DEFAULT 15,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES service_catalog(id)
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  service_id INTEGER,
  business_id INTEGER NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  applicant_id INTEGER NOT NULL,
  applicant_type VARCHAR(20) NOT NULL,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'in_progress',
  priority VARCHAR(20) DEFAULT 'normal',
  data TEXT,
  sla_deadline DATETIME,
  last_activity_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES business_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES service_catalog(id),
  FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  step_number INTEGER NOT NULL,
  node_name VARCHAR(100),
  node_type VARCHAR(50),
  role_required VARCHAR(50),
  timeout_hours INTEGER,
  conditions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES business_workflows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_instance_id INTEGER NOT NULL,
  step_number INTEGER,
  action VARCHAR(50) NOT NULL,
  operator_id INTEGER,
  operator_role VARCHAR(50),
  comment TEXT,
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workflow_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_instance_id INTEGER NOT NULL,
  step_number INTEGER NOT NULL,
  assignee_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status VARCHAR(20) DEFAULT 'assigned',
  FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- 服务目录
CREATE TABLE IF NOT EXISTS service_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_code VARCHAR(50) UNIQUE,
  service_name VARCHAR(200) NOT NULL,
  service_type VARCHAR(50),
  category VARCHAR(50),
  target_audience VARCHAR(200),
  description TEXT,
  handling_materials TEXT,
  processing_flow TEXT,
  processing_deadline INTEGER,
  fee_description TEXT,
  applicable_region VARCHAR(100),
  is_online INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_application_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  form_code VARCHAR(50) UNIQUE,
  form_name VARCHAR(200),
  form_schema TEXT,
  version INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE CASCADE
);

-- 运营管理
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_instance_id INTEGER,
  service_id INTEGER,
  user_id INTEGER NOT NULL,
  overall_rating INTEGER NOT NULL,
  speed_rating INTEGER,
  attitude_rating INTEGER,
  professionalism_rating INTEGER,
  convenience_rating INTEGER,
  comment TEXT,
  suggestions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  FOREIGN KEY (service_id) REFERENCES service_catalog(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_date DATE NOT NULL,
  service_id INTEGER,
  agency_id INTEGER,
  total_requests INTEGER DEFAULT 0,
  completed_requests INTEGER DEFAULT 0,
  pending_requests INTEGER DEFAULT 0,
  overdue_requests INTEGER DEFAULT 0,
  on_time_completion_rate DECIMAL(5,4),
  average_processing_time DECIMAL(10,2),
  average_satisfaction DECIMAL(3,2),
  total_surveys INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_date, service_id, agency_id),
  FOREIGN KEY (service_id) REFERENCES service_catalog(id),
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE TABLE IF NOT EXISTS service_gap_heatmap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_period VARCHAR(20) NOT NULL,
  region_code VARCHAR(50),
  region_name VARCHAR(100),
  service_id INTEGER,
  gap_count INTEGER DEFAULT 0,
  gap_severity DECIMAL(5,4) DEFAULT 0,
  avg_wait_time DECIMAL(10,2),
  rejection_rate DECIMAL(5,4),
  data_source VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES service_catalog(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type VARCHAR(20) DEFAULT 'system',
  title VARCHAR(200) NOT NULL,
  content TEXT,
  related_module VARCHAR(50),
  related_id INTEGER,
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_type VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_data TEXT,
  response_data TEXT,
  status VARCHAR(20),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

  sql += buildSeedData();
  
  return sql;
}

function buildSeedData() {
  let sql = '';
  
  sql += `
-- 角色数据
INSERT OR IGNORE INTO roles (code, name, description) VALUES
('personal_user', '个人用户', '普通个人参保用户'),
('enterprise_hr', '企业HR', '企业人力资源管理人员'),
('agency_staff', '经办人员', '基层社保经办机构工作人员'),
('agency_admin', '经办管理员', '经办机构管理员'),
('system_admin', '系统管理员', '系统超级管理员');

-- 权限数据
INSERT OR IGNORE INTO permissions (code, name, module) VALUES
('personal.insurance.view', '查看社保信息', 'insurance'),
('personal.insurance.register', '参保登记', 'insurance'),
('personal.insurance.transfer', '社保转移', 'insurance'),
('personal.benefit.certify', '待遇资格认证', 'insurance'),
('personal.certificate.apply', '申请电子凭证', 'insurance'),
('personal.base.declare', '基数申报', 'insurance'),
('enterprise.base.declare', '企业基数申报', 'insurance'),
('enterprise.job.publish', '发布岗位', 'employment'),
('enterprise.application.manage', '管理申请', 'employment'),
('personal.job.search', '搜索岗位', 'employment'),
('personal.resume.manage', '管理简历', 'employment'),
('personal.training.enroll', '培训报名', 'employment'),
('personal.exam.register', '考试报名', 'exam'),
('personal.exam.ticket', '准考证', 'exam'),
('personal.exam.result', '成绩查询', 'exam'),
('personal.certificate.verify', '证书核验', 'exam'),
('policy.view', '查看政策', 'policy'),
('policy.consult', '政策咨询', 'policy'),
('agency.workflow.review', '审核工作流', 'workflow'),
('agency.statistics.view', '查看统计', 'analytics'),
('system.user.manage', '用户管理', 'system'),
('system.role.manage', '角色管理', 'system');

-- 角色权限关联
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'personal_user' AND p.code IN (
  'personal.insurance.view', 'personal.insurance.register', 'personal.insurance.transfer',
  'personal.benefit.certify', 'personal.certificate.apply', 'personal.job.search',
  'personal.resume.manage', 'personal.training.enroll', 'personal.exam.register',
  'personal.exam.ticket', 'personal.exam.result', 'personal.certificate.verify',
  'policy.view', 'policy.consult'
);

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'enterprise_hr' AND p.code IN (
  'personal.insurance.view', 'enterprise.base.declare', 'enterprise.job.publish',
  'enterprise.application.manage', 'policy.view'
);

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'agency_staff' AND p.code IN (
  'personal.insurance.view', 'agency.workflow.review', 'agency.statistics.view',
  'policy.view', 'policy.consult'
);

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'agency_admin' AND p.code IN (
  'personal.insurance.view', 'agency.workflow.review', 'agency.statistics.view',
  'policy.view', 'policy.consult'
);

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'system_admin';

-- 测试用户
INSERT OR IGNORE INTO users (username, password_hash, real_name, user_type, phone, email, id_card, region, status) VALUES
('zhangsan', '${crypto.createHash('sha256').update('123456' + 'may-89086-salt').digest('hex')}', '张三', 'personal', '13800138001', 'zhangsan@example.com', '110101199001011234', '北京市', 'active'),
('lisi', '${crypto.createHash('sha256').update('123456' + 'may-89086-salt').digest('hex')}', '李四', 'personal', '13800138002', 'lisi@example.com', '110101199202022345', '北京市朝阳区', 'active'),
('wangwu', '${crypto.createHash('sha256').update('123456' + 'may-89086-salt').digest('hex')}', '王五', 'personal', '13800138003', 'wangwu@example.com', '110101196003033456', '北京市海淀区', 'active'),
('zhaoliu', '${crypto.createHash('sha256').update('123456' + 'may-89086-salt').digest('hex')}', '赵六', 'enterprise', '13800138004', 'zhaoliu@example.com', '110101198804044567', '北京市', 'active'),
('qianqi', '${crypto.createHash('sha256').update('123456' + 'may-89086-salt').digest('hex')}', '钱七', 'agency', '13800138005', 'qianqi@example.com', '110101198505055678', '北京市西城区', 'active'),
('admin', '${crypto.createHash('sha256').update('123456' + 'may-89086-salt').digest('hex')}', '系统管理员', 'agency', '13800138000', 'admin@example.com', '110101198001010001', '北京市', 'active');

-- 用户角色关联
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'zhangsan' AND r.code = 'personal_user';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'lisi' AND r.code = 'personal_user';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'wangwu' AND r.code = 'personal_user';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'zhaoliu' AND r.code = 'enterprise_hr';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'qianqi' AND r.code = 'agency_staff';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'system_admin';

-- 个人用户资料
INSERT OR IGNORE INTO personal_profiles (user_id, gender, birth_date, education, employment_status, household_address, residential_address)
SELECT id, '男', '1990-01-01', '本科', 'employed', '北京市东城区', '北京市朝阳区' FROM users WHERE username = 'zhangsan';

INSERT OR IGNORE INTO personal_profiles (user_id, gender, birth_date, education, employment_status, household_address, residential_address)
SELECT id, '女', '1992-02-02', '硕士', 'employed', '北京市西城区', '北京市朝阳区' FROM users WHERE username = 'lisi';

INSERT OR IGNORE INTO personal_profiles (user_id, gender, birth_date, education, employment_status, household_address, residential_address)
SELECT id, '男', '1960-03-03', '高中', 'retired', '北京市海淀区', '北京市海淀区' FROM users WHERE username = 'wangwu';

-- 企业信息
INSERT OR IGNORE INTO enterprises (user_id, enterprise_name, unified_credit_code, industry, enterprise_type, registration_date, registered_capital, legal_representative, contact_name, contact_phone, address, region, status)
SELECT id, '北京科技创新有限公司', '91110000MA008ABCDE', '互联网', 'limited', '2018-01-01', 10000000, '赵六', '赵六', '13800138004', '北京市海淀区中关村大街1号', '北京市海淀区', 'normal'
FROM users WHERE username = 'zhaoliu';

-- 机构信息
INSERT OR IGNORE INTO agencies (user_id, agency_name, agency_code, agency_level, region, address, contact_name, contact_phone, jurisdiction)
SELECT id, '北京市西城区社会保险基金管理中心', 'BJ-XC-001', 'district', '北京市西城区', '北京市西城区西直门南小街20号', '钱七', '13800138005', '负责西城区社会保险经办业务'
FROM users WHERE username = 'qianqi';

INSERT OR IGNORE INTO agencies (user_id, agency_name, agency_code, agency_level, region, address, contact_name, contact_phone, jurisdiction)
SELECT id, '北京市社会保险基金管理中心', 'BJ-001', 'municipal', '北京市', '北京市西城区永定门西街5号', '系统管理员', '13800138000', '负责全市社会保险经办管理'
FROM users WHERE username = 'admin';

-- 社保类型
INSERT OR IGNORE INTO insurance_types (code, name, description, personal_rate, unit_rate) VALUES
('pension', '养老保险', '基本养老保险', 0.08, 0.16),
('medical', '医疗保险', '基本医疗保险', 0.02, 0.095),
('unemployment', '失业保险', '失业保险', 0.005, 0.005),
('injury', '工伤保险', '工伤保险', 0, 0.004),
('maternity', '生育保险', '生育保险', 0, 0.008);

-- 社保账户
INSERT OR IGNORE INTO social_insurance_accounts (user_id, insurance_type_id, account_no, personal_balance, unit_balance, accumulated_months, status)
SELECT u.id, it.id, 'YL' || u.id || '0001', 24000, 48000, 60, 'normal' FROM users u, insurance_types it WHERE u.username = 'zhangsan' AND it.code = 'pension';

INSERT OR IGNORE INTO social_insurance_accounts (user_id, insurance_type_id, account_no, personal_balance, unit_balance, accumulated_months, status)
SELECT u.id, it.id, 'YL' || u.id || '0001', 36000, 72000, 120, 'normal' FROM users u, insurance_types it WHERE u.username = 'lisi' AND it.code = 'pension';

INSERT OR IGNORE INTO social_insurance_accounts (user_id, insurance_type_id, account_no, personal_balance, unit_balance, accumulated_months, status)
SELECT u.id, it.id, 'YL' || u.id || '0001', 96000, 192000, 420, 'retired' FROM users u, insurance_types it WHERE u.username = 'wangwu' AND it.code = 'pension';

INSERT OR IGNORE INTO social_insurance_accounts (user_id, insurance_type_id, account_no, personal_balance, unit_balance, accumulated_months, status)
SELECT u.id, it.id, 'YI' || u.id || '0001', 6000, 28500, 60, 'normal' FROM users u, insurance_types it WHERE u.username = 'zhangsan' AND it.code = 'medical';

INSERT OR IGNORE INTO social_insurance_accounts (user_id, insurance_type_id, account_no, personal_balance, unit_balance, accumulated_months, status)
SELECT u.id, it.id, 'YI' || u.id || '0001', 9000, 42750, 120, 'normal' FROM users u, insurance_types it WHERE u.username = 'lisi' AND it.code = 'medical';

-- 缴费记录
INSERT OR IGNORE INTO payment_records (insurance_account_id, user_id, payment_year, payment_month, payment_base, personal_payment, unit_payment, payment_status)
SELECT ia.id, u.id, 2025, 1, 10000, 800, 1600, 'paid' FROM users u, social_insurance_accounts ia, insurance_types it WHERE u.username = 'zhangsan' AND ia.user_id = u.id AND it.code = 'pension' AND ia.insurance_type_id = it.id;

INSERT OR IGNORE INTO payment_records (insurance_account_id, user_id, payment_year, payment_month, payment_base, personal_payment, unit_payment, payment_status)
SELECT ia.id, u.id, 2025, 2, 10000, 800, 1600, 'paid' FROM users u, social_insurance_accounts ia, insurance_types it WHERE u.username = 'zhangsan' AND ia.user_id = u.id AND it.code = 'pension' AND ia.insurance_type_id = it.id;

INSERT OR IGNORE INTO payment_records (insurance_account_id, user_id, payment_year, payment_month, payment_base, personal_payment, unit_payment, payment_status)
SELECT ia.id, u.id, 2025, 3, 10000, 800, 1600, 'paid' FROM users u, social_insurance_accounts ia, insurance_types it WHERE u.username = 'zhangsan' AND ia.user_id = u.id AND it.code = 'pension' AND ia.insurance_type_id = it.id;

INSERT OR IGNORE INTO payment_records (insurance_account_id, user_id, payment_year, payment_month, payment_base, personal_payment, unit_payment, payment_status)
SELECT ia.id, u.id, 2025, 4, 10000, 800, 1600, 'paid' FROM users u, social_insurance_accounts ia, insurance_types it WHERE u.username = 'zhangsan' AND ia.user_id = u.id AND it.code = 'pension' AND ia.insurance_type_id = it.id;

INSERT OR IGNORE INTO payment_records (insurance_account_id, user_id, payment_year, payment_month, payment_base, personal_payment, unit_payment, payment_status)
SELECT ia.id, u.id, 2025, 5, 10000, 800, 1600, 'paid' FROM users u, social_insurance_accounts ia, insurance_types it WHERE u.username = 'zhangsan' AND ia.user_id = u.id AND it.code = 'pension' AND ia.insurance_type_id = it.id;

-- 服务目录
INSERT OR IGNORE INTO service_catalog (service_code, service_name, service_type, category, target_audience, description, processing_deadline, is_online, is_active, sort_order) VALUES
('SI001', '参保登记', 'insurance', '社保登记', '个人、企业', '办理社会保险参保登记业务', 5, 1, 1, 1),
('SI002', '社保转移', 'insurance', '社保关系', '个人', '办理社会保险关系转移接续', 45, 1, 1, 2),
('SI003', '待遇资格认证', 'insurance', '待遇认证', '个人', '社会保险待遇领取资格认证', 1, 1, 1, 3),
('SI004', '缴费基数申报', 'insurance', '缴费申报', '企业', '企业职工社会保险缴费基数申报', 3, 1, 1, 4),
('SI005', '电子凭证签发', 'insurance', '电子证照', '个人', '签发社会保险电子凭证', 1, 1, 1, 5),
('ES001', '岗位发布', 'employment', '就业服务', '企业', '发布招聘岗位信息', 1, 1, 1, 6),
('ES002', '简历投递', 'employment', '就业服务', '个人', '投递简历申请岗位', 1, 1, 1, 7),
('ES003', '招聘会预约', 'employment', '就业服务', '个人、企业', '预约参加招聘会', 1, 1, 1, 8),
('ES004', '职业技能培训报名', 'employment', '职业培训', '个人', '报名参加职业技能培训课程', 3, 1, 1, 9),
('ES005', '培训补贴申领', 'employment', '职业培训', '个人', '申领职业技能培训补贴', 15, 1, 1, 10),
('EX001', '考试报名', 'exam', '考试服务', '个人', '人事考试在线报名', 1, 1, 1, 11),
('EX002', '准考证打印', 'exam', '考试服务', '个人', '打印考试准考证', 1, 1, 1, 12),
('EX003', '成绩查询', 'exam', '考试服务', '个人', '查询考试成绩', 1, 1, 1, 13),
('EX004', '证书核验', 'exam', '考试服务', '个人、企业', '职业资格证书在线核验', 1, 1, 1, 14),
('PL001', '政策查询', 'policy', '政策咨询', '个人、企业', '政策法规查询服务', 1, 1, 1, 15),
('PL002', '智能咨询', 'policy', '政策咨询', '个人、企业', 'AI智能政策咨询服务', 1, 1, 1, 16),
('PL003', '人工咨询', 'policy', '政策咨询', '个人、企业', '人工政策咨询服务', 3, 1, 1, 17);

-- 工作流定义
INSERT OR IGNORE INTO business_workflows (workflow_code, workflow_name, service_id, description, total_steps, step_definitions, timeout_days, is_active)
SELECT 'WF_SI001', '参保登记工作流', id, '个人参保登记业务审批流程', 3,
'[{"step":1,"name":"提交申请","role":["personal","enterprise"],"description":"用户提交参保登记申请"},{"step":2,"name":"材料审核","role":["agency_staff","agency_admin"],"description":"经办人员审核申请材料"},{"step":3,"name":"登记完成","role":["system"],"description":"系统自动完成登记"}]',
15, 1 FROM service_catalog WHERE service_code = 'SI001';

INSERT OR IGNORE INTO business_workflows (workflow_code, workflow_name, service_id, description, total_steps, step_definitions, timeout_days, is_active)
SELECT 'WF_SI002', '社保转移工作流', id, '社会保险关系转移接续流程', 5,
'[{"step":1,"name":"提交申请","role":["personal"],"description":"提交社保转移申请"},{"step":2,"name":"转出地审核","role":["agency_staff"],"description":"转出地社保机构审核"},{"step":3,"name":"转出地基金划转","role":["agency_admin"],"description":"转出地划转基金"},{"step":4,"name":"转入地审核","role":["agency_staff"],"description":"转入地社保机构审核"},{"step":5,"name":"转移完成","role":["system"],"description":"系统完成转移接续"}]',
45, 1 FROM service_catalog WHERE service_code = 'SI002';

INSERT OR IGNORE INTO business_workflows (workflow_code, workflow_name, service_id, description, total_steps, step_definitions, timeout_days, is_active)
SELECT 'WF_ES004', '培训补贴申领工作流', id, '职业技能培训补贴申领流程', 3,
'[{"step":1,"name":"培训报名","role":["personal"],"description":"报名参加培训课程"},{"step":2,"name":"培训结业","role":["agency_staff"],"description":"确认培训结业并考核合格"},{"step":3,"name":"补贴发放","role":["agency_admin"],"description":"发放培训补贴"}]',
30, 1 FROM service_catalog WHERE service_code = 'ES005';

-- 测试岗位
INSERT OR IGNORE INTO jobs (enterprise_id, title, job_type, industry, work_location, salary_min, salary_max, salary_type, education_requirement, experience_requirement, job_description, job_requirements, benefits, contact_name, contact_phone, status, publish_date, view_count, apply_count, match_score)
SELECT e.id, '高级前端开发工程师', 'full_time', '互联网', '北京市海淀区', 25000, 40000, 'monthly', '本科', '3-5年', '负责公司核心产品的前端开发工作', '精通React/Vue，有大型项目经验', '五险一金,年终奖,带薪年假,免费午餐', '赵六', '13800138004', 'published', CURRENT_TIMESTAMP, 156, 23, 85
FROM enterprises e WHERE e.enterprise_name = '北京科技创新有限公司';

INSERT OR IGNORE INTO jobs (enterprise_id, title, job_type, industry, work_location, salary_min, salary_max, salary_type, education_requirement, experience_requirement, job_description, job_requirements, benefits, contact_name, contact_phone, status, publish_date, view_count, apply_count, match_score)
SELECT e.id, 'Java后端开发工程师', 'full_time', '互联网', '北京市朝阳区', 20000, 35000, 'monthly', '本科', '1-3年', '负责公司后端服务开发和维护', '熟练掌握Java，Spring Boot，MySQL', '五险一金,年终奖,带薪年假', '赵六', '13800138004', 'published', CURRENT_TIMESTAMP, 128, 18, 78
FROM enterprises e WHERE e.enterprise_name = '北京科技创新有限公司';

INSERT OR IGNORE INTO jobs (enterprise_id, title, job_type, industry, work_location, salary_min, salary_max, salary_type, education_requirement, experience_requirement, job_description, job_requirements, benefits, contact_name, contact_phone, status, publish_date, view_count, apply_count, match_score)
SELECT e.id, '产品经理', 'full_time', '互联网', '北京市海淀区', 25000, 45000, 'monthly', '本科', '3-5年', '负责产品规划和需求分析', '有B端产品经验，熟悉社保行业优先', '五险一金,年终奖,股票期权', '赵六', '13800138004', 'published', CURRENT_TIMESTAMP, 89, 12, 82
FROM enterprises e WHERE e.enterprise_name = '北京科技创新有限公司';

-- 测试简历
INSERT OR IGNORE INTO resumes (user_id, resume_title, expected_salary_min, expected_salary_max, expected_work_location, expected_job_type, self_introduction, skills, work_experience_years)
SELECT id, '高级前端开发工程师求职', 25000, 35000, '北京市', 'full_time', '5年前端开发经验，精通React生态，有大型互联网项目经验', 'React,Vue,TypeScript,Node.js', 5
FROM users WHERE username = 'zhangsan';

INSERT OR IGNORE INTO resumes (user_id, resume_title, expected_salary_min, expected_salary_max, expected_work_location, expected_job_type, self_introduction, skills, work_experience_years)
SELECT id, 'Java开发工程师求职', 20000, 30000, '北京市朝阳区', 'full_time', '3年Java开发经验，熟悉Spring Boot微服务架构', 'Java,Spring Boot,MySQL,Redis', 3
FROM users WHERE username = 'lisi';

-- 工作经历
INSERT OR IGNORE INTO work_experiences (resume_id, company_name, position, start_date, end_date, is_current, salary, work_description)
SELECT r.id, '某互联网公司', '前端开发工程师', '2020-06-01', '2023-05-31', 0, 20000, '负责电商平台前端开发'
FROM resumes r, users u WHERE r.user_id = u.id AND u.username = 'zhangsan';

INSERT OR IGNORE INTO work_experiences (resume_id, company_name, position, start_date, end_date, is_current, salary, work_description)
SELECT r.id, '某科技公司', '高级前端开发工程师', '2023-06-01', NULL, 1, 28000, '负责SaaS产品前端架构设计和开发'
FROM resumes r, users u WHERE r.user_id = u.id AND u.username = 'zhangsan';

INSERT OR IGNORE INTO work_experiences (resume_id, company_name, position, start_date, end_date, is_current, salary, work_description)
SELECT r.id, '某软件公司', 'Java开发工程师', '2022-07-01', NULL, 1, 18000, '负责企业级应用后端开发'
FROM resumes r, users u WHERE r.user_id = u.id AND u.username = 'lisi';

-- 教育经历
INSERT OR IGNORE INTO education_experiences (resume_id, school_name, degree, major, start_date, end_date, gpa, description)
SELECT r.id, '北京大学', '本科', '计算机科学与技术', '2016-09-01', '2020-06-30', 3.8, '获得优秀毕业生称号'
FROM resumes r, users u WHERE r.user_id = u.id AND u.username = 'zhangsan';

INSERT OR IGNORE INTO education_experiences (resume_id, school_name, degree, major, start_date, end_date, gpa, description)
SELECT r.id, '清华大学', '硕士', '软件工程', '2020-09-01', '2022-06-30', 3.9, '获得国家奖学金'
FROM resumes r, users u WHERE r.user_id = u.id AND u.username = 'lisi';

-- 测试考试
INSERT OR IGNORE INTO exams (exam_name, exam_code, exam_type, organizer, description, exam_date, exam_time, registration_start_date, registration_end_date, application_fee, exam_fee, status, certificate_validity_period, passing_score) VALUES
('2026年北京市二级建造师执业资格考试', 'JZS2026BJ', 'professional_qualification', '北京市人事考试中心', '二级建造师执业资格考试', '2026-06-15', '09:00-12:00', '2026-03-01', '2026-03-31', 50, 150, 'registration_open', 3, 60),
('2026年北京市中级经济师考试', 'JJS2026BJ', 'professional_qualification', '北京市人事考试中心', '经济专业技术资格考试（中级）', '2026-11-01', '09:00-11:30', '2026-07-15', '2026-08-15', 60, 120, 'registration_not_started', 5, 84),
('2026年上半年计算机技术与软件专业技术资格考试', 'RJKS2026BJ', 'professional_qualification', '北京市人事考试中心', '软件设计师中级资格考试', '2026-05-25', '09:00-11:30', '2026-03-10', '2026-04-10', 70, 130, 'exam_pending', 3, 45);

-- 考试公告
INSERT OR IGNORE INTO exam_announcements (exam_id, title, content, announcement_type, publish_date)
SELECT e.id, '关于2026年度二级建造师执业资格考试有关问题的通知', '为做好2026年度二级建造师执业资格考试工作，现将有关事项通知如下...', 'official', CURRENT_TIMESTAMP
FROM exams e WHERE e.exam_code = 'JZS2026BJ';

INSERT OR IGNORE INTO exam_announcements (exam_id, title, content, announcement_type, publish_date)
SELECT e.id, '二级建造师考试报名流程指南', '一、网上报名；二、资格审核；三、网上缴费...', 'guide', CURRENT_TIMESTAMP
FROM exams e WHERE e.exam_code = 'JZS2026BJ';

-- 政策分类
INSERT OR IGNORE INTO policy_categories (name, code, parent_id, level, sort_order, description) VALUES
('社会保险', 'insurance', NULL, 1, 1, '社会保险相关政策'),
('就业服务', 'employment', NULL, 1, 2, '就业服务相关政策'),
('人事考试', 'exam', NULL, 1, 3, '人事考试相关政策'),
('政策法规', 'policy', NULL, 1, 4, '综合政策法规');

-- 测试政策
INSERT OR IGNORE INTO policies (policy_code, title, policy_type, category, category_id, issuing_agency, issue_date, effective_date, target_audience, region, applicable_region, summary, content, keywords, is_active, view_count) VALUES
('BJ-SI-2024-001', '关于统一2024年度各项社会保险缴费工资基数上下限的通知', 'regulatory', 'insurance', 1, '北京市人力资源和社会保障局', '2024-06-01', '2024-07-01', '参保单位和参保人员', '北京市', '北京市', '2024年度职工基本养老保险、失业保险、工伤保险、职工基本医疗保险（含生育保险）缴费工资基数上下限标准', '为完善社会保险制度，保障参保人员权益...', '社保缴费,基数上下限,2024', 1, 15680),
('BJ-ES-2024-002', '关于印发北京市职业技能培训补贴实施细则的通知', 'support', 'employment', 2, '北京市人力资源和社会保障局', '2024-03-15', '2024-04-01', '企业职工、失业人员、农村转移就业劳动者', '北京市', '北京市', '明确职业技能培训补贴的范围、标准和申领流程', '为进一步促进就业创业，提升劳动者职业技能...', '职业培训,技能提升,培训补贴', 1, 8920),
('BJ-SI-2023-015', '关于优化社会保险关系转移接续经办服务的通知', 'service', 'insurance', 1, '北京市社会保险基金管理中心', '2023-11-01', '2023-12-01', '跨地区流动就业参保人员', '北京市', '北京市', '简化社保转移接续流程，压缩办理时限，提升服务质量', '为深入贯彻落实党中央、国务院关于深化"放管服"改革...', '社保转移,关系转移,跨省转移', 1, 23450);

-- 测试FAQ
INSERT OR IGNORE INTO faqs (category, category_id, policy_id, question, answer, keywords, view_count, helpful_count, is_active) VALUES
('insurance', 1, 1, '社保缴费基数是如何确定的？', '社保缴费基数按照职工上一年度月平均工资确定。新参加工作的职工从参加工作的第二个月开始缴费，缴费基数按本人当月的工资收入确定。', '缴费基数,工资,社保缴费', 5680, 420, 1),
('insurance', 1, 1, '养老保险要交多少年才能领取养老金？', '参加基本养老保险的个人，达到法定退休年龄时累计缴费满十五年的，按月领取基本养老金。累计缴费不足十五年的，可以缴费至满十五年，按月领取基本养老金。', '养老保险,缴费年限,养老金,退休', 12340, 890, 1),
('employment', 2, 2, '如何申请职业技能培训补贴？', '符合条件的劳动者可登录北京市人力资源和社会保障局官网，进入"职业技能培训补贴申领"模块，填写个人信息并上传相关材料，经审核通过后发放补贴。', '培训补贴,技能培训,申请流程', 7890, 560, 1),
('insurance', 1, 3, '社保转移需要多长时间？', '按照国家规定，社保转移接续的办理时限为45个工作日。北京市已优化经办流程，实际办理时间通常在15-30个工作日。', '社保转移,办理时限,跨省转移', 4560, 320, 1),
('exam', 3, NULL, '二级建造师考试报名需要什么条件？', '凡遵纪守法，具备工程类或工程经济类中等专科以上学历并从事建设工程项目施工管理工作满2年的人员，可报名参加二级建造师执业资格考试。', '二级建造师,报名条件,执业资格考试', 9870, 720, 1);

-- 测试招聘会
INSERT OR IGNORE INTO job_fairs (title, organizer, fair_type, start_time, end_time, location, online_url, description, max_enterprises, max_attendees, status) VALUES
('2026年北京市夏季人才招聘会', '北京市人力资源和社会保障局', 'comprehensive', '2026-07-15 09:00:00', '2026-07-15 17:00:00', '北京市朝阳区全国农业展览馆', 'https://jobfair.example.com/2026summer', '综合性人才招聘会，涵盖互联网、金融、制造业等多个行业', 200, 5000, 'upcoming'),
('2026届高校毕业生就业服务周', '北京市教育委员会', 'graduate', '2026-06-20 09:00:00', '2026-06-26 18:00:00', '线上专场', 'https://jobfair.example.com/graduate2026', '专门面向2026届高校毕业生的线上招聘活动', 150, 10000, 'registration_open'),
('数字经济专场招聘会', '中关村科技园管理委员会', 'industry', '2026-08-05 10:00:00', '2026-08-05 16:00:00', '北京市海淀区中关村创新中心', 'https://jobfair.example.com/digital2026', '聚焦数字经济领域的专场招聘会', 80, 2000, 'upcoming');

-- 测试培训课程
INSERT OR IGNORE INTO training_courses (course_name, course_code, category, level, description, total_hours, total_credits, fee, subsidy_amount, instructor, start_date, end_date, max_students, enrolled_count, status) VALUES
('Python程序设计入门', 'PY202601', 'programming', 'beginner', '从零开始学习Python编程语言，掌握基础语法和常用库的使用', 40, 4, 1200, 800, '张教授', '2026-07-01', '2026-07-15', 50, 23, 'open'),
('企业人力资源管理师（三级）', 'HR202601', 'management', 'intermediate', '系统学习人力资源管理六大模块，为考取职业资格证书做准备', 60, 6, 2800, 2000, '李老师', '2026-07-10', '2026-08-20', 40, 18, 'open'),
('大数据分析师认证培训', 'BD202601', 'data', 'advanced', '深入学习大数据分析技术，包括Hadoop、Spark、数据可视化等内容', 80, 8, 4500, 3000, '王博士', '2026-08-01', '2026-09-30', 30, 12, 'open'),
('电商运营实战', 'EC202601', 'business', 'beginner', '学习电商平台运营、商品管理、营销推广、数据分析等实战技能', 30, 3, 980, 500, '赵老师', '2026-07-20', '2026-08-10', 60, 35, 'open');

-- 测试满意度调查数据
INSERT OR IGNORE INTO satisfaction_surveys (service_id, user_id, overall_rating, speed_rating, attitude_rating, professionalism_rating, convenience_rating, comment)
SELECT sc.id, u.id, 5, 5, 5, 4, 5, '服务态度很好，办理速度也很快'
FROM service_catalog sc, users u WHERE sc.service_code = 'SI003' AND u.username = 'zhangsan';

INSERT OR IGNORE INTO satisfaction_surveys (service_id, user_id, overall_rating, speed_rating, attitude_rating, professionalism_rating, convenience_rating, comment)
SELECT sc.id, u.id, 4, 3, 5, 4, 5, '整体满意，就是希望能加快审核速度'
FROM service_catalog sc, users u WHERE sc.service_code = 'SI001' AND u.username = 'lisi';

INSERT OR IGNORE INTO satisfaction_surveys (service_id, user_id, overall_rating, speed_rating, attitude_rating, professionalism_rating, convenience_rating, comment)
SELECT sc.id, u.id, 5, 5, 5, 5, 5, '非常满意，全程网上办理，不用跑大厅了'
FROM service_catalog sc, users u WHERE sc.service_code = 'ES004' AND u.username = 'zhangsan';

-- 测试绩效数据
INSERT OR IGNORE INTO performance_metrics (metric_date, service_id, agency_id, total_requests, completed_requests, pending_requests, overdue_requests, on_time_completion_rate, average_processing_time, average_satisfaction, total_surveys)
SELECT '2026-06-01', sc.id, a.id, 156, 148, 8, 2, 0.9654, 2.5, 4.75, 36
FROM service_catalog sc, agencies a WHERE sc.service_code = 'SI001' AND a.agency_code = 'BJ-XC-001';

INSERT OR IGNORE INTO performance_metrics (metric_date, service_id, agency_id, total_requests, completed_requests, pending_requests, overdue_requests, on_time_completion_rate, average_processing_time, average_satisfaction, total_surveys)
SELECT '2026-06-01', sc.id, a.id, 89, 85, 4, 1, 0.9775, 1.2, 4.82, 28
FROM service_catalog sc, agencies a WHERE sc.service_code = 'SI003' AND a.agency_code = 'BJ-XC-001';

INSERT OR IGNORE INTO performance_metrics (metric_date, service_id, agency_id, total_requests, completed_requests, pending_requests, overdue_requests, on_time_completion_rate, average_processing_time, average_satisfaction, total_surveys)
SELECT '2026-06-01', sc.id, a.id, 234, 225, 9, 3, 0.9558, 3.8, 4.68, 45
FROM service_catalog sc, agencies a WHERE sc.service_code = 'SI002' AND a.agency_code = 'BJ-XC-001';

-- 测试服务缺口热力图数据
INSERT OR IGNORE INTO service_gap_heatmap (time_period, region_code, region_name, service_id, gap_count, gap_severity, avg_wait_time, rejection_rate, data_source)
SELECT '2026-Q2', '110105', '朝阳区', sc.id, 156, 0.78, 8.5, 0.125, 'system'
FROM service_catalog sc WHERE sc.service_code = 'SI001';

INSERT OR IGNORE INTO service_gap_heatmap (time_period, region_code, region_name, service_id, gap_count, gap_severity, avg_wait_time, rejection_rate, data_source)
SELECT '2026-Q2', '110106', '丰台区', sc.id, 98, 0.56, 5.2, 0.089, 'system'
FROM service_catalog sc WHERE sc.service_code = 'SI001';

INSERT OR IGNORE INTO service_gap_heatmap (time_period, region_code, region_name, service_id, gap_count, gap_severity, avg_wait_time, rejection_rate, data_source)
SELECT '2026-Q2', '110108', '海淀区', sc.id, 234, 0.85, 12.3, 0.156, 'system'
FROM service_catalog sc WHERE sc.service_code = 'SI002';

INSERT OR IGNORE INTO service_gap_heatmap (time_period, region_code, region_name, service_id, gap_count, gap_severity, avg_wait_time, rejection_rate, data_source)
SELECT '2026-Q2', '110115', '大兴区', sc.id, 67, 0.42, 3.5, 0.065, 'system'
FROM service_catalog sc WHERE sc.service_code = 'ES004';

-- 测试通知
INSERT OR IGNORE INTO notifications (user_id, type, title, content, related_module, related_id)
SELECT u.id, 'business', '养老保险待遇资格认证提醒', '您好，您的养老保险待遇资格认证即将到期，请及时完成认证。', 'insurance', NULL
FROM users u WHERE u.username = 'wangwu';

INSERT OR IGNORE INTO notifications (user_id, type, title, content, related_module, related_id)
SELECT u.id, 'system', '系统维护通知', '为提供更好的服务，系统将于2026年6月15日22:00-24:00进行维护升级。', 'system', NULL
FROM users u WHERE u.username IN ('zhangsan', 'lisi', 'wangwu', 'zhaoliu', 'qianqi', 'admin');

INSERT OR IGNORE INTO notifications (user_id, type, title, content, related_module, related_id)
SELECT u.id, 'business', '您申请的岗位有新进展', '您申请的"高级前端开发工程师"岗位已进入面试环节。', 'employment', 1
FROM users u WHERE u.username = 'zhangsan';

-- 测试审计日志
INSERT OR IGNORE INTO audit_logs (user_id, user_type, action, module, ip_address, status)
SELECT u.id, u.user_type, 'login', 'auth', '192.168.1.100', 'success'
FROM users u WHERE u.username = 'zhangsan';

INSERT OR IGNORE INTO audit_logs (user_id, user_type, action, module, ip_address, status)
SELECT u.id, u.user_type, 'query_insurance_account', 'insurance', '192.168.1.100', 'success'
FROM users u WHERE u.username = 'zhangsan';

INSERT OR IGNORE INTO audit_logs (user_id, user_type, action, module, ip_address, status)
SELECT u.id, u.user_type, 'submit_insurance_transfer', 'insurance', '192.168.1.101', 'success'
FROM users u WHERE u.username = 'lisi';

INSERT OR IGNORE INTO audit_logs (user_id, user_type, action, module, ip_address, status)
SELECT u.id, u.user_type, 'publish_job', 'employment', '192.168.1.102', 'success'
FROM users u WHERE u.username = 'zhaoliu';

INSERT OR IGNORE INTO audit_logs (user_id, user_type, action, module, ip_address, status)
SELECT u.id, u.user_type, 'approve_workflow', 'workflow', '10.0.0.50', 'success'
FROM users u WHERE u.username = 'qianqi';

-- 测试知识库数据
INSERT OR IGNORE INTO knowledge_graph (entity_type, entity_name, relation_type, target_entity_type, target_entity_name, weight, source) VALUES
('policy', '养老保险', 'applies_to', 'person', '在职职工', 0.9, 'policy_import'),
('policy', '养老保险', 'applies_to', 'person', '灵活就业人员', 0.85, 'policy_import'),
('policy', '养老保险', 'has_condition', 'condition', '累计缴费满15年', 1.0, 'policy_import'),
('service', '参保登记', 'requires', 'material', '身份证', 1.0, 'service_manual'),
('service', '参保登记', 'requires', 'material', '户口本', 0.5, 'service_manual'),
('service', '社保转移', 'has_step', 'step', '提交申请', 1.0, 'service_manual'),
('service', '社保转移', 'has_step', 'step', '转出地审核', 1.0, 'service_manual'),
('service', '社保转移', 'has_step', 'step', '转入地审核', 1.0, 'service_manual');

`;

  sql += `
-- 模块导出
`;

  return sql;
}

initDatabase();

module.exports = {
  runSql,
  query,
  execute,
  getLastInsertId,
  initDatabase,
  escapeValue,
  replacePlaceholders
};