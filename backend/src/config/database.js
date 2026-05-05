const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db = null;
let usePg = false;

const getDbPath = () => {
  return path.join(__dirname, '../../data/ecu_diagnostic.db');
};

const convertPgToSqlite = (sql, params) => {
  let convertedSql = sql;
  
  convertedSql = convertedSql.replace(/\$(\d+)/g, (match, num) => {
    return '?';
  });
  
  convertedSql = convertedSql.replace(/\bILIKE\b/gi, 'LIKE');
  convertedSql = convertedSql.replace(/\bCURRENT_TIMESTAMP\b/gi, "datetime('now')");
  
  return convertedSql;
};

const extractReturningColumns = (sql) => {
  const returningMatch = sql.match(/RETURNING\s+(.+)$/i);
  if (returningMatch) {
    const baseSql = sql.substring(0, returningMatch.index).trim();
    const returningPart = returningMatch[1].trim();
    const columns = returningPart === '*' ? ['*'] : returningPart.split(',').map(c => c.trim());
    return { baseSql, columns, hasReturning: true };
  }
  return { baseSql: sql, columns: [], hasReturning: false };
};

const getTableFromInsert = (sql) => {
  const match = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  return match ? match[1] : null;
};

const initSqliteDb = () => {
  const dbPath = getDbPath();
  const fs = require('fs');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  db = new Database(dbPath);
  console.log('使用 SQLite 数据库:', dbPath);
  
  createSqliteTables();
  insertSqliteSeedData();
};

const createSqliteTables = () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS vehicle_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      model_code TEXT UNIQUE NOT NULL,
      engine_type TEXT,
      displacement TEXT,
      fuel_type TEXT,
      manufacturer TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vin TEXT UNIQUE,
      license_plate TEXT,
      model_id INTEGER,
      ecu_serial TEXT UNIQUE,
      ecu_model TEXT,
      engine_number TEXT,
      production_date DATE,
      purchase_date DATE,
      mileage DECIMAL(10, 2) DEFAULT 0,
      status TEXT DEFAULT 'active',
      owner_name TEXT,
      owner_phone TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      sensor_code TEXT NOT NULL,
      sensor_name TEXT NOT NULL,
      sensor_type TEXT,
      unit TEXT,
      min_value DECIMAL(10, 2),
      max_value DECIMAL(10, 2),
      warning_min DECIMAL(10, 2),
      warning_max DECIMAL(10, 2),
      position TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS actuators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      actuator_code TEXT NOT NULL,
      actuator_name TEXT NOT NULL,
      actuator_type TEXT,
      control_method TEXT,
      working_voltage DECIMAL(5, 2),
      position TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS data_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      session_code TEXT UNIQUE NOT NULL,
      protocol_type TEXT DEFAULT 'CAN',
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      total_samples INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS time_series_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      vehicle_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_type TEXT,
      data_value DECIMAL(15, 6),
      unit TEXT,
      sensor_id INTEGER,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS dtcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dtc_code TEXT UNIQUE NOT NULL,
      dtc_name TEXT NOT NULL,
      category TEXT,
      severity TEXT,
      description TEXT,
      possible_causes TEXT,
      troubleshooting_steps TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS fault_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      dtc_id INTEGER,
      fault_category TEXT,
      fault_code TEXT,
      fault_name TEXT,
      severity TEXT,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      cleared_at DATETIME,
      status TEXT DEFAULT 'active',
      description TEXT,
      possible_causes TEXT,
      troubleshooting_steps TEXT,
      repair_result TEXT,
      repair_notes TEXT,
      repair_user_id INTEGER,
      repair_time DATETIME,
      occurrence_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS calibration_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parameter_code TEXT UNIQUE NOT NULL,
      parameter_name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      min_value DECIMAL(15, 6),
      max_value DECIMAL(15, 6),
      default_value DECIMAL(15, 6),
      step_value DECIMAL(15, 6),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS calibration_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_code TEXT UNIQUE NOT NULL,
      version_name TEXT,
      vehicle_model_id INTEGER,
      ecu_model TEXT,
      description TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_comment TEXT,
      published_by INTEGER,
      published_at DATETIME,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS calibration_version_params (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER,
      calibration_param_id INTEGER,
      param_name TEXT,
      param_code TEXT,
      category TEXT,
      param_value DECIMAL(15, 6),
      unit TEXT,
      min_value DECIMAL(15, 6),
      max_value DECIMAL(15, 6),
      default_value DECIMAL(15, 6),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS calibration_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER,
      reviewer_id INTEGER,
      review_result TEXT,
      comment TEXT,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS communication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      session_id INTEGER,
      protocol_type TEXT,
      direction TEXT,
      message_type TEXT,
      message_data TEXT,
      response_time_ms INTEGER,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action_type TEXT,
      module TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  
  tables.forEach(sql => {
    try {
      db.exec(sql);
    } catch (err) {
      console.log('创建表警告:', err.message);
    }
  });
  
  console.log('SQLite 表结构初始化完成');
};

