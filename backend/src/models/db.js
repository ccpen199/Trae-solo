const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      contact TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      category TEXT,
      unit TEXT NOT NULL,
      spec TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      supplier_id INTEGER,
      batch_no TEXT,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      unit TEXT NOT NULL,
      valid_from DATE,
      valid_to DATE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS unit_conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_unit TEXT NOT NULL,
      to_unit TEXT NOT NULL,
      factor REAL NOT NULL,
      material_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      version TEXT DEFAULT '1.0',
      category TEXT,
      status TEXT DEFAULT 'draft',
      type TEXT DEFAULT 'formal',
      description TEXT,
      process_loss_rate REAL DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      loss_rate REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS recipe_alternatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_material_id INTEGER NOT NULL,
      alternative_material_id INTEGER NOT NULL,
      substitution_ratio REAL DEFAULT 1,
      priority INTEGER DEFAULT 1,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_material_id) REFERENCES recipe_materials(id) ON DELETE CASCADE,
      FOREIGN KEY (alternative_material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS packaging_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      type TEXT,
      unit TEXT NOT NULL,
      unit_price REAL DEFAULT 0,
      usage_per_unit REAL DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_packaging (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      packaging_id INTEGER NOT NULL,
      quantity REAL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (packaging_id) REFERENCES packaging_materials(id)
    );

    CREATE TABLE IF NOT EXISTS labor_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      process_name TEXT NOT NULL,
      labor_hours REAL DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cost_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      recipe_version TEXT,
      calculation_date DATE,
      material_cost REAL DEFAULT 0,
      packaging_cost REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      loss_cost REAL DEFAULT 0,
      tax_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      price_ids TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );

    CREATE TABLE IF NOT EXISTS cost_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calculation_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_id INTEGER,
      item_name TEXT,
      quantity REAL,
      unit TEXT,
      unit_price REAL,
      total_price REAL,
      remark TEXT,
      FOREIGN KEY (calculation_id) REFERENCES cost_calculations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      cost_calculation_id INTEGER,
      quote_no TEXT UNIQUE,
      channel TEXT,
      target_margin REAL DEFAULT 30,
      base_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_price REAL DEFAULT 0,
      actual_margin REAL DEFAULT 0,
      red_line_margin REAL DEFAULT 15,
      status TEXT DEFAULT 'pending',
      approval_status TEXT DEFAULT 'pending',
      created_by TEXT,
      approved_by TEXT,
      approved_at DATETIME,
      valid_from DATE,
      valid_to DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (cost_calculation_id) REFERENCES cost_calculations(id)
    );

    CREATE TABLE IF NOT EXISTS approval_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      approver TEXT,
      action TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );
  `);

  const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  if (materialCount === 0) {
    const insertMaterial = db.prepare('INSERT INTO materials (name, code, category, unit, spec) VALUES (?, ?, ?, ?, ?)');
    insertMaterial.run('小麦粉', 'MAT001', '原料', 'kg', '高筋');
    insertMaterial.run('白砂糖', 'MAT002', '原料', 'kg', '一级');
    insertMaterial.run('黄油', 'MAT003', '原料', 'kg', '无盐');
    insertMaterial.run('鸡蛋', 'MAT004', '原料', '个', '新鲜');
    insertMaterial.run('牛奶', 'MAT005', '原料', 'L', '全脂');

    const insertSupplier = db.prepare('INSERT INTO suppliers (name, code, contact, phone) VALUES (?, ?, ?, ?)');
    insertSupplier.run('优质粮油供应商', 'SUP001', '张三', '13800138001');
    insertSupplier.run('乳品批发公司', 'SUP002', '李四', '13800138002');

    const insertPrice = db.prepare('INSERT INTO material_prices (material_id, supplier_id, price, unit, valid_from) VALUES (?, ?, ?, ?, ?)');
    insertPrice.run(1, 1, 5.5, 'kg', '2024-01-01');
    insertPrice.run(2, 1, 8.0, 'kg', '2024-01-01');
    insertPrice.run(3, 2, 45.0, 'kg', '2024-01-01');
    insertPrice.run(4, 2, 1.5, '个', '2024-01-01');
    insertPrice.run(5, 2, 12.0, 'L', '2024-01-01');

    const insertRecipe = db.prepare('INSERT INTO recipes (name, code, version, category, status, type, process_loss_rate, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertRecipe.run('经典黄油曲奇', 'REC001', '1.0', '饼干', 'active', 'formal', 2.0, '经典配方，香酥可口');

    const insertRecipeMaterial = db.prepare('INSERT INTO recipe_materials (recipe_id, material_id, quantity, unit, loss_rate, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    insertRecipeMaterial.run(1, 1, 0.5, 'kg', 1.0, 1);
    insertRecipeMaterial.run(1, 2, 0.3, 'kg', 0.5, 2);
    insertRecipeMaterial.run(1, 3, 0.4, 'kg', 0.0, 3);
    insertRecipeMaterial.run(1, 4, 2.0, '个', 2.0, 4);

    const insertPackaging = db.prepare('INSERT INTO packaging_materials (name, code, type, unit, unit_price, usage_per_unit) VALUES (?, ?, ?, ?, ?, ?)');
    insertPackaging.run('曲奇铁盒', 'PKG001', '盒', '个', 5.0, 1);
    insertPackaging.run('内包装袋', 'PKG002', '袋', '个', 0.5, 1);
  }
}

initDatabase();

module.exports = db;
