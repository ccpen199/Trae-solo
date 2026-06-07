const db = require('../src/db');

console.log('=== 重新生成排名数据 ===');

db.exec('DELETE FROM rankings');
console.log('已清空旧排名数据');

const brands = db.prepare('SELECT id, name, vote_score, sales_score, reputation_score FROM brands').all();
const categories = db.prepare('SELECT id FROM ranking_categories WHERE is_active = 1').all();
const sw = { vote: 0.3, sales: 0.4, reputation: 0.3 };

categories.forEach(cat => {
  const sorted = [...brands].sort((a, b) => {
    const sa = a.vote_score * sw.vote + a.sales_score * sw.sales + a.reputation_score * sw.reputation;
    const sb = b.vote_score * sw.vote + b.sales_score * sw.sales + b.reputation_score * sw.reputation;
    return sb - sa;
  });
  
  sorted.forEach((brand, idx) => {
    const fs = brand.vote_score * sw.vote + brand.sales_score * sw.sales + brand.reputation_score * sw.reputation;
    db.prepare(`
      INSERT INTO rankings (brand_id, category_id, rank_position, final_score, vote_score, sales_score, reputation_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(brand.id, cat.id, idx + 1, fs.toFixed(2), brand.vote_score, brand.sales_score, brand.reputation_score);
  });
  
  console.log('分类 ' + cat.id + ': ' + sorted.length + ' 条排名');
});

db.prepare('UPDATE ranking_categories SET last_calculated_at = CURRENT_TIMESTAMP WHERE is_active = 1').run();
console.log('=== 排名数据生成完成 ===');
db.close();
