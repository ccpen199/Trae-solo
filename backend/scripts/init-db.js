const db = require('../src/db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  english_name TEXT,
  logo_url TEXT,
  industry TEXT,
  category TEXT,
  region TEXT,
  established_year INTEGER,
  registered_capital TEXT,
  legal_person TEXT,
  unified_social_code TEXT,
  website TEXT,
  description TEXT,
  level TEXT DEFAULT 'C',
  first_letter TEXT,
  status TEXT DEFAULT 'active',
  overall_score REAL DEFAULT 0,
  sales_volume REAL DEFAULT 0,
  reputation_score REAL DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brand_online_shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  shop_url TEXT,
  shop_name TEXT,
  monthly_sales REAL,
  rating REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brand_sentiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL,
  source TEXT NOT NULL,
  title TEXT,
  content TEXT,
  sentiment_score REAL,
  sentiment_type TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ranking_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category_type TEXT DEFAULT 'top10',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  brand_id INTEGER NOT NULL,
  rank_position INTEGER NOT NULL,
  final_score REAL NOT NULL,
  vote_score REAL DEFAULT 0,
  sales_score REAL DEFAULT 0,
  reputation_score REAL DEFAULT 0,
  expert_adjustment REAL DEFAULT 0,
  period TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES ranking_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  UNIQUE(category_id, brand_id, period)
);

CREATE TABLE IF NOT EXISTS expert_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_id INTEGER NOT NULL,
  expert_id INTEGER NOT NULL,
  adjustment_value REAL DEFAULT 0,
  reason TEXT,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  category TEXT,
  tags TEXT,
  cover_image TEXT,
  author TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  needs_review INTEGER DEFAULT 0,
  review_reason TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT,
  confidence REAL,
  FOREIGN KEY (topic_id) REFERENCES knowledge_topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_entity_id INTEGER NOT NULL,
  target_entity_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,
  confidence REAL,
  FOREIGN KEY (source_entity_id) REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  FOREIGN KEY (target_entity_id) REFERENCES knowledge_entities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS concept_hierarchy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  description TEXT,
  FOREIGN KEY (parent_id) REFERENCES concept_hierarchy(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  api_endpoint TEXT,
  last_sync_at DATETIME,
  sync_status TEXT DEFAULT 'idle',
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS data_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  record_type TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  raw_data TEXT,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS update_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  related_topic_id INTEGER,
  related_brand_id INTEGER,
  is_processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_topic_id) REFERENCES knowledge_topics(id) ON DELETE SET NULL,
  FOREIGN KEY (related_brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS research_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT,
  period TEXT,
  top10_features TEXT,
  competition_analysis TEXT,
  generated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  score INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brand_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  category_id INTEGER,
  brand_ids TEXT NOT NULL,
  comparison_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES ranking_categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_brands_industry ON brands(industry);
CREATE INDEX IF NOT EXISTS idx_brands_region ON brands(region);
CREATE INDEX IF NOT EXISTS idx_brands_first_letter ON brands(first_letter);
CREATE INDEX IF NOT EXISTS idx_brands_level ON brands(level);
CREATE INDEX IF NOT EXISTS idx_rankings_category ON rankings(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_topics(category);
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON brand_comparisons(user_id);
`);

console.log('Database initialized successfully');
db.close();
