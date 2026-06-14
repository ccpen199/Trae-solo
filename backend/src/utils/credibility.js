
const db = require('../database/db');

const calculateReferrerCredibility = (userId) => {
  const user = db.prepare(`
    SELECT total_recommendations, success_hires, credit_score
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) return null;

  const hitRate = user.total_recommendations > 0 ? user.success_hires / user.total_recommendations : 0;
  
  const recentRecs = db.prepare(`
    SELECT COUNT(*) as count,
           SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) as success
    FROM recommendations
    WHERE referrer_id = ? AND created_at >= datetime('now', '-90 days')
  `).get(userId);

  const recentHitRate = recentRecs.count > 0 ? recentRecs.success / recentRecs.count : 0;

  const avgTimeToHire = db.prepare(`
    SELECT AVG(julianday(updated_at) - julianday(created_at)) as avg_days
    FROM recommendations
    WHERE referrer_id = ? AND status = 'hired'
  `).get(userId);

  const factors = {
    totalRecommendations: user.total_recommendations,
    successHires: user.success_hires,
    overallHitRate: hitRate,
    recentHitRate,
    avgTimeToHire: avgTimeToHire.avg_days || 0,
    baseCreditScore: user.credit_score
  };

  let score = user.credit_score * 0.3;
  score += Math.min(hitRate * 40, 40);
  score += Math.min(recentHitRate * 20, 20);
  score += Math.min(user.success_hires * 0.5, 10);
  score = Math.min(Math.max(score, 0), 100);

  const exposureWeight = 0.5 + (score / 100) * 1.5;

  db.prepare(`
    UPDATE users 
    SET credit_score = ?, exposure_weight = ?
    WHERE id = ?
  `).run(Math.round(score), exposureWeight, userId);

  db.prepare(`
    INSERT INTO credibility_scores (user_id, score_type, score, factors, period)
    VALUES (?, 'referrer', ?, ?, '90d')
  `).run(userId, score, JSON.stringify(factors));

  return { score, exposureWeight, factors };
};

const calculateCandidateCredibility = (userId) => {
  const user = db.prepare(`
    SELECT credit_score FROM users WHERE id = ?
  `).get(userId);

  const jobs = db.prepare(`
    SELECT r.status, r.created_at, p.rating
    FROM recommendations r
    LEFT JOIN probation_feedbacks p ON p.recommendation_id = r.id
    WHERE r.candidate_id = ?
  `).all(userId);

  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'hired');
  const dropoutJobs = jobs.filter(j => j.status === 'rejected' || j.status === 'candidate_withdrew');
  const avgRating = completedJobs.length > 0 
    ? completedJobs.reduce((sum, j) => sum + (j.rating || 3), 0) / completedJobs.length 
    : 3;

  const fulfillmentRate = jobs.length > 0 ? completedJobs.length / jobs.length : 0;
  const dropoutRate = jobs.length > 0 ? dropoutJobs.length / jobs.length : 0;

  const factors = {
    totalApplications: jobs.length,
    completedJobs: completedJobs.length,
    dropoutJobs: dropoutJobs.length,
    fulfillmentRate,
    dropoutRate,
    avgRating
  };

  let score = (user?.credit_score || 70) * 0.3;
  score += fulfillmentRate * 40;
  score += avgRating * 10;
  score -= dropoutRate * 20;
  score = Math.min(Math.max(score, 0), 100);

  db.prepare(`
    UPDATE users 
    SET credit_score = ?
    WHERE id = ?
  `).run(Math.round(score), userId);

  db.prepare(`
    INSERT INTO credibility_scores (user_id, score_type, score, factors, period)
    VALUES (?, 'candidate', ?, ?, 'all')
  `).run(userId, score, JSON.stringify(factors));

  return { score, factors };
};

module.exports = { calculateReferrerCredibility, calculateCandidateCredibility };
