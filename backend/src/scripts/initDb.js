const { run, get, all, exec, db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const TABLES = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      status TEXT NOT NULL DEFAULT 'active',
      avatar_url TEXT,
      real_name TEXT,
      id_card_hash TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )`
  },
  {
    name: 'lawyers',
    sql: `CREATE TABLE IF NOT EXISTS lawyers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      license_verified INTEGER DEFAULT 0,
      practice_years INTEGER DEFAULT 0,
      law_firm TEXT,
      specializations TEXT,
      bio TEXT,
      rating REAL DEFAULT 5.0,
      total_consultations INTEGER DEFAULT 0,
      completed_consultations INTEGER DEFAULT 0,
      average_response_time INTEGER DEFAULT 0,
      total_income REAL DEFAULT 0.0,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  },
  {
    name: 'consultations',
    sql: `CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lawyer_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      urgency TEXT DEFAULT 'normal',
      budget_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      payment_id TEXT,
      started_at DATETIME,
      ended_at DATETIME,
      duration_seconds INTEGER DEFAULT 0,
      suggestion_id TEXT,
      review_id TEXT,
      is_disputed INTEGER DEFAULT 0,
      dispute_id TEXT,
      converted_to_case INTEGER DEFAULT 0,
      case_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers (id)
    )`
  },
  {
    name: 'consultation_status_logs',
    sql: `CREATE TABLE IF NOT EXISTS consultation_status_logs (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id)
    )`
  },
  {
    name: 'payments',
    sql: `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'online',
      transaction_no TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  },
  {
    name: 'messages',
    sql: `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id)
    )`
  },
  {
    name: 'consultation_suggestions',
    sql: `CREATE TABLE IF NOT EXISTS consultation_suggestions (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      lawyer_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      detailed_advice TEXT NOT NULL,
      legal_basis TEXT,
      recommended_actions TEXT,
      follow_up_needed INTEGER DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers (id)
    )`
  },
  {
    name: 'reviews',
    sql: `CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      lawyer_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      is_anonymous INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers (id)
    )`
  },
  {
    name: 'lawyer_ratings',
    sql: `CREATE TABLE IF NOT EXISTS lawyer_ratings (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT NOT NULL,
      review_id TEXT NOT NULL,
      rating_score REAL NOT NULL,
      weighting_factor REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers (id),
      FOREIGN KEY (review_id) REFERENCES reviews (id)
    )`
  },
  {
    name: 'disputes',
    sql: `CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      initiator_id TEXT NOT NULL,
      initiator_role TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      handler_id TEXT,
      resolution TEXT,
      resolved_at DATETIME,
      original_rating REAL,
      recalculated_rating REAL,
      refund_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id),
      FOREIGN KEY (handler_id) REFERENCES users (id)
    )`
  },
  {
    name: 'cases',
    sql: `CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      original_consultation_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      lawyer_suggestion TEXT NOT NULL,
      tags TEXT,
      is_searchable INTEGER DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      permalink TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations (id)
    )`
  },
  {
    name: 'user_wallets',
    sql: `CREATE TABLE IF NOT EXISTS user_wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      balance REAL DEFAULT 0.0,
      frozen_balance REAL DEFAULT 0.0,
      total_income REAL DEFAULT 0.0,
      total_withdraw REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  },
  {
    name: 'transactions',
    sql: `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      consultation_id TEXT,
      payment_id TEXT,
      description TEXT,
      related_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  },
  {
    name: 'audit_logs',
    sql: `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operator_id TEXT,
      operator_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  }
];

const initDatabase = () => {
  db.pragma('foreign_keys = ON');

  for (const table of TABLES) {
    try {
      exec(table.sql);
      console.log(`表 ${table.name} 已创建或已存在`);
    } catch (err) {
      console.error(`创建表 ${table.name} 失败:`, err.message);
      throw err;
    }
  }

  return { success: true };
};

const seedMockData = () => {
  const existingUsers = get('SELECT COUNT(*) as count FROM users');
  
  if (existingUsers && existingUsers.count > 0) {
    console.log('数据库已有数据，跳过数据初始化');
    return;
  }

  const users = [
    {
      id: uuidv4(),
      username: 'client1',
      email: 'client1@example.com',
      password: '123456',
      role: 'client',
      real_name: '张三',
      phone: '13800138001'
    },
    {
      id: uuidv4(),
      username: 'lawyer1',
      email: 'lawyer1@example.com',
      password: '123456',
      role: 'lawyer',
      real_name: '李律师',
      phone: '13800138002'
    },
    {
      id: uuidv4(),
      username: 'lawyer2',
      email: 'lawyer2@example.com',
      password: '123456',
      role: 'lawyer',
      real_name: '王律师',
      phone: '13800138003'
    },
    {
      id: uuidv4(),
      username: 'cs1',
      email: 'cs1@example.com',
      password: '123456',
      role: 'support',
      real_name: '客服小张',
      phone: '13800138004'
    },
    {
      id: uuidv4(),
      username: 'finance1',
      email: 'finance1@example.com',
      password: '123456',
      role: 'finance',
      real_name: '财务小李',
      phone: '13800138005'
    }
  ];

  const lawyers = [
    {
      id: uuidv4(),
      license_number: 'LS123456789',
      license_verified: 1,
      practice_years: 8,
      law_firm: '北京市正义律师事务所',
      specializations: ['civil', 'contract', 'labor'],
      bio: '专注于民商事纠纷解决，拥有8年执业经验。',
      rating: 4.8,
      total_consultations: 156,
      completed_consultations: 148
    },
    {
      id: uuidv4(),
      license_number: 'LS987654321',
      license_verified: 1,
      practice_years: 12,
      law_firm: '上海市光明律师事务所',
      specializations: ['criminal', 'corporate', 'intellectual'],
      bio: '擅长刑事辩护和企业法务，12年资深律师。',
      rating: 4.9,
      total_consultations: 234,
      completed_consultations: 228
    }
  ];

  let lawyerIndex = 0;
  
  for (const user of users) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    
    run(
      'INSERT INTO users (id, username, email, password_hash, role, real_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.username, user.email, passwordHash, user.role, user.real_name, user.phone, 'active']
    );

    run(
      'INSERT INTO user_wallets (id, user_id, balance) VALUES (?, ?, ?)',
      [uuidv4(), user.id, user.role === 'client' ? 5000 : 0]
    );

    if (user.role === 'lawyer' && lawyerIndex < lawyers.length) {
      const lawyer = lawyers[lawyerIndex];
      run(
        `INSERT INTO lawyers (id, user_id, license_number, license_verified, practice_years, 
         law_firm, specializations, bio, rating, total_consultations, completed_consultations, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lawyer.id, user.id, lawyer.license_number, lawyer.license_verified,
          lawyer.practice_years, lawyer.law_firm, JSON.stringify(lawyer.specializations),
          lawyer.bio, lawyer.rating, lawyer.total_consultations, lawyer.completed_consultations, 1
        ]
      );
      lawyerIndex++;
    }
  }

  console.log('Mock 数据已初始化');
};

module.exports = { initDatabase, seedMockData };
