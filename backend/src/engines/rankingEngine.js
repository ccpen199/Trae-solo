const db = require('../db');

class RankingEngine {
  constructor() {
    this.voteWeight = parseFloat(process.env.RANKING_VOTE_WEIGHT) || 0.3;
    this.salesWeight = parseFloat(process.env.RANKING_SALES_WEIGHT) || 0.4;
    this.reputationWeight = parseFloat(process.env.RANKING_REPUTATION_WEIGHT) || 0.3;
  }

  normalize(values) {
    if (!values || values.length === 0) return [];
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max === min) return values.map(() => 50);
    return values.map(v => ((v - min) / (max - min)) * 100);
  }

  calculateBrandScores(brands) {
    const votes = brands.map(b => b.vote_count || 0);
    const sales = brands.map(b => b.sales_volume || 0);
    const reputations = brands.map(b => b.reputation_score || 0);

    const normalizedVotes = this.normalize(votes);
    const normalizedSales = this.normalize(sales);
    const normalizedReputations = this.normalize(reputations);

    return brands.map((brand, index) => {
      const voteScore = normalizedVotes[index];
      const salesScore = normalizedSales[index];
      const reputationScore = normalizedReputations[index];
      const finalScore = voteScore * this.voteWeight +
                         salesScore * this.salesWeight +
                         reputationScore * this.reputationWeight;

      return {
        ...brand,
        vote_score: voteScore,
        sales_score: salesScore,
        reputation_score: reputationScore,
        final_score: finalScore
      };
    });
  }

  calculateRankings(categoryId, period = '2024-Q1') {
    const category = db.prepare('SELECT * FROM ranking_categories WHERE id = ?').get(categoryId);
    if (!category) throw new Error('Category not found');

    const brands = db.prepare(`
      SELECT b.*, 
             (SELECT COUNT(*) FROM votes v WHERE v.brand_id = b.id) as vote_count,
             (SELECT COALESCE(SUM(monthly_sales), 0) FROM brand_online_shops s WHERE s.brand_id = b.id) as sales_volume,
             (SELECT COALESCE(AVG(sentiment_score), 0) * 100 FROM brand_sentiments s WHERE s.brand_id = b.id) as reputation_score
      FROM brands b
      WHERE b.status = 'active'
    `).all();

    const scoredBrands = this.calculateBrandScores(brands);
    scoredBrands.sort((a, b) => b.final_score - a.final_score);

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO rankings 
      (category_id, brand_id, rank_position, final_score, vote_score, sales_score, reputation_score, period, expert_adjustment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT expert_adjustment FROM rankings WHERE category_id = ? AND brand_id = ? AND period = ?), 0))
    `);

    const transaction = db.transaction((brandsList) => {
      brandsList.forEach((brand, index) => {
        const finalScoreWithAdjustment = brand.final_score + 
          (db.prepare('SELECT expert_adjustment FROM rankings WHERE category_id = ? AND brand_id = ? AND period = ?')
            .get(categoryId, brand.id, period)?.expert_adjustment || 0);
        
        insertStmt.run(
          categoryId, brand.id, index + 1,
          Math.max(0, Math.min(100, finalScoreWithAdjustment)),
          brand.vote_score, brand.sales_score, brand.reputation_score,
          period, categoryId, brand.id, period
        );
      });
    });

    transaction(scoredBrands);

    db.prepare('UPDATE ranking_categories SET last_calculated_at = CURRENT_TIMESTAMP WHERE id = ?').run(categoryId);

    return scoredBrands.slice(0, 10);
  }

  getRankings(categoryId, period = '2024-Q1', limit = 10) {
    return db.prepare(`
      SELECT r.*, b.name as brand_name, b.logo_url, b.industry, b.level,
             b.vote_count, b.sales_volume, b.reputation_score
      FROM rankings r
      JOIN brands b ON r.brand_id = b.id
      WHERE r.category_id = ? AND r.period = ?
      ORDER BY r.rank_position ASC
      LIMIT ?
    `).all(categoryId, period, limit);
  }

  compareBrands(brandIds, categoryId) {
    return db.prepare(`
      SELECT b.*, r.final_score, r.vote_score, r.sales_score, r.reputation_score,
             r.rank_position, rc.name as category_name
      FROM brands b
      LEFT JOIN rankings r ON r.brand_id = b.id AND r.category_id = ?
      LEFT JOIN ranking_categories rc ON rc.id = r.category_id
      WHERE b.id IN (${brandIds.map(() => '?').join(',')})
    `).all(categoryId, ...brandIds);
  }
}

module.exports = new RankingEngine();
