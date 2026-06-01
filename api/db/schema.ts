export const schema = `
CREATE TABLE IF NOT EXISTS hs_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hs_code TEXT NOT NULL,
  category TEXT NOT NULL,
  material TEXT,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  UNIQUE(hs_code, version)
);

CREATE TABLE IF NOT EXISTS tax_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hs_code_id INTEGER NOT NULL,
  country_code TEXT NOT NULL,
  duty_rate REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 0,
  excise_rate REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  min_value REAL DEFAULT 0,
  max_value REAL,
  valid_from DATE NOT NULL,
  valid_to DATE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (hs_code_id) REFERENCES hs_codes(id),
  UNIQUE(hs_code_id, country_code, version)
);

CREATE TABLE IF NOT EXISTS calculation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate REAL DEFAULT 1,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  shipping_fee REAL DEFAULT 0,
  insurance_fee REAL DEFAULT 0,
  total_customs_value REAL NOT NULL,
  duty_amount REAL DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  excise_amount REAL DEFAULT 0,
  platform_withholding REAL DEFAULT 0,
  total_tax REAL NOT NULL,
  calculation_details TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  status TEXT DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS calculation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calculation_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0,
  customs_value REAL NOT NULL,
  duty_rate REAL,
  duty_amount REAL,
  vat_rate REAL,
  vat_amount REAL,
  excise_rate REAL,
  excise_amount REAL,
  calculation_details TEXT,
  FOREIGN KEY (calculation_id) REFERENCES calculation_records(id)
);

CREATE TABLE IF NOT EXISTS batch_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  error_details TEXT,
  status TEXT DEFAULT 'processing',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_hs_code ON hs_codes(hs_code);
CREATE INDEX IF NOT EXISTS idx_tax_rules_country ON tax_rules(country_code);
CREATE INDEX IF NOT EXISTS idx_calculation_order ON calculation_records(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
`;

export const seedData = `
INSERT OR IGNORE INTO hs_codes (hs_code, category, material, description, version) VALUES
('85171200', '电子产品', '塑料/金属', '智能手机', 1),
('85258013', '电子产品', '塑料/金属', '笔记本电脑', 1),
('61091000', '服装', '棉', 'T恤衫', 1),
('62034200', '服装', '棉', '牛仔裤', 1),
('95030010', '玩具', '塑料', '儿童玩具', 1),
('33049900', '化妆品', '化学品', '护肤品', 1);

INSERT OR IGNORE INTO tax_rules (hs_code_id, country_code, duty_rate, vat_rate, valid_from, version) VALUES
(1, 'US', 0.0, 0.0, '2024-01-01', 1),
(1, 'EU', 0.0, 0.20, '2024-01-01', 1),
(1, 'UK', 0.0, 0.20, '2024-01-01', 1),
(1, 'JP', 0.0, 0.10, '2024-01-01', 1),
(1, 'AU', 0.0, 0.10, '2024-01-01', 1),
(2, 'US', 0.0, 0.0, '2024-01-01', 1),
(2, 'EU', 0.0, 0.20, '2024-01-01', 1),
(2, 'UK', 0.0, 0.20, '2024-01-01', 1),
(3, 'US', 0.165, 0.0, '2024-01-01', 1),
(3, 'EU', 0.12, 0.20, '2024-01-01', 1),
(3, 'UK', 0.12, 0.20, '2024-01-01', 1),
(4, 'US', 0.165, 0.0, '2024-01-01', 1),
(4, 'EU', 0.12, 0.20, '2024-01-01', 1),
(5, 'US', 0.0, 0.0, '2024-01-01', 1),
(5, 'EU', 0.047, 0.20, '2024-01-01', 1),
(6, 'US', 0.053, 0.0, '2024-01-01', 1),
(6, 'EU', 0.065, 0.20, '2024-01-01', 1);
`;
