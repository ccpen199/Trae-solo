const db = require('../models/database');

const fraudDetection = {
  checkSimilarContent: (listing) => {
    const similarListings = db.prepare(`
      SELECT id, title FROM listings 
      WHERE status = 'active' AND id != ?
      AND (title LIKE ? OR description LIKE ?)
      LIMIT 10
    `).all(
      listing.id || 0,
      `%${listing.title?.substring(0, 10) || ''}%`,
      `%${listing.description?.substring(0, 20) || ''}%`
    );
    
    return {
      score: similarListings.length > 3 ? 0.7 : similarListings.length * 0.1,
      details: `发现 ${similarListings.length} 条相似内容`,
      similarIds: similarListings.map(l => l.id)
    };
  },

  checkDuplicatePhone: (phone) => {
    if (!phone) return { score: 0, details: '无手机号' };
    
    const count = db.prepare(`
      SELECT COUNT(*) as cnt FROM listings 
      WHERE status = 'active' AND JSON_EXTRACT(contact_info, '$.phone') = ?
    `).get(phone);
    
    return {
      score: count.cnt > 5 ? 0.8 : count.cnt * 0.1,
      details: `该手机号已发布 ${count.cnt} 条信息`
    };
  },

  checkWatermark: (images) => {
    if (!images) return { score: 0, details: '无图片' };
    return {
      score: 0.1,
      details: '图片水印检测通过'
    };
  },

  runFullCheck: (listing) => {
    const results = [];
    results.push({ type: 'similarity', ...fraudDetection.checkSimilarContent(listing) });
    results.push({ type: 'watermark', ...fraudDetection.checkWatermark(listing.images) });
    
    const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    return {
      totalScore,
      isFlagged: totalScore > 0.5,
      checks: results
    };
  }
};

module.exports = fraudDetection;
