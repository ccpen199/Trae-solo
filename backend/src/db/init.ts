import db from './database.js';
import bcrypt from 'bcryptjs';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'designer', 'company', 'supplier', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      budget_min REAL,
      budget_max REAL,
      style_preference TEXT,
      timeline_start TEXT,
      timeline_end TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS designers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      portfolio TEXT DEFAULT '[]',
      certifications TEXT DEFAULT '[]',
      rating REAL DEFAULT 0,
      experience_years INTEGER DEFAULT 0,
      specialties TEXT,
      availability TEXT DEFAULT 'available' CHECK(availability IN ('available', 'busy', 'offline'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      license_number TEXT,
      license_verified INTEGER DEFAULT 0,
      inspection_count INTEGER DEFAULT 0,
      contract_fulfillment_rate REAL DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      brand_authorization TEXT DEFAULT '[]',
      batch_qc_reports TEXT DEFAULT '[]',
      categories TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES users(id),
      company_id INTEGER REFERENCES users(id),
      designer_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'in_progress', 'inspection', 'completed')),
      start_date TEXT,
      end_date TEXT,
      address TEXT,
      total_budget REAL,
      style_preference TEXT,
      budget_preference TEXT,
      area TEXT,
      house_type TEXT,
      contract_info TEXT,
      node_responsibles TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS design_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      designer_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      style TEXT,
      model_url TEXT,
      thumbnail_url TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'rejected')),
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS design_annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER NOT NULL REFERENCES design_schemes(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      position_x REAL,
      position_y REAL,
      position_z REAL,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS design_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER NOT NULL REFERENCES design_schemes(id),
      version_number INTEGER NOT NULL,
      model_url TEXT,
      changes_description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      company_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      total_price REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      management_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
      warning_flags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL REFERENCES quotations(id),
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      specification TEXT,
      unit_price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      craft_standard TEXT,
      is_additional INTEGER DEFAULT 0,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspection_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      type TEXT NOT NULL CHECK(type IN ('water_electric', 'masonry', 'completion')),
      inspector_id INTEGER REFERENCES users(id),
      scheduled_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inspection_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES inspection_tasks(id),
      images TEXT DEFAULT '[]',
      defects TEXT DEFAULT '[]',
      ai_analysis TEXT,
      suggestions TEXT,
      overall_score REAL,
      status TEXT DEFAULT 'pass' CHECK(status IN ('pass', 'fail', 'conditional')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      specification TEXT,
      unit_price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      image_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS material_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      project_id INTEGER NOT NULL REFERENCES projects(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivered', 'returned')),
      logistics_info TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      category TEXT,
      description TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'processing', 'resolved', 'closed')),
      root_cause TEXT,
      resolution TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'payment', 'refund', 'fine')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS city_price_indices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      labor_index REAL,
      material_index REAL,
      overall_index REAL
    );
  `);

  const ensureLoginAccounts = [
    { username: 'admin', password: 'Admin@123', role: 'admin', name: '系统管理员' },
    { username: 'platform', password: 'Platform@123', role: 'admin', name: '平台运营员' },
    { username: 'ops', password: 'Ops@123', role: 'admin', name: '运维管理员' },
  ];

  const selectUser = db.prepare('SELECT id FROM users WHERE username = ?');
  const insertLoginUser = db.prepare('INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)');
  const updateLoginUser = db.prepare("UPDATE users SET password_hash = ?, role = ?, name = ?, updated_at = datetime('now') WHERE username = ?");

  for (const account of ensureLoginAccounts) {
    const hash = bcrypt.hashSync(account.password, 10);
    const existing = selectUser.get(account.username);
    if (existing) {
      updateLoginUser.run(hash, account.role, account.name, account.username);
    } else {
      insertLoginUser.run(account.username, hash, account.role, account.name);
    }
  }

  const seedAccounts = [
    { username: 'owner1', password: '123456', role: 'owner', name: '张业主', phone: '13800138001', table: 'owners' },
    { username: 'designer1', password: '123456', role: 'designer', name: '李设计师', phone: '13800138002', table: 'designers' },
    { username: 'company1', password: '123456', role: 'company', name: '靠谱装修公司', phone: '13800138003', table: 'companies' },
    { username: 'supplier1', password: '123456', role: 'supplier', name: '金牌建材供应商', phone: '13800138004', table: 'suppliers' },
  ];

  for (const acc of seedAccounts) {
    const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(acc.username);
    if (!exists) {
      const hash = bcrypt.hashSync(acc.password, 10);
      const result = db.prepare(
        'INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)'
      ).run(acc.username, hash, acc.role, acc.name, acc.phone);
      const userId = result.lastInsertRowid;
      db.prepare(`INSERT INTO ${acc.table} (user_id) VALUES (?)`).run(userId);
    }
  }

  const projectCount = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as any).c;
  if (projectCount === 0) {
    const ownerRow = db.prepare("SELECT id FROM owners WHERE id = (SELECT MIN(id) FROM owners)").get() as any;
    const designerRow = db.prepare("SELECT id FROM designers WHERE id = (SELECT MIN(id) FROM designers)").get() as any;
    const companyRow = db.prepare("SELECT id FROM companies WHERE id = (SELECT MIN(id) FROM companies)").get() as any;
    const supplierRow = db.prepare("SELECT id FROM suppliers WHERE id = (SELECT MIN(id) FROM suppliers)").get() as any;

    if (ownerRow && designerRow && companyRow) {
      const pResult = db.prepare(
        "INSERT INTO projects (title, owner_id, designer_id, company_id, address, total_budget, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run('万科城市花园3栋502室装修项目', ownerRow.id, designerRow.id, companyRow.id, '万科城市花园3栋502室', 300000, 'in_progress');
      const projectId = pResult.lastInsertRowid;

      db.prepare(
        "INSERT INTO design_schemes (project_id, designer_id, title, description, style, status) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(projectId, designerRow.id, '现代简约三居室方案', '三室两厅现代简约风格设计方案', '现代简约', 'review');

      db.prepare(
        "INSERT INTO quotations (project_id, company_id, title, labor_cost, management_fee, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(projectId, companyRow.id, '装修报价A', 20000, 5000, 125000, 'submitted');

      db.prepare(
        "INSERT INTO inspection_tasks (project_id, type, description, scheduled_date, status) VALUES (?, ?, ?, ?, ?)"
      ).run(projectId, 'water_electric', '水电隐蔽工程验收', '2026-06-10', 'pending');

      if (supplierRow) {
        const mResult = db.prepare(
          "INSERT INTO materials (supplier_id, name, brand, category, specification, unit_price, stock, min_stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(supplierRow.id, '立邦净味5合1乳胶漆', '立邦', '涂料', '5L/桶', 298, 100, 10, 'active');
        db.prepare(
          "INSERT INTO materials (supplier_id, name, brand, category, specification, unit_price, stock, min_stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(supplierRow.id, '东鹏800x800地砖', '东鹏', '瓷砖', '800x800mm', 68, 500, 50, 'active');
      }

      db.prepare(
        "INSERT INTO city_price_indices (city, year, month, labor_index, material_index, overall_index) VALUES (?, ?, ?, ?, ?, ?)"
      ).run('上海', 2026, 6, 108.5, 112.3, 110.4);
      db.prepare(
        "INSERT INTO city_price_indices (city, year, month, labor_index, material_index, overall_index) VALUES (?, ?, ?, ?, ?, ?)"
      ).run('北京', 2026, 6, 110.2, 115.1, 112.8);
      db.prepare(
        "INSERT INTO city_price_indices (city, year, month, labor_index, material_index, overall_index) VALUES (?, ?, ?, ?, ?, ?)"
      ).run('广州', 2026, 6, 105.3, 109.8, 107.6);
    }
  }
}
