const express = require('express');
const router = express.Router();

module.exports = (db, authService) => {
  const authMiddleware = (req, res, next) => {
    authService.middleware(req, res, next);
  };

  router.get('/', authMiddleware, (req, res) => {
    try {
      const { is_handled, alarm_level, page = 1, pageSize = 20 } = req.query;
      const offset = (page - 1) * pageSize;

      let query = `
        SELECT a.*, r.route_name, v.plate_number
        FROM alarms a
        LEFT JOIN main_orders mo ON a.main_order_no = mo.main_order_no
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE 1=1
      `;
      let params = [];

      if (is_handled !== undefined) {
        query += ' AND a.is_handled = ?';
        params.push(is_handled === 'true' ? 1 : 0);
      }

      if (alarm_level) {
        query += ' AND a.alarm_level = ?';
        params.push(alarm_level);
      }

      query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(pageSize), offset);

      const alarms = db.prepare(query).all(...params);

      let countQuery = 'SELECT COUNT(*) as total FROM alarms WHERE 1=1';
      let countParams = [];

      if (is_handled !== undefined) {
        countQuery += ' AND is_handled = ?';
        countParams.push(is_handled === 'true' ? 1 : 0);
      }

      if (alarm_level) {
        countQuery += ' AND alarm_level = ?';
        countParams.push(alarm_level);
      }

      const { total } = db.prepare(countQuery).get(...countParams);

      res.json({
        data: alarms,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:alarmId/handle', authMiddleware, (req, res) => {
    try {
      const { alarmId } = req.params;
      const { handle_result } = req.body;

      const alarm = db.prepare('SELECT * FROM alarms WHERE alarm_id = ?').get(alarmId);
      
      if (!alarm) {
        return res.status(404).json({ error: '告警不存在' });
      }

      if (alarm.is_handled) {
        return res.status(400).json({ error: '该告警已被处理' });
      }

      db.prepare(`
        UPDATE alarms 
        SET is_handled = 1, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = ?
        WHERE alarm_id = ?
      `).run(req.user.userId, handle_result || '已处理', alarmId);

      res.json({
        success: true,
        alarm_id: alarmId,
        is_handled: true
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:alarmId', authMiddleware, (req, res) => {
    try {
      const { alarmId } = req.params;
      
      const alarm = db.prepare(`
        SELECT a.*, r.route_name, v.plate_number, mo.main_order_no
        FROM alarms a
        LEFT JOIN main_orders mo ON a.main_order_no = mo.main_order_no
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE a.alarm_id = ?
      `).get(alarmId);

      if (!alarm) {
        return res.status(404).json({ error: '告警不存在' });
      }

      res.json(alarm);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/stats/overview', authMiddleware, (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const activeCount = db.prepare(`
        SELECT COUNT(*) as count FROM alarms WHERE is_handled = 0
      `).get();

      const highPriorityCount = db.prepare(`
        SELECT COUNT(*) as count FROM alarms WHERE is_handled = 0 AND alarm_level = 'high'
      `).get();

      const todayCount = db.prepare(`
        SELECT COUNT(*) as count FROM alarms WHERE DATE(created_at) = ?
      `).get(today);

      const byType = db.prepare(`
        SELECT alarm_type, COUNT(*) as count 
        FROM alarms 
        WHERE is_handled = 0
        GROUP BY alarm_type
      `).all();

      res.json({
        active_count: activeCount.count,
        high_priority_count: highPriorityCount.count,
        today_count: todayCount.count,
        by_type: byType
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
