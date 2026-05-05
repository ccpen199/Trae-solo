require('dotenv').config();
const path = require('path');
const fs = require('fs');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let db;
let pool;

const initPostgreSQL = () => {
  const { Pool } = require('pg');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'campus_secondhand',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  return pool;
};

const initSQLite = () => {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/campus.db');
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
};

const query = async (text, params) => {
  if (DB_TYPE === 'postgres' && pool) {
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } else if (db) {
    const sql = text
      .replace(/\$(\d+)/g, '?')
      .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/DECIMAL\(\d+,\s*\d+\)/g, 'REAL')
      .replace(/TEXT\[\]/g, 'TEXT')
      .replace(/::\w+/g, '');
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return { 
        rows: [], 
        rowCount: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    }
  }
  return { rows: [], rowCount: 0 };
};

const getLastInsertId = async (tableName) => {
  if (DB_TYPE === 'postgres') {
    const result = await query(`SELECT currval(pg_get_serial_sequence('${tableName}', 'id')) as id`);
    return result.rows[0]?.id;
  } else {
    const result = await query('SELECT last_insert_rowid() as id');
    return result.rows[0]?.id;
  }
};

const initDatabase = async () => {
  try {
    console.log(`使用数据库类型: ${DB_TYPE}`);
    
    if (DB_TYPE === 'postgres') {
      initPostgreSQL();
    } else {
      initSQLite();
    }

    const createTables = async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          nickname VARCHAR(50),
          avatar VARCHAR(255),
          role VARCHAR(20) DEFAULT 'user',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          category_id INTEGER,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          original_price REAL,
          condition VARCHAR(50),
          contact_info VARCHAR(200),
          images TEXT,
          location VARCHAR(100),
          status VARCHAR(20) DEFAULT 'active',
          view_count INTEGER DEFAULT 0,
          favorite_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS supply_demands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          type VARCHAR(20) NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          budget REAL,
          contact_info VARCHAR(200),
          status VARCHAR(20) DEFAULT 'active',
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_no VARCHAR(50) UNIQUE NOT NULL,
          buyer_id INTEGER,
          seller_id INTEGER,
          product_id INTEGER,
          price REAL NOT NULL,
          quantity INTEGER DEFAULT 1,
          total_amount REAL NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          buyer_message TEXT,
          seller_remark TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER,
          sender_id INTEGER,
          receiver_id INTEGER,
          content TEXT NOT NULL,
          parent_id INTEGER,
          is_read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          product_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR(200) NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER,
          is_top INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    };

    await createTables();

    const adminCheck = await query("SELECT id FROM users WHERE username = 'admin'");
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await query(
        `INSERT INTO users (username, email, password, role, status, nickname) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin', 'admin@campus.com', hashedPassword, 'admin', 'active', '管理员']
      );
    }

    const categoryCheck = await query('SELECT id FROM categories LIMIT 1');
    
    if (categoryCheck.rows.length === 0) {
      const defaultCategories = [
        { name: '数码产品', description: '手机、电脑、平板等数码设备', sort_order: 1 },
        { name: '书籍教材', description: '教材、参考书、小说等', sort_order: 2 },
        { name: '服饰鞋包', description: '衣服、鞋子、包包等', sort_order: 3 },
        { name: '生活用品', description: '日常用品、家居用品等', sort_order: 4 },
        { name: '运动器材', description: '运动装备、健身器材等', sort_order: 5 },
        { name: '美妆护肤', description: '化妆品、护肤品等', sort_order: 6 },
        { name: '学习用品', description: '文具、学习工具等', sort_order: 7 },
        { name: '其他', description: '其他闲置物品', sort_order: 99 },
      ];

      for (const cat of defaultCategories) {
        await query(
          'INSERT INTO categories (name, description, sort_order) VALUES ($1, $2, $3)',
          [cat.name, cat.description, cat.sort_order]
        );
      }
    }

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

module.exports = { query, getLastInsertId, initDatabase, pool, db };
