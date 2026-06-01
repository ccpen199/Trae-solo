const db = require("../db");
const { success } = require("../utils/response");

const getStats = (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) AS count FROM orders").get().count;
  const completedOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'completed'").get().count;
  const complaints = db.prepare("SELECT COUNT(*) AS count FROM complaints").get().count;
  const riskEvents = db.prepare("SELECT COUNT(*) AS count FROM risk_events").get().count;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  res.json(success({
    totalOrders,
    completionRate,
    complaints,
    riskEvents
  }));
};

const getTrend = (req, res) => {
  const { days = 7 } = req.query;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const total = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ?").get(dateStr).count;
    const completed = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ? AND status = 'completed'").get(dateStr).count;
    
    data.push({
      date: dateStr,
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  }
  
  res.json(success(data));
};

const getComplaintTypes = (req, res) => {
  const data = db.prepare(`
    SELECT type, COUNT(*) AS count FROM complaints GROUP BY type
  `).all();
  
  res.json(success(data));
};

const getNurseRanking = (req, res) => {
  const data = db.prepare(`
    SELECT n.id, u.name, 
           COALESCE(n.total_orders, 0) as completed_orders,
           COALESCE(n.rating, 5) as avg_rating,
           (SELECT COUNT(*) FROM complaints c 
            JOIN orders o ON o.id = c.order_id 
            WHERE o.nurse_id = n.id) as complaints
    FROM nurses n 
    JOIN users u ON n.user_id = u.id
    ORDER BY avg_rating DESC, completed_orders DESC
    LIMIT 10
  `).all();
  
  data.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  res.json(success(data));
};

const getMaterialCostsReport = (req, res) => {
  const data = db.prepare(`
    SELECT i.id, i.name, 
           COALESCE(SUM(om.quantity), 0) AS quantity,
           COALESCE(SUM(om.quantity * om.unit_price), 0) AS total_cost
    FROM inventory i 
    LEFT JOIN order_materials om ON om.inventory_id = i.id
    GROUP BY i.id 
    ORDER BY total_cost DESC 
    LIMIT 10
  `).all();
  
  res.json(success(data));
};

const getSummary = (req, res) => {
  const totals = {
    services: db.prepare("SELECT COUNT(*) AS count FROM services").get().count,
    orders: db.prepare("SELECT COUNT(*) AS count FROM orders").get().count,
    nurses: db.prepare("SELECT COUNT(*) AS count FROM nurses").get().count,
    completed_orders: db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'completed'").get().count
  };

  const statusBreakdown = db
    .prepare("SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC")
    .all();

  const riskBreakdown = db
    .prepare("SELECT risk_level, COUNT(*) AS count FROM orders GROUP BY risk_level ORDER BY count DESC")
    .all();

  const revenue = db
    .prepare(`
      SELECT COALESCE(SUM(price), 0) AS amount
      FROM orders WHERE status IN ('dispatched', 'in_progress', 'completed')
    `)
    .get().amount;

  const recentOrders = db
    .prepare(`
      SELECT o.order_no, o.status, o.scheduled_time, s.name AS service_name,
             o.patient_name, o.patient_address
      FROM orders o JOIN services s ON s.id = o.service_id
      ORDER BY o.scheduled_time DESC LIMIT 5
    `)
    .all();

  res.json(success({ totals, statusBreakdown, riskBreakdown, revenue, recentOrders }));
};

const getCompletionRate = (req, res) => {
  const { days = 7 } = req.query;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const total = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ?").get(dateStr).count;
    const completed = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ? AND status = 'completed'").get(dateStr).count;
    
    data.push({
      date: dateStr,
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  }
  
  res.json(success(data));
};

const getComplaints = (req, res) => {
  const data = db.prepare(`
    SELECT type, COUNT(*) AS count FROM complaints GROUP BY type
  `).all();
  const total = db.prepare("SELECT COUNT(*) AS count FROM complaints").get().count;
  const pending = db.prepare("SELECT COUNT(*) AS count FROM complaints WHERE status = 'pending'").get().count;
  
  res.json(success({ list: data, total, pending }));
};

const getRiskEvents = (req, res) => {
  const data = db.prepare(`
    SELECT severity, COUNT(*) AS count FROM risk_events GROUP BY severity
  `).all();
  const total = db.prepare("SELECT COUNT(*) AS count FROM risk_events").get().count;
  
  res.json(success({ list: data, total }));
};

const getNurseRatings = (req, res) => {
  const data = db.prepare(`
    SELECT n.id, u.name, n.rating, n.total_orders, n.years_of_experience
    FROM nurses n JOIN users u ON n.user_id = u.id
    ORDER BY n.rating DESC LIMIT 10
  `).all();
  
  res.json(success(data));
};

const getMaterialCosts = (req, res) => {
  const data = db.prepare(`
    SELECT i.name, COALESCE(SUM(om.quantity * om.unit_price), 0) AS total_cost,
           COALESCE(SUM(om.quantity), 0) AS total_quantity
    FROM inventory i LEFT JOIN order_materials om ON om.inventory_id = i.id
    GROUP BY i.id ORDER BY total_cost DESC LIMIT 10
  `).all();
  
  const totalCost = db.prepare(`
    SELECT COALESCE(SUM(quantity * unit_price), 0) AS total FROM order_materials
  `).get().total;
  
  res.json(success({ list: data, total_cost: totalCost }));
};

const getInventory = (req, res) => {
  const data = db.prepare("SELECT * FROM inventory ORDER BY id").all();
  res.json(success(data));
};

module.exports = { 
  getStats,
  getTrend,
  getComplaintTypes,
  getNurseRanking,
  getMaterialCostsReport,
  getSummary, 
  getCompletionRate, 
  getComplaints, 
  getRiskEvents, 
  getNurseRatings, 
  getMaterialCosts, 
  getInventory 
};
