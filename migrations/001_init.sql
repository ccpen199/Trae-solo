CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  name VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  school_name VARCHAR(100),
  province VARCHAR(50),
  relationship VARCHAR(20),
  expert_certified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  province VARCHAR(50) NOT NULL,
  subjects TEXT NOT NULL,
  batch VARCHAR(50) NOT NULL,
  target_cities TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  holland_scores TEXT NOT NULL,
  mbti_type VARCHAR(10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS universities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  short_name VARCHAR(50),
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  level VARCHAR(50),
  type VARCHAR(50),
  subjects TEXT,
  master_points INTEGER DEFAULT 0,
  doctor_points INTEGER DEFAULT 0,
  employment_rate DECIMAL(5,2),
  logo_url VARCHAR(255),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS majors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(50),
  subject_requirements TEXT,
  employment_rate DECIMAL(5,2),
  avg_salary INTEGER,
  courses TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admission_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  university_id INTEGER NOT NULL,
  major_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  province VARCHAR(50) NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER,
  avg_score INTEGER,
  min_rank INTEGER,
  plan_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (university_id) REFERENCES universities(id),
  FOREIGN KEY (major_id) REFERENCES majors(id),
  UNIQUE(university_id, major_id, year, province)
);

CREATE TABLE IF NOT EXISTS volunteer_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  slip_risk DECIMAL(5,2),
  adjustment_risk DECIMAL(5,2),
  conflict_warnings TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  university_id INTEGER NOT NULL,
  major_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  tier VARCHAR(20) NOT NULL,
  probability DECIMAL(5,2) NOT NULL,
  match_reasons TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES volunteer_plans(id),
  FOREIGN KEY (university_id) REFERENCES universities(id),
  FOREIGN KEY (major_id) REFERENCES majors(id)
);

CREATE TABLE IF NOT EXISTS collaboration_spaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  plan_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS collaboration_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES collaboration_spaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(space_id, user_id)
);

CREATE TABLE IF NOT EXISTS discussion_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  item_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES collaboration_spaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS qa_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS qa_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_expert BOOLEAN DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES qa_questions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS live_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expert_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_at DATETIME NOT NULL,
  duration INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'scheduled',
  stream_url VARCHAR(255),
  playback_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS live_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES live_sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS province_heatmap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  province VARCHAR(50) NOT NULL,
  university_id INTEGER,
  search_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(province, university_id, date)
);

CREATE INDEX IF NOT EXISTS idx_admission_scores_university ON admission_scores(university_id);
CREATE INDEX IF NOT EXISTS idx_admission_scores_major ON admission_scores(major_id);
CREATE INDEX IF NOT EXISTS idx_admission_scores_year ON admission_scores(year);
CREATE INDEX IF NOT EXISTS idx_admission_scores_province ON admission_scores(province);
CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province);
CREATE INDEX IF NOT EXISTS idx_universities_level ON universities(level);
CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category);
