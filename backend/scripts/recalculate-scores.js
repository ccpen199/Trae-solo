const db = require('../src/db');

console.log('=== 开始重新计算品牌分值... ===');

const brands = db.prepare("SELECT id, name, sales_volume, reputation_score, vote_count FROM brands WHERE status = 'active'").all();
console.log(`找到 ${brands.length} 个品牌`);

const scoreWeights = {
  vote: 0.3,
  sales: 0.4,
  reputation: 0.3
};

function normalize(values) {
  if (values.length === 0) return {};
  const min = Math.min(...values);
  const max = Math.max(...values);
  const result = {};
  values.forEach((v, i) => {
    result[i] = max === min ? 50 : ((v - min) / (max - min)) * 100;
  });
  return result;
}

const voteValues = brands.map(b => b.vote_count || 0);
const salesValues = brands.map(b => b.sales_volume || 0);
const reputationValues = brands.map(b => b.reputation_score || 0);

const voteScores = normalize(voteValues);
const salesScores = normalize(salesValues);
const reputationScores = normalize(reputationValues);

brands.forEach((brand, idx) => {
  const voteScore = voteScores[idx];
  const salesScore = salesScores[idx];
  const reputationScore = reputationScores[idx];
  const overallScore = voteScore * scoreWeights.vote + salesScore * scoreWeights.sales + reputationScore * scoreWeights.reputation;

  db.prepare(`
    UPDATE brands
    SET overall_score = ?,
        vote_score = ?,
        sales_score = ?,
        reputation_score = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    overallScore.toFixed(2),
    voteScore.toFixed(2),
    salesScore.toFixed(2),
    reputationScore.toFixed(2),
    brand.id
  );

  console.log(`${brand.name}: 投票=${voteScore.toFixed(1)}, 销量=${salesScore.toFixed(1)}, 口碑=${reputationScore.toFixed(1)}, 总分=${overallScore.toFixed(1)}`);
});

console.log('\n=== 生成排名数据... ===');

const categories = db.prepare("SELECT id FROM ranking_categories WHERE is_active = 1").all();

categories.forEach(cat => {
  const catBrands = brands.map((b, idx) => ({
    ...b,
    vote_score: voteScores[idx],
    sales_score: salesScores[idx],
    reputation_score: reputationScores[idx]
  }));
  
  const ranked = catBrands.sort((a, b) => {
    const scoreA = a.vote_score * scoreWeights.vote + a.sales_score * scoreWeights.sales + a.reputation_score * scoreWeights.reputation;
    const scoreB = b.vote_score * scoreWeights.vote + b.sales_score * scoreWeights.sales + b.reputation_score * scoreWeights.reputation;
    return scoreB - scoreA;
  });

  ranked.forEach((brand, rankIdx) => {
    const finalScore = brand.vote_score * scoreWeights.vote + brand.sales_score * scoreWeights.sales + brand.reputation_score * scoreWeights.reputation;
    
    const existing = db.prepare("SELECT id FROM rankings WHERE brand_id = ? AND category_id = ?").get(brand.id, cat.id);
    
    if (existing) {
      db.prepare(`
        UPDATE rankings
        SET rank_position = ?,
            final_score = ?,
            vote_score = ?,
            sales_score = ?,
            reputation_score = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(rankIdx + 1, finalScore.toFixed(2), brand.vote_score.toFixed(2), brand.sales_score.toFixed(2), brand.reputation_score.toFixed(2), existing.id);
    } else {
      db.prepare(`
        INSERT INTO rankings (brand_id, category_id, rank_position, final_score, vote_score, sales_score, reputation_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(brand.id, cat.id, rankIdx + 1, finalScore.toFixed(2), brand.vote_score.toFixed(2), brand.sales_score.toFixed(2), brand.reputation_score.toFixed(2));
    }
  });
  
  console.log(`分类 ${cat.id}: 生成 ${ranked.length} 条排名`);
});

db.prepare("UPDATE ranking_categories SET last_calculated_at = CURRENT_TIMESTAMP WHERE is_active = 1").run();

console.log('\n=== 计算完成！ ===');
db.close();