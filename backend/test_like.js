require('dotenv').config();
const path = require('path');
const { initDB, getDB } = require('./dist/db');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
initDB(dbPath);
const db = getDB();

console.log('Testing LIKE syntax...');

// 测试1: || 语法
try {
  const sql1 = "SELECT COUNT(*) as count FROM labor_orders lo WHERE lo.title LIKE '%' || ? || '%'";
  const result1 = db.prepare(sql1).get('装修');
  console.log('Test 1 (|| syntax):', result1);
} catch(e) {
  console.log('Test 1 error:', e.message);
}

// 测试2: 传统方式
try {
  const sql2 = "SELECT COUNT(*) as count FROM labor_orders lo WHERE lo.title LIKE ?";
  const result2 = db.prepare(sql2).get('%装修%');
  console.log('Test 2 (traditional):', result2);
} catch(e) {
  console.log('Test 2 error:', e.message);
}

// 测试3: 多字段 OR 查询
try {
  const sql3 = `
    SELECT COUNT(*) as count FROM labor_orders lo 
    WHERE 1=1 AND (
      lo.title LIKE '%' || ? || '%' OR
      lo.description LIKE '%' || ? || '%' OR
      lo.category LIKE '%' || ? || '%'
    )`;
  const result3 = db.prepare(sql3).get('装修', '装修', '装修');
  console.log('Test 3 (multi-field OR):', result3);
} catch(e) {
  console.log('Test 3 error:', e.message);
}
