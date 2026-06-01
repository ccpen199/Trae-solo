const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

try {
  db.pragma('foreign_keys = OFF');
  
  const negotiation = db.prepare('SELECT * FROM negotiations LIMIT 1').get();
  if (!negotiation) {
    console.log('没有谈判数据');
    return;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO exception_handlings 
    (id, negotiation_id, exception_type, title, description, severity, status, handle_result, detected_at, is_auto_blocked, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    negotiation.id,
    'price',
    '价格严重偏离测试',
    '测试异常：报价偏离历史平均25%，触发系统自动拦截',
    'high',
    'auto_blocked',
    'auto_blocked',
    now,
    1,
    now
  );
  
  db.prepare(`
    UPDATE negotiations SET status = 'blocked', updated_at = ? WHERE id = ?
  `).run(now, negotiation.id);
  
  console.log('测试异常创建成功!');
  console.log('谈判ID:', negotiation.id);
  console.log('异常ID:', id);
  console.log('谈判状态已更新为: blocked');
} catch (e) {
  console.error('创建失败:', e.message);
}
db.close();
