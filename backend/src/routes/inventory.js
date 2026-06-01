import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/summary', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM linen_items').all().map(r => r.category);
  
  const summary = categories.map(category => {
    const available = db.prepare("SELECT COUNT(*) as count FROM linen_items WHERE category = ? AND status = 'available'").get(category).count;
    const in_wash = db.prepare("SELECT COUNT(*) as count FROM linen_items WHERE category = ? AND status = 'in_wash'").get(category).count;
    const in_use = db.prepare("SELECT COUNT(*) as count FROM linen_items WHERE category = ? AND status = 'in_use'").get(category).count;
    const scrapped = db.prepare("SELECT COUNT(*) as count FROM linen_items WHERE category = ? AND status = 'scrapped'").get(category).count;
    const lost = db.prepare("SELECT COUNT(*) as count FROM linen_items WHERE category = ? AND status = 'lost'").get(category).count;
    
    return {
      category,
      available,
      in_wash,
      in_use,
      scrapped,
      lost,
      total: available + in_wash + in_use,
      safety_stock: 10,
      below_safety: available < 10
    };
  });
  
  const discrepancies = db.prepare('SELECT COUNT(*) as count FROM linen_collections WHERE has_discrepancy = 1').get().count;
  const pending_approvals = db.prepare("SELECT COUNT(*) as count FROM damage_reports WHERE approval_status = 'pending'").get().count;
  
  res.json({
    by_category: summary,
    total_available: summary.reduce((sum, s) => sum + s.available, 0),
    total_in_wash: summary.reduce((sum, s) => sum + s.in_wash, 0),
    discrepancies,
    pending_approvals,
    below_safety_items: summary.filter(s => s.below_safety)
  });
});

router.get('/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});

export default router;
