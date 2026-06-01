const express = require('express');

function createExceptionsRouter(db, auth) {
  const router = express.Router();

  router.get('/', auth, (req, res) => {
    try {
      const { bid_id, operation, error_type, status, page = 1, pageSize = 20 } = req.query;
      
      let whereClause = ['1=1'];
      let params = [];

      if (bid_id) { whereClause.push('e.bid_id = ?'); params.push(parseInt(bid_id)); }
      if (operation) { whereClause.push('e.operation = ?'); params.push(operation); }
      if (error_type) { whereClause.push('e.error_type = ?'); params.push(error_type); }
      if (status) { whereClause.push('e.status = ?'); params.push(status); }

      const offset = (page - 1) * pageSize;
      params.push(parseInt(pageSize), offset);

      const exceptions = db.prepare(`
        SELECT e.*,
               b.bid_no, b.project_name,
               u.real_name as operator_name
        FROM exception_logs e
        LEFT JOIN bids b ON e.bid_id = b.id
        LEFT JOIN users u ON e.operator_id = u.id
        WHERE ${whereClause.join(' AND ')}
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params);

      const total = db.prepare(`
        SELECT COUNT(*) as count FROM exception_logs e
        WHERE ${whereClause.join(' AND ')}
      `).get(...params.slice(0, -2));

      res.json({ list: exceptions, total: total.count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', auth, (req, res) => {
    try {
      const exception = db.prepare(`
        SELECT e.*,
               b.bid_no, b.project_name,
               u.real_name as operator_name
        FROM exception_logs e
        LEFT JOIN bids b ON e.bid_id = b.id
        LEFT JOIN users u ON e.operator_id = u.id
        WHERE e.id = ?
      `).get(req.params.id);

      if (!exception) {
        return res.status(404).json({ error: '异常记录不存在' });
      }

      if (exception.raw_request) {
        try {
          exception.request_data = JSON.parse(exception.raw_request);
        } catch (e) {
          exception.request_data = null;
        }
      }

      res.json(exception);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id/resolve', auth, (req, res) => {
    try {
      const { compensation_action, manual_remark } = req.body;

      db.prepare(`
        UPDATE exception_logs 
        SET status = 'resolved', compensation_action = ?, manual_remark = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(compensation_action || null, manual_remark || null, req.params.id);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/stats/summary', auth, (req, res) => {
    try {
      const pendingCount = db.prepare("SELECT COUNT(*) as count FROM exception_logs WHERE status = 'pending'").get();
      const resolvedCount = db.prepare("SELECT COUNT(*) as count FROM exception_logs WHERE status = 'resolved'").get();
      
      const typeStats = db.prepare(`
        SELECT error_type, COUNT(*) as count,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM exception_logs
        GROUP BY error_type
        ORDER BY count DESC
        LIMIT 10
      `).all();

      res.json({
        pending: pendingCount.count,
        resolved: resolvedCount.count,
        type_stats: typeStats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createExceptionsRouter;
