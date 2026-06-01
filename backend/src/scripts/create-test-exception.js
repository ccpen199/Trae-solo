const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

try {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO exception_handlings 
    (id, negotiation_id, exception_type, title, description, severity, status, detected_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    'neg_001',
    'price',
    '价格偏离预警: 测试异常',
    '这是一个测试异常，用于验证页面显示功能。报价偏离历史平均8.5%',
    'medium',
    'pending',
    now,
    now
  );
  
  console.log('测试异常创建成功! ID:', id);
  
  const exceptions = db.prepare('SELECT * FROM exception_handlings').all();
  console.log('当前异常数量:', exceptions.length);
  console.log('异常列表:', JSON.stringify(exceptions, null, 2));
} catch (e) {
  console.error('创建失败:', e.message);
}
db.close();
