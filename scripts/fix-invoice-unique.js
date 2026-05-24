const db = require('../backend/src/db');

console.log('=== 1. 清理重复发票号 ===');
const allInvoices = db.prepare('SELECT * FROM invoices WHERE invoice_number IS NOT NULL ORDER BY id').all();
const seen = new Map();
const tx = db.transaction(() => {
  allInvoices.forEach(inv => {
    const key = inv.invoice_number;
    if (key === '') {
      db.prepare('UPDATE invoices SET invoice_number = NULL WHERE id = ?').run(inv.id);
      return;
    }
    if (seen.has(key)) {
      const newNum = `${key}_${inv.id}`;
      console.log(`  发票ID ${inv.id}: 重复发票号 '${key}' → 改为 '${newNum}'`);
      db.prepare('UPDATE invoices SET invoice_number = ? WHERE id = ?').run(newNum, inv.id);
      seen.set(key, seen.get(key) + 1);
    } else {
      seen.set(key, 1);
    }
  });
});
tx();
console.log('  ✅ 重复数据清理完成');

console.log('\n=== 2. 添加唯一索引 ===');
try {
  db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number) WHERE invoice_number IS NOT NULL').run();
  console.log('  ✅ 唯一索引创建成功');
} catch(e) {
  console.log('  ❌ 索引创建失败:', e.message);
}

console.log('\n=== 3. 验证索引 ===');
db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='invoices'").all().forEach(i => console.log('  ' + i.name + ': ' + i.sql));

console.log('\n=== 4. 验证发票号唯一性 ===');
const dup = db.prepare('SELECT invoice_number, COUNT(*) as cnt FROM invoices WHERE invoice_number IS NOT NULL GROUP BY invoice_number HAVING cnt > 1').all();
console.log('  重复发票号:', dup.length > 0 ? dup.map(d => `${d.invoice_number}(${d.cnt}次)`).join(', ') : '无');

console.log('\n✅ 完成');
