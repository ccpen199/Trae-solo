import db from './database.js';
import bcrypt from 'bcryptjs';

const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL CHECK (role IN ('employer', 'provider', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'verified', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

    CREATE TABLE IF NOT EXISTS talents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      real_name TEXT,
      id_card_verified BOOLEAN DEFAULT 0,
      skills TEXT,
      bio TEXT,
      rating DECIMAL(3,2) DEFAULT 0,
      completed_projects INTEGER DEFAULT 0,
      on_time_rate DECIMAL(5,2) DEFAULT 100,
      level TEXT DEFAULT 'entry' CHECK (level IN ('entry', 'intermediate', 'advanced', 'expert')),
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_talents_level ON talents(level);
    CREATE INDEX IF NOT EXISTS idx_talents_rating ON talents(rating);
    CREATE INDEX IF NOT EXISTS idx_talents_verified ON talents(verified);

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      images TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (talent_id) REFERENCES talents(id)
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date DATE NOT NULL,
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (talent_id) REFERENCES talents(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      provider_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('ui_design', 'industrial_design', 'animation', 'software', 'trademark', 'copywriting')),
      budget_min DECIMAL(12,2) NOT NULL,
      budget_max DECIMAL(12,2) NOT NULL,
      final_budget DECIMAL(12,2),
      duration_days INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'bidding', 'selected', 'in_progress', 'submitted', 'reviewing', 'revising', 'completed', 'disputed', 'cancelled')),
      tags TEXT,
      delivery_standards TEXT,
      review_nodes TEXT,
      milestones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employer_id) REFERENCES users(id),
      FOREIGN KEY (provider_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_employer ON tasks(employer_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_provider ON tasks(provider_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
    CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      proposal TEXT NOT NULL,
      budget DECIMAL(12,2) NOT NULL,
      duration_days INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (provider_id) REFERENCES users(id),
      UNIQUE(task_id, provider_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bids_task ON bids(task_id);
    CREATE INDEX IF NOT EXISTS idx_bids_provider ON bids(provider_id);
    CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT,
      files TEXT,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'revision_requested', 'approved', 'rejected')),
      review_comment TEXT,
      review_score INTEGER,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (provider_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'file', 'submission', 'system')),
      file_url TEXT,
      file_name TEXT,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      balance DECIMAL(12,2) DEFAULT 0,
      frozen_balance DECIMAL(12,2) DEFAULT 0,
      total_income DECIMAL(12,2) DEFAULT 0,
      total_expense DECIMAL(12,2) DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('deposit', 'escrow', 'release', 'refund', 'withdraw', 'fee')),
      amount DECIMAL(12,2) NOT NULL,
      balance DECIMAL(12,2) NOT NULL,
      task_id INTEGER,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      initiator_id INTEGER NOT NULL,
      respondent_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'closed')),
      resolution TEXT,
      amount_distribution TEXT,
      resolved_by INTEGER,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (initiator_id) REFERENCES users(id),
      FOREIGN KEY (respondent_id) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
    CREATE INDEX IF NOT EXISTS idx_disputes_created ON disputes(created_at);

    CREATE TABLE IF NOT EXISTS ip_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      file_hash TEXT NOT NULL,
      file_name TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      block_height INTEGER,
      tx_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES submissions(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (provider_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_ip_records_hash ON ip_records(file_hash);
    CREATE INDEX IF NOT EXISTS idx_ip_records_task ON ip_records(task_id);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);

  const adminPwd = hashPassword('admin123');
  const userPwd = hashPassword('123456');

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, phone, password_hash, name, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin@example.com', '13800000000', adminPwd, '平台管理员', 'admin', 'verified');
  insertUser.run('employer@example.com', '13800000001', userPwd, '测试企业', 'employer', 'verified');
  insertUser.run('provider@example.com', '13800000002', userPwd, '测试设计师', 'provider', 'verified');

  const insertTalent = db.prepare(`
    INSERT OR IGNORE INTO talents (user_id, real_name, skills, bio, rating, level, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTalent.run(3, '张三', JSON.stringify(['UI设计', '品牌设计', '插画']), '8年设计经验，服务过多家500强企业', 4.9, 'expert', 1);

  const insertPortfolio = db.prepare(`
    INSERT OR IGNORE INTO portfolio_items (talent_id, title, description, images, url)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPortfolio.run(1, '品牌VI设计', '为科技公司设计完整品牌视觉系统',
    JSON.stringify([
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20brand%20logo%20design%20tech%20company&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20card%20design%20brand%20identity&image_size=square'
    ]),
    'https://example.com/portfolio/1'
  );
  insertPortfolio.run(1, '电商APP界面设计', '移动端电商应用全案设计',
    JSON.stringify([
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20app%20ui%20design%20ecommerce%20home%20page&image_size=portrait_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20app%20product%20detail%20page%20design&image_size=portrait_4_3'
    ]),
    'https://example.com/portfolio/2'
  );

  const insertWallet = db.prepare(`
    INSERT OR IGNORE INTO wallets (user_id, balance, frozen_balance)
    VALUES (?, ?, ?)
  `);
  insertWallet.run(2, 100000.00, 0);
  insertWallet.run(3, 0, 0);

  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO tasks (employer_id, provider_id, title, description, type, budget_min, budget_max, final_budget, duration_days, status, tags, delivery_standards, review_nodes, milestones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const reviewNodes = JSON.stringify([
    { id: '1', name: '初稿评审', description: '设计方向确认', order: 1, completed: false, completedAt: null },
    { id: '2', name: '终稿评审', description: '最终交付物验收', order: 2, completed: false, completedAt: null }
  ]);

  const milestones = JSON.stringify([
    { id: '1', name: '初稿完成', description: '提交设计初稿供评审', amount: 2500, dueDate: '2026-06-15', status: 'pending' },
    { id: '2', name: '终稿完成', description: '提交最终设计文件', amount: 2500, dueDate: '2026-06-25', status: 'pending' }
  ]);

  insertTask.run(
    2, null, '企业品牌LOGO设计', '需要设计一套企业品牌LOGO，包含多种应用场景的设计规范',
    'ui_design', 4000, 6000, null, 20, 'bidding',
    JSON.stringify(['LOGO设计', '品牌设计', 'VI设计']),
    '需要提供源文件、不同背景版本、使用规范说明',
    reviewNodes, milestones
  );

  insertTask.run(
    2, 3, '电商APP界面设计', '设计电商APP的首页、商品列表、商品详情、购物车、个人中心等核心页面',
    'ui_design', 8000, 12000, 10000, 30, 'in_progress',
    JSON.stringify(['UI设计', 'APP设计', '电商']),
    '需要提供高保真设计稿、切图标注、设计规范',
    reviewNodes, milestones
  );

  const insertBid = db.prepare(`
    INSERT OR IGNORE INTO bids (task_id, provider_id, proposal, budget, duration_days, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertBid.run(1, 3, '我有丰富的品牌设计经验，曾服务多家知名企业。我将提供3个设计方向供选择，包含完整的VI应用规范。', 5000, 15, 'pending');

  console.log('Database initialized successfully');
}

export default initDatabase;
