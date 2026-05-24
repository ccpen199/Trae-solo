const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    total_venues: db.prepare("SELECT COUNT(*) as count FROM venues WHERE status = 'active'").get().count,
    total_courts: db.prepare("SELECT COUNT(*) as count FROM courts WHERE status = 'active'").get().count,
    total_games: db.prepare('SELECT COUNT(*) as count FROM games').get().count,
    active_games: db.prepare("SELECT COUNT(*) as count FROM games WHERE status IN ('recruiting', 'confirmed')").get().count,
    completed_games: db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'completed'").get().count,
    pending_exceptions: db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status = 'pending'").get().count,
    total_revenue: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get().total,
    deposit_revenue: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND payment_type = 'deposit'").get().total,
    fee_revenue: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND payment_type = 'aa_fee'").get().total
  };
  res.json(stats);
});

router.get('/games-by-sport', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const sql = "SELECT sport_type, COUNT(*) as game_count, " +
              "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count, " +
              "COALESCE(SUM(total_fee), 0) as total_revenue " +
              "FROM games GROUP BY sport_type ORDER BY game_count DESC";
  const data = db.prepare(sql).all();
  res.json(data);
});

router.get('/games-daily', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const { start_date, end_date } = req.query;
  let sql = "SELECT DATE(g.created_at) as date, COUNT(*) as new_games, " +
            "SUM(CASE WHEN g.status = 'completed' THEN 1 ELSE 0 END) as completed_games, " +
            "COALESCE(SUM(g.total_fee), 0) as revenue " +
            "FROM games g WHERE 1=1";
  const params = [];
  
  if (start_date) {
    sql += " AND DATE(g.created_at) >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND DATE(g.created_at) <= ?";
    params.push(end_date);
  }
  
  sql += " GROUP BY DATE(g.created_at) ORDER BY date DESC LIMIT 30";
  const data = db.prepare(sql).all(...params);
  res.json(data);
});

router.get('/venue-usage', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const sql = "SELECT v.id, v.name as venue_name, COUNT(DISTINCT g.id) as game_count, " +
              "COUNT(DISTINCT gm.user_id) as unique_users, " +
              "COALESCE(SUM(g.total_fee), 0) as total_revenue " +
              "FROM venues v " +
              "JOIN courts c ON v.id = c.venue_id " +
              "LEFT JOIN games g ON c.id = g.court_id " +
              "LEFT JOIN game_members gm ON g.id = gm.game_id " +
              "WHERE v.status = 'active' " +
              "GROUP BY v.id, v.name ORDER BY game_count DESC";
  const data = db.prepare(sql).all();
  res.json(data);
});

router.get('/user-activity', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const sql = "SELECT u.id, u.nickname, u.username, u.role, u.level, u.credit_score, " +
              "COUNT(DISTINCT g.id) as organized_games, " +
              "COUNT(DISTINCT gm.id) as joined_games, " +
              "COALESCE(SUM(p.amount), 0) as total_paid " +
              "FROM users u " +
              "LEFT JOIN games g ON u.id = g.organizer_id " +
              "LEFT JOIN game_members gm ON u.id = gm.user_id " +
              "LEFT JOIN payments p ON u.id = p.user_id " +
              "GROUP BY u.id ORDER BY joined_games DESC LIMIT ? OFFSET ?";
  const data = db.prepare(sql).all(Number(pageSize), (page - 1) * pageSize);
  res.json(data);
});

router.get('/credit-ranking', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const sql = "SELECT u.id, u.nickname, u.username, u.level, u.credit_score, " +
              "(SELECT COUNT(*) FROM reviews WHERE target_user_id = u.id) as review_count " +
              "FROM users u " +
              "WHERE u.status = 'active' " +
              "ORDER BY u.credit_score DESC LIMIT 20";
  const data = db.prepare(sql).all();
  res.json(data);
});

module.exports = router;
