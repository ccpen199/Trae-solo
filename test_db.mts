import { getDb, initDb } from './api/db.js';

console.log('开始初始化数据库...');
try {
  initDb();
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as cnt FROM properties').get() as any;
  console.log('数据库连接成功!');
  console.log('房源总数:', count.cnt);
  const rows = db.prepare('SELECT id, title, price, rooms FROM properties LIMIT 3').all();
  console.log('前3套房源:', rows);
  
  console.log('\n=== 测试带关键词的查询 ===');
  const keyword = '西溪';
  const params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
  const sql = `
    SELECT COUNT(*) as cnt FROM properties p
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN agents a ON p.agent_id = a.id
    WHERE p.status = 'active'
    AND (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR c.district LIKE ? OR c.school_district LIKE ? OR a.name LIKE ?)
  `;
  const result = db.prepare(sql).get(...params) as any;
  console.log('关键词"西溪"的结果数:', result.cnt);
  
} catch(e: any) {
  console.error('数据库错误:', e.message);
  console.error('堆栈:', e.stack);
}
