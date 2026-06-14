-- 创建规则命中审计表，用于记录每次规则命中的详细信息
CREATE TABLE IF NOT EXISTS rule_hit_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  enterprise_id INTEGER NOT NULL,
  rule_name TEXT,
  rule_level TEXT,
  trigger_reason TEXT,
  action_type TEXT,
  action_result TEXT,
  processing_status TEXT DEFAULT '待处理',
  processing_time TEXT,
  processing_result TEXT,
  reviewer TEXT,
  review_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES risk_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rule_hit_records_rule_id ON rule_hit_records(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_hit_records_enterprise_id ON rule_hit_records(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_rule_hit_records_status ON rule_hit_records(processing_status);
CREATE INDEX IF NOT EXISTS idx_rule_hit_records_created_at ON rule_hit_records(created_at DESC);