const insertSqliteSeedData = () => {
  try {
    const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = checkUsers.get().count;
    
    if (userCount === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const stmt = db.prepare(`
        INSERT INTO users (username, password, role, name) 
        VALUES (?, ?, 'admin', '系统管理员')
      `);
      stmt.run('admin', hashedPassword);
      
      const hashedPassword2 = bcrypt.hashSync('user123', 10);
      const stmt2 = db.prepare(`
        INSERT INTO users (username, password, role, name) 
        VALUES (?, ?, 'user', '维修技师')
      `);
      stmt2.run('user', hashedPassword2);
    }
    
    const checkModels = db.prepare('SELECT COUNT(*) as count FROM vehicle_models');
    const modelCount = checkModels.get().count;
    
    if (modelCount === 0) {
      const modelStmt = db.prepare(`
        INSERT INTO vehicle_models (model_name, model_code, engine_type, displacement, fuel_type, manufacturer) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      modelStmt.run('本田CB400X', 'CB400X-2024', '直列四缸', '399cc', '汽油', '本田');
      modelStmt.run('雅马哈R3', 'YZF-R3-2024', '直列双缸', '321cc', '汽油', '雅马哈');
      modelStmt.run('春风250SR', 'CF250SR-2024', '单缸', '249cc', '汽油', '春风动力');
    }
    
    const checkDtcs = db.prepare('SELECT COUNT(*) as count FROM dtcs');
    const dtcCount = checkDtcs.get().count;
    
    if (dtcCount === 0) {
      const dtcStmt = db.prepare(`
        INSERT INTO dtcs (dtc_code, dtc_name, category, severity, description, possible_causes, troubleshooting_steps) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      dtcStmt.run(
        'P0100', 
        '空气流量传感器电路故障', 
        'sensor', 
        'high', 
        'ECU检测到空气流量传感器信号超出正常范围', 
        '空气流量传感器故障、线路断路、ECU故障', 
        '1.检查传感器供电 2.检查信号线路 3.更换传感器'
      );
      dtcStmt.run(
        'P0110', 
        '进气温度传感器电路故障', 
        'sensor', 
        'medium', 
        '进气温度传感器信号异常', 
        '传感器故障、线路接触不良', 
        '检查传感器及线束'
      );
      dtcStmt.run(
        'P0300', 
        '多缸失火检测', 
        'actuator', 
        'high', 
        'ECU检测到多个气缸失火', 
        '点火线圈故障、火花塞损坏、喷油嘴堵塞', 
        '1.检查火花塞 2.检查点火线圈 3.检查燃油系统'
      );
      dtcStmt.run(
        'U0100', 
        '与ECM/PCM通讯中断', 
        'communication', 
        'high', 
        '无法与发动机控制模块通讯', 
        'CAN总线故障、ECU电源故障、ECU损坏', 
        '1.检查CAN总线 2.检查ECU供电 3.更换ECU'
      );
    }
    
    const checkParams = db.prepare('SELECT COUNT(*) as count FROM calibration_parameters');
    const paramCount = checkParams.get().count;
    
    if (paramCount === 0) {
      const paramStmt = db.prepare(`
        INSERT INTO calibration_parameters (parameter_code, parameter_name, category, unit, min_value, max_value, default_value, step_value, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      paramStmt.run('INJ_BASE_MAP', '基础喷油MAP', 'injection', 'ms/rpm', 0, 50, 10, 0.1, '基础喷油脉宽MAP表');
      paramStmt.run('IGN_BASE_MAP', '基础点火MAP', 'ignition', 'deg', -30, 60, 15, 0.5, '基础点火提前角MAP表');
      paramStmt.run('IDLE_TARGET_RPM', '怠速目标转速', 'idle', 'rpm', 1000, 3000, 1500, 10, '怠速控制目标转速');
      paramStmt.run('FAN_ON_TEMP', '风扇开启温度', 'fan', 'degC', 80, 110, 95, 1, '冷却风扇开启温度');
      paramStmt.run('FAN_OFF_TEMP', '风扇关闭温度', 'fan', 'degC', 70, 100, 88, 1, '冷却风扇关闭温度');
      paramStmt.run('CANISTER_PURGE_DUTY', '碳罐电磁阀占空比', 'purge', '%', 0, 100, 20, 1, '碳罐清洗电磁阀占空比');
    }
    
    console.log('SQLite 种子数据初始化完成');
    console.log('默认账户: admin/admin123, user/user123');
  } catch (err) {
    console.error('插入种子数据失败:', err.message);
  }
};

const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const { baseSql, columns, hasReturning } = extractReturningColumns(sql);
      const convertedSql = convertPgToSqlite(baseSql, params);
      const sqlUpper = convertedSql.trim().toUpperCase();
      
      if (sqlUpper.startsWith('SELECT')) {
        const stmt = db.prepare(convertedSql);
        const result = params.length > 0 ? stmt.all(...params) : stmt.all();
        resolve({ rows: result });
      } else if (sqlUpper.startsWith('INSERT')) {
        const stmt = db.prepare(convertedSql);
        const result = params.length > 0 ? stmt.run(...params) : stmt.run();
        const lastId = result.lastInsertRowid;
        
        if (hasReturning && lastId) {
          const tableName = getTableFromInsert(baseSql);
          if (tableName) {
            const selectSql = `SELECT ${columns.join(', ')} FROM ${tableName} WHERE id = ?`;
            const selectStmt = db.prepare(selectSql);
            const insertedRow = selectStmt.get(lastId);
            resolve({
              rows: insertedRow ? [insertedRow] : [],
              rowsAffected: result.changes,
              insertId: lastId,
            });
            return;
          }
        }
        
        resolve({
          rows: [],
          rowsAffected: result.changes,
          insertId: lastId,
        });
      } else if (sqlUpper.startsWith('UPDATE') || sqlUpper.startsWith('DELETE')) {
        const stmt = db.prepare(convertedSql);
        const result = params.length > 0 ? stmt.run(...params) : stmt.run();
        
        if (hasReturning && sqlUpper.startsWith('UPDATE')) {
          resolve({
            rows: [],
            rowsAffected: result.changes,
          });
          return;
        }
        
        resolve({
          rows: [],
          rowsAffected: result.changes,
        });
      } else {
        db.exec(convertedSql);
        resolve({ rows: [] });
      }
    } catch (err) {
      console.error('SQL 执行错误:', err.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      reject(err);
    }
  });
};

const getOne = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
};

const getAll = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.rows || [];
};

const execute = async (sql, params = []) => {
  return query(sql, params);
};

const init = async () => {
  console.log('初始化数据库...');
  initSqliteDb();
  console.log('数据库初始化完成');
};

module.exports = {
  init,
  query,
  getOne,
  getAll,
  execute,
  usePg: false,
};
