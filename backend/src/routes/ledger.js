const express = require('express');

function createLedgerRouter(db, auth, requirePermission) {
  const router = express.Router();

  router.get('/', auth, (req, res) => {
    try {
      const { 
        bid_id, action_type, status, operator_id, owner_id, 
        start_date, end_date, exception_reason, page = 1, pageSize = 20 
      } = req.query;
      
      let whereClause = ['1=1'];
      let params = [];

      if (bid_id) { whereClause.push('bl.bid_id = ?'); params.push(parseInt(bid_id)); }
      if (action_type) { whereClause.push('bl.action_type = ?'); params.push(action_type); }
      if (status) { whereClause.push('bl.status = ?'); params.push(status); }
      if (operator_id) { whereClause.push('bl.operator_id = ?'); params.push(parseInt(operator_id)); }
      if (owner_id) { whereClause.push('bl.owner_id = ?'); params.push(parseInt(owner_id)); }
      if (start_date) { whereClause.push('bl.created_at >= ?'); params.push(start_date); }
      if (end_date) { whereClause.push('bl.created_at <= ?'); params.push(end_date); }
      if (exception_reason) { whereClause.push('bl.exception_reason LIKE ?'); params.push(`%${exception_reason}%`); }

      const offset = (page - 1) * pageSize;
      params.push(parseInt(pageSize), offset);

      const records = db.prepare(`
        SELECT bl.*,
               b.bid_no, b.project_name,
               u1.real_name as operator_name,
               u2.real_name as owner_name,
               u3.real_name as reviewer_name
        FROM business_ledger bl
        LEFT JOIN bids b ON bl.bid_id = b.id
        LEFT JOIN users u1 ON bl.operator_id = u1.id
        LEFT JOIN users u2 ON bl.owner_id = u2.id
        LEFT JOIN users u3 ON bl.reviewer_id = u3.id
        WHERE ${whereClause.join(' AND ')}
        ORDER BY bl.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params);

      const total = db.prepare(`
        SELECT COUNT(*) as count FROM business_ledger bl
        WHERE ${whereClause.join(' AND ')}
      `).get(...params.slice(0, -2));

      res.json({ list: records, total: total.count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', auth, (req, res) => {
    try {
      const record = db.prepare(`
        SELECT bl.*,
               b.bid_no, b.project_name,
               u1.real_name as operator_name,
               u2.real_name as owner_name,
               u3.real_name as reviewer_name
        FROM business_ledger bl
        LEFT JOIN bids b ON bl.bid_id = b.id
        LEFT JOIN users u1 ON bl.operator_id = u1.id
        LEFT JOIN users u2 ON bl.owner_id = u2.id
        LEFT JOIN users u3 ON bl.reviewer_id = u3.id
        WHERE bl.id = ?
      `).get(req.params.id);

      if (!record) {
        return res.status(404).json({ error: '记录不存在' });
      }

      if (record.bid_id) {
        const bidDetail = db.prepare('SELECT * FROM bids WHERE id = ?').get(record.bid_id);
        record.bid_detail = bidDetail;
      }

      if (record.metadata_json) {
        try {
          record.metadata = JSON.parse(record.metadata_json);
        } catch (e) {
          record.metadata = null;
        }
      }

      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/stats/summary', auth, (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      let dateClause = '1=1';
      let params = [];
      if (start_date) { dateClause += ' AND created_at >= ?'; params.push(start_date); }
      if (end_date) { dateClause += ' AND created_at <= ?'; params.push(end_date); }

      const totalCount = db.prepare(`SELECT COUNT(*) as count FROM business_ledger WHERE ${dateClause}`).get(...params);
      const successCount = db.prepare(`SELECT COUNT(*) as count FROM business_ledger WHERE status = 'success' AND ${dateClause}`).get(...params);
      const failedCount = db.prepare(`SELECT COUNT(*) as count FROM business_ledger WHERE status = 'failed' AND ${dateClause}`).get(...params);
      const warningCount = db.prepare(`SELECT COUNT(*) as count FROM business_ledger WHERE status = 'warning' AND ${dateClause}`).get(...params);

      const actionStats = db.prepare(`
        SELECT action_type, COUNT(*) as count,
               SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM business_ledger
        WHERE ${dateClause}
        GROUP BY action_type
        ORDER BY count DESC
      `).all(...params);

      res.json({
        total: totalCount.count,
        success: successCount.count,
        failed: failedCount.count,
        warning: warningCount.count,
        action_stats: actionStats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createLedgerRouter;
