-- 城市表
CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 分类表 (支持四类基础+地方扩展)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  guidelines TEXT NOT NULL,
  misconceptions TEXT,
  update_timestamp INTEGER NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- 垃圾条目表
CREATE TABLE IF NOT EXISTS garbage_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT,
  category_id TEXT NOT NULL,
  city_id TEXT NOT NULL,
  requirements TEXT NOT NULL,
  misconceptions TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE INDEX IF NOT EXISTS idx_items_name ON garbage_items(name);
CREATE INDEX IF NOT EXISTS idx_items_city ON garbage_items(city_id);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  city_id TEXT NOT NULL,
  district TEXT,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- PDF文档表
CREATE TABLE IF NOT EXISTS pdf_documents (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploader_id TEXT NOT NULL,
  parsed_content TEXT,
  linked_item_ids TEXT,
  version TEXT,
  upload_time INTEGER NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id),
  FOREIGN KEY (uploader_id) REFERENCES admins(id)
);

-- 用户反馈表
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  misjudged_category_id TEXT,
  correct_category_id TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  district TEXT,
  street TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (misjudged_category_id) REFERENCES categories(id),
  FOREIGN KEY (correct_category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_item ON feedback(item_name);
CREATE INDEX IF NOT EXISTS idx_feedback_location ON feedback(district, street);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- 街道表
CREATE TABLE IF NOT EXISTS streets (
  id TEXT PRIMARY KEY,
  district TEXT NOT NULL,
  name TEXT NOT NULL,
  city_id TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);
