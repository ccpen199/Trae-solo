import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  const totalParts = db.prepare('SELECT COUNT(*) as count FROM spare_parts WHERE status = 1').get().count;
  const totalStock = db.prepare('SELECT COALESCE(SUM(available_qty), 0) as total FROM stock').get().total;
  const stockValue = db.prepare('SELECT COALESCE(SUM(available_qty * unit_price), 0) as value FROM stock').get().value;

  const lowStockCount = db.prepare(`
    SELECT COUNT(DISTINCT st.part_id) as count
    FROM stock st
    JOIN spare_parts sp ON st.part_id = sp.id
    WHERE st.available_qty < sp.safety_stock
  `).get().count;

  const pendingIn = db.prepare("SELECT COUNT(*) as count FROM stock_in WHERE status = 'pending'").get().count;
  const pendingOut = db.prepare("SELECT COUNT(*) as count FROM stock_out WHERE status = 'pending'").get().count;

  res.json({
    success: true,
    data: {
      totalParts,
      totalStock,
      stockValue,
      lowStockCount,
      pendingIn,
      pendingOut
    }
  });
});

router.get('/low-stock', (req, res) => {
  const list = db.prepare(`
    SELECT sp.id, sp.sku, sp.name, sp.model, sp.safety_stock,
           COALESCE(SUM(st.available_qty), 0) as current_stock,
           sp.unit, sp.category
    FROM spare_parts sp
    LEFT JOIN stock st ON sp.id = st.part_id
    WHERE sp.status = 1
    GROUP BY sp.id
    HAVING current_stock < sp.safety_stock
    ORDER BY current_stock ASC
    LIMIT 20
  `).all();

  res.json({ success: true, data: list });
});

router.get('/slow-moving', (req, res) => {
  const list = db.prepare(`
    SELECT sp.id, sp.sku, sp.name, sp.model,
           COALESCE(SUM(st.available_qty), 0) as stock_qty,
           COALESCE(SUM(st.available_qty * st.unit_price), 0) as stock_value,
           (
             SELECT COALESCE(SUM(ABS(qty_change)), 0)
             FROM stock_transactions t
             WHERE t.part_id = sp.id AND t.trans_type = 'out'
               AND t.created_at >= datetime('now', '-90 days')
           ) as usage_qty_90d
    FROM spare_parts sp
    LEFT JOIN stock st ON sp.id = st.part_id
    WHERE sp.status = 1
    GROUP BY sp.id
    HAVING stock_qty > 0 AND usage_qty_90d < stock_qty * 0.1
    ORDER BY stock_value DESC
    LIMIT 20
  `).all();

  res.json({ success: true, data: list });
});

router.get('/cost-analysis', (req, res) => {
  const byCategory = db.prepare(`
    SELECT sp.category,
           COUNT(*) as part_count,
           COALESCE(SUM(st.available_qty), 0) as total_qty,
           COALESCE(SUM(st.available_qty * st.unit_price), 0) as total_value
    FROM spare_parts sp
    LEFT JOIN stock st ON sp.id = st.part_id
    WHERE sp.status = 1
    GROUP BY sp.category
    ORDER BY total_value DESC
  `).all();

  const monthlyTrend = db.prepare(`
    SELECT strftime('%Y-%m', t.created_at) as month,
           SUM(CASE WHEN t.trans_type = 'in' THEN t.qty_change * t.unit_price ELSE 0 END) as in_cost,
           SUM(CASE WHEN t.trans_type = 'out' THEN ABS(t.qty_change * t.unit_price) ELSE 0 END) as out_cost
    FROM stock_transactions t
    WHERE t.created_at >= datetime('now', '-6 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  res.json({ success: true, data: { byCategory, monthlyTrend } });
});

router.get('/work-order-stats', (req, res) => {
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM work_orders
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY status
  `).all();

  const engineerStats = db.prepare(`
    SELECT u.name as engineer,
           COUNT(wo.id) as total_orders,
           SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM work_orders wo
    LEFT JOIN users u ON wo.engineer_id = u.id
    WHERE wo.created_at >= datetime('now', '-30 days')
    GROUP BY u.id, u.name
    ORDER BY total_orders DESC
    LIMIT 10
  `).all();

  const topParts = db.prepare(`
    SELECT sp.id, sp.sku, sp.name,
           COUNT(so.id) as use_count,
           SUM(so.quantity) as total_qty
    FROM stock_out so
    JOIN spare_parts sp ON so.part_id = sp.id
    WHERE so.status = 'completed' AND so.created_at >= datetime('now', '-30 days')
    GROUP BY sp.id
    ORDER BY use_count DESC
    LIMIT 10
  `).all();

  res.json({ success: true, data: { statusStats, engineerStats, topParts } });
});

router.get('/supplier-quality', (req, res) => {
  const list = db.prepare(`
    SELECT s.id, s.code, s.name, s.rating,
           COUNT(si.id) as total_deliveries,
           SUM(CASE WHEN si.inspection_result = 'fail' THEN 1 ELSE 0 END) as failed_count,
           ROUND(
             CASE WHEN COUNT(si.id) > 0
                  THEN SUM(CASE WHEN si.inspection_result = 'pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(si.id)
                  ELSE 100
             END, 2
           ) as pass_rate
    FROM suppliers s
    LEFT JOIN stock_in si ON s.id = si.supplier_id AND si.inspection_result IS NOT NULL
    GROUP BY s.id
    ORDER BY pass_rate ASC
  `).all();

  res.json({ success: true, data: list });
});

export default router;
