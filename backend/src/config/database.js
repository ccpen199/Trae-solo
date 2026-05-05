const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/dormitory.db');

let db;

const convertSqlToSqlite = (sql) => {
  let converted = sql;
  
  converted = converted.replace(/\$\d+/g, '?');
  
  if (converted.toUpperCase().includes('RETURNING')) {
    converted = converted.replace(/\s+RETURNING\s+.*/i, '');
  }
  
  converted = converted.replace(
    /EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\s*\)/gi,
    "strftime('%Y', $1)"
  );
  
  converted = converted.replace(
    /EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\s*\)/gi,
    "strftime('%m', $1)"
  );
  
  converted = converted.replace(
    /ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+NOTHING/gi,
    ''
  );
  
  converted = converted.replace(/::\s*decimal/gi, '');
  
  return converted;
};

const isInsertOrReplace = (sql) => {
  const upperSql = sql.trim().toUpperCase();
  return upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE') || upperSql.startsWith('CREATE') || upperSql.startsWith('ALTER');
};

const initDatabase = () => {
  try {
    db = new Database(dbPath);
    console.log('✓ SQLite 数据库连接成功:', dbPath);
    return true;
  } catch (err) {
    console.error('✗ SQLite 数据库连接失败:', err.message);
    return false;
  }
};

const testConnection = () => {
  try {
    if (!db) initDatabase();
    const result = db.prepare('SELECT 1 as value').get();
    console.log('✓ 数据库连接测试成功');
    return true;
  } catch (err) {
    console.error('✗ 数据库连接测试失败:', err.message);
    return false;
  }
};

const query = (sql, params = []) => {
  if (!db) initDatabase();
  
  const start = Date.now();
  const convertedSql = convertSqlToSqlite(sql);
  
  try {
    const isWrite = isInsertOrReplace(sql);
    
    if (!isWrite) {
      const stmt = db.prepare(convertedSql);
      const result = params.length > 0 ? stmt.all(...params) : stmt.all();
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log(`执行查询: ${convertedSql}, 耗时: ${duration}ms, 返回 ${result.length} 行`);
      }
      return { rows: result };
    } else {
      const hasReturning = sql.toUpperCase().includes('RETURNING');
      
      const stmt = db.prepare(convertedSql);
      const info = params.length > 0 ? stmt.run(...params) : stmt.run();
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`执行语句: ${convertedSql}, 耗时: ${duration}ms, 影响 ${info.changes} 行`);
      }
      
      let returningRows = [];
      if (hasReturning && info.lastInsertRowid) {
        try {
          const tableMatch = sql.match(/INTO\s+(\w+)/i) || sql.match(/FROM\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`);
            const row = selectStmt.get(info.lastInsertRowid);
            if (row) {
              returningRows = [row];
            }
          }
        } catch (e) {
          console.log('RETURNING 模拟获取失败:', e.message);
        }
      }
      
      return { 
        rows: returningRows,
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid
      };
    }
  } catch (err) {
    console.error('SQL 执行错误:', convertedSql, err.message);
    throw err;
  }
};

const getDbInstance = () => {
  if (!db) initDatabase();
  return db;
};

module.exports = {
  initDatabase,
  testConnection,
  query,
  getDbInstance,
};