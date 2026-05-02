const { get, all, run } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class LawyerRanking {
  constructor() {
    this.ratingWeights = {
      reviewScore: 0.6,
      completionRate: 0.15,
      practiceYears: 0.1,
      responseTime: 0.1,
      disputeRate: 0.05
    };
  }

  async calculateRating(lawyerId) {
    const lawyer = await get('SELECT * FROM lawyers WHERE id = ?', [lawyerId]);
    if (!lawyer) {
      return { success: false, message: '律师不存在' };
    }

    const metrics = await this.collectMetrics(lawyerId);
    const componentScores = this.calculateComponentScores(metrics, lawyer);
    const weightedScore = this.calculateWeightedScore(componentScores);
    const finalRating = this.normalizeRating(weightedScore);

    await run(
      'UPDATE lawyers SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [finalRating, lawyerId]
    );

    return {
      success: true,
      lawyerId,
      finalRating,
      components: componentScores,
      metrics
    };
  }

  async collectMetrics(lawyerId) {
    const reviews = await all(`
      SELECT r.* FROM reviews r
      WHERE r.lawyer_id = ?
      ORDER BY r.created_at DESC
    `, [lawyerId]);

    const disputes = await all(`
      SELECT d.* FROM disputes d
      JOIN consultations c ON d.consultation_id = c.id
      WHERE c.lawyer_id = ?
    `, [lawyerId]);

    const recentConsultations = await all(`
      SELECT * FROM consultations
      WHERE lawyer_id = ? AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 10
    `, [lawyerId]);

    const messages = await all(`
      SELECT m.*, c.lawyer_id FROM messages m
      JOIN consultations c ON m.consultation_id = c.id
      WHERE c.lawyer_id = ? AND m.sender_role = 'lawyer'
      ORDER BY m.created_at ASC
    `, [lawyerId]);

    return {
      reviews,
      disputes,
      recentConsultations,
      messages,
      totalReviews: reviews.length,
      totalDisputes: disputes.length
    };
  }

  calculateComponentScores(metrics, lawyer) {
    const { reviews, disputes, totalReviews, totalDisputes, messages } = metrics;

    let reviewScore = 4.0;
    if (reviews.length > 0) {
      const recentReviews = reviews.slice(0, 20);
      const avgRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      
      const recencyBonus = reviews.length > 10 ? 0.2 : 0;
      reviewScore = Math.min(5.0, avgRating + recencyBonus);
    }

    const completionRate = lawyer.total_consultations > 0
      ? lawyer.completed_consultations / lawyer.total_consultations
      : 0.8;

    let avgResponseTime = 300;
    if (messages.length >= 2) {
      let totalResponseTime = 0;
      let responseCount = 0;
      
      for (let i = 1; i < messages.length; i++) {
        const prevMsg = messages[i - 1];
        const currMsg = messages[i];
        
        if (prevMsg.sender_role !== 'lawyer' && currMsg.sender_role === 'lawyer') {
          const timeDiff = (new Date(currMsg.created_at) - new Date(prevMsg.created_at)) / 1000;
          totalResponseTime += Math.min(timeDiff, 3600);
          responseCount++;
        }
      }
      
      if (responseCount > 0) {
        avgResponseTime = totalResponseTime / responseCount;
      }
    }

    const responseScore = avgResponseTime < 60 ? 1.0 :
                          avgResponseTime < 300 ? 0.8 :
                          avgResponseTime < 900 ? 0.6 : 0.4;

    const disputeRate = lawyer.completed_consultations > 0
      ? totalDisputes / lawyer.completed_consultations
      : 0;
    const disputeScore = Math.max(0, 1 - disputeRate * 5);

    const practiceScore = Math.min(1.0, lawyer.practice_years / 20);

    return {
      reviewScore,
      completionRateScore: completionRate,
      practiceScore,
      responseScore,
      disputeScore
    };
  }

  calculateWeightedScore(components) {
    const { reviewScore, completionRateScore, practiceScore, responseScore, disputeScore } = components;
    const { ratingWeights } = this;

    return (
      (reviewScore / 5) * ratingWeights.reviewScore +
      completionRateScore * ratingWeights.completionRate +
      practiceScore * ratingWeights.practiceYears +
      responseScore * ratingWeights.responseTime +
      disputeScore * ratingWeights.disputeRate
    );
  }

  normalizeRating(weightedScore) {
    let rating = 2.0 + weightedScore * 3.0;
    return Math.max(1.0, Math.min(5.0, rating));
  }

  async applyReview(lawyerId, reviewId, rating) {
    const weightingFactor = this.calculateWeightingFactor(rating);

    await run(
      `INSERT INTO lawyer_ratings (id, lawyer_id, review_id, rating_score, weighting_factor, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), lawyerId, reviewId, rating, weightingFactor]
    );

    return await this.calculateRating(lawyerId);
  }

  calculateWeightingFactor(rating) {
    if (rating >= 4) return 1.5;
    if (rating >= 3) return 1.0;
    if (rating >= 2) return 0.8;
    return 0.5;
  }

  async recalculateAfterDispute(lawyerId, disputeId) {
    return await this.calculateRating(lawyerId);
  }

  async getLawyerRankings(category = null, limit = 10) {
    let query = `
      SELECT l.*, u.username, u.real_name, u.avatar_url,
             (l.completed_consultations * 1.0 / MAX(l.total_consultations, 1)) as completion_ratio
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE l.license_verified = 1
    `;
    
    const params = [];
    
    if (category) {
      query += ` AND JSON_EXTRACT(l.specializations, '$') LIKE ?`;
      params.push(`%"${category}"%`);
    }

    query += `
      ORDER BY l.rating DESC, completion_ratio DESC, l.total_consultations DESC
      LIMIT ?
    `;
    params.push(limit);

    return await all(query, params);
  }
}

module.exports = new LawyerRanking();
