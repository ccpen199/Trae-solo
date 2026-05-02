const { getDb, saveDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const RATING_THRESHOLD_FOR_MAINTENANCE = 3;

function createReview(sessionId, userId, rating, comment, images) {
  const sql = getDb();
  
  const sessionResult = sql.exec(
    'SELECT * FROM charging_sessions WHERE id = ? AND user_id = ?',
    [sessionId, userId]
  );
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    throw new Error('Session not found or not owned by user');
  }
  
  const sessionColumns = sessionResult[0].columns;
  const sessionRow = sessionResult[0].values[0];
  const session = {};
  sessionColumns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  const existingReview = sql.exec(
    'SELECT * FROM reviews WHERE session_id = ?',
    [sessionId]
  );
  
  if (existingReview.length > 0 && existingReview[0].values.length > 0) {
    throw new Error('Review already exists for this session');
  }
  
  const reviewId = uuidv4();
  const now = new Date().toISOString();
  
  sql.run(`
    INSERT INTO reviews (id, session_id, user_id, rating, comment, images)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    reviewId, sessionId, userId, rating, comment, 
    Array.isArray(images) ? JSON.stringify(images) : (images || null)
  ]);
  
  saveDb();
  
  if (rating <= RATING_THRESHOLD_FOR_MAINTENANCE) {
    const chargerResult = sql.exec(
      'SELECT c.id, c.station_id FROM chargers c WHERE c.id = ?',
      [session.charger_id]
    );
    
    if (chargerResult.length > 0 && chargerResult[0].values.length > 0) {
      const maintenanceOrderId = uuidv4();
      sql.run(`
        INSERT INTO maintenance_orders (
          id, charger_id, station_id, user_id, type, description, status, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        maintenanceOrderId, session.charger_id, chargerResult[0].values[0][1],
        userId, 'REVIEW_TRIGGERED',
        `低评分触发巡检: 评分 ${rating} 星, 评价: ${comment || '无评价内容'}`,
        'pending', 'normal'
      ]);
      
      saveDb();
    }
  }
  
  return {
    reviewId,
    sessionId,
    userId,
    rating,
    comment,
    images,
    createdAt: now
  };
}

function getReviewBySession(sessionId) {
  const sql = getDb();
  
  const result = sql.exec(
    'SELECT * FROM reviews WHERE session_id = ?',
    [sessionId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const review = {};
  columns.forEach((col, idx) => {
    review[col] = row[idx];
  });
  
  if (review.images) {
    try {
      review.images = JSON.parse(review.images);
    } catch (e) {
      // keep as is
    }
  }
  
  return review;
}

function getUserReviews(userId) {
  const sql = getDb();
  
  const result = sql.exec(`
    SELECT r.*, 
      cs.charger_id, cs.total_energy, cs.total_amount, cs.start_time,
      c.charger_code, s.name as station_name
    FROM reviews r
    JOIN charging_sessions cs ON r.session_id = cs.id
    JOIN chargers c ON cs.charger_id = c.id
    JOIN stations s ON c.station_id = s.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `, [userId]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    
    if (obj.images) {
      try {
        obj.images = JSON.parse(obj.images);
      } catch (e) {
        // keep as is
      }
    }
    
    return obj;
  });
}

function getStationReviews(stationId) {
  const sql = getDb();
  
  const result = sql.exec(`
    SELECT r.*,
      cs.total_energy, cs.start_time,
      u.name as user_name, c.charger_code
    FROM reviews r
    JOIN charging_sessions cs ON r.session_id = cs.id
    JOIN chargers c ON cs.charger_id = c.id
    JOIN users u ON r.user_id = u.id
    WHERE c.station_id = ?
    ORDER BY r.created_at DESC
  `, [stationId]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return {
      reviews: [],
      avgRating: 0,
      totalReviews: 0
    };
  }
  
  const columns = result[0].columns;
  const reviews = result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    
    if (obj.images) {
      try {
        obj.images = JSON.parse(obj.images);
      } catch (e) {
        // keep as is
      }
    }
    
    return obj;
  });
  
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
    : 0;
  
  return {
    reviews,
    avgRating: Number(avgRating.toFixed(1)),
    totalReviews: reviews.length
  };
}

module.exports = {
  createReview,
  getReviewBySession,
  getUserReviews,
  getStationReviews,
  RATING_THRESHOLD_FOR_MAINTENANCE
};
