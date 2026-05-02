const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db, authService, stateMachine, rulesEngine) => {
  const authMiddleware = (req, res, next) => {
    authService.middleware(req, res, next);
  };

  router.get('/', authMiddleware, (req, res) => {
    try {
      const { status, page = 1, pageSize = 20 } = req.query;
      const offset = (page - 1) * pageSize;

      let query = `
        SELECT eq.*, mo.main_order_no, r.route_name, v.plate_number
        FROM exception_queue eq
        LEFT JOIN main_orders mo ON eq.main_order_no = mo.main_order_no
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      `;
      let params = [];

      if (status) {
        query += ' WHERE eq.status = ?';
        params.push(status);
      }

      query += ' ORDER BY eq.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(pageSize), offset);

      const exceptions = db.prepare(query).all(...params);

      const countQuery = status
        ? 'SELECT COUNT(*) as total FROM exception_queue WHERE status = ?'
        : 'SELECT COUNT(*) as total FROM exception_queue';
      const countParams = status ? [status] : [];
      const { total } = db.prepare(countQuery).get(...countParams);

      res.json({
        data: exceptions,
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

  router.post('/create', authMiddleware, (req, res) => {
    try {
      const { exception_type, main_order_no, vehicle_id, track_id, original_data, message } = req.body;

      const queueId = rulesEngine.addToExceptionQueue(
        exception_type,
        original_data || {},
        main_order_no,
        vehicle_id,
        track_id
      );

      if (main_order_no) {
        const order = db.prepare('SELECT * FROM main_orders WHERE main_order_no = ?').get(main_order_no);
        if (order && stateMachine.canTransition(order.current_status, 'exception')) {
          stateMachine.transition(
            main_order_no,
            'exception',
            req.user.userId,
            req.user.name,
            message || `异常: ${exception_type}`,
            'web'
          );
        }
      }

      res.json({
        success: true,
        queue_id: queueId
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:queueId/handle', authMiddleware, (req, res) => {
    try {
      const { queueId } = req.params;
      const { action, handle_result, compensation_data } = req.body;

      const exception = db.prepare('SELECT * FROM exception_queue WHERE queue_id = ?').get(queueId);
      
      if (!exception) {
        return res.status(404).json({ error: '异常记录不存在' });
      }

      if (exception.status !== 'pending') {
        return res.status(400).json({ error: '该异常已被处理' });
      }

      const updateQueue = db.prepare(`
        UPDATE exception_queue 
        SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = ?, compensation_data = ?
        WHERE queue_id = ?
      `);

      const updateAlarm = db.prepare(`
        UPDATE alarms 
        SET is_handled = 1, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = ?
        WHERE main_order_no = ? AND is_handled = 0
      `);

      let newStatus = 'handled';
      let actionDescription = '';

      switch (action) {
        case 'resolve':
          newStatus = 'resolved';
          actionDescription = '已解决';
          break;
        case 'escalate':
          newStatus = 'escalated';
          actionDescription = '已升级';
          break;
        case 'close':
          newStatus = 'closed';
          actionDescription = '已关闭';
          break;
        default:
          newStatus = 'handled';
          actionDescription = '已处理';
      }

      const transaction = db.transaction(() => {
        updateQueue.run(
          newStatus,
          req.user.userId,
          handle_result || actionDescription,
          compensation_data ? JSON.stringify(compensation_data) : null,
          queueId
        );

        updateAlarm.run(
          req.user.userId,
          handle_result || actionDescription,
          exception.main_order_no
        );

        db.prepare(`
          INSERT INTO operation_logs (log_id, main_order_no, operation_type, old_value, new_value, operator_id, operator_name, source_client)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          exception.main_order_no,
          `exception:${action}`,
          exception.status,
          newStatus,
          req.user.userId,
          req.user.name,
          'web'
        );

        if (exception.main_order_no && (action === 'resolve' || action === 'resume')) {
          const order = db.prepare('SELECT * FROM main_orders WHERE main_order_no = ?').get(exception.main_order_no);
          if (order && stateMachine.canTransition(order.current_status, 'resolve')) {
            stateMachine.transition(
              exception.main_order_no,
              'resolve',
              req.user.userId,
              req.user.name,
              handle_result || '异常已解决',
              'web'
            );
          }
        }
      });

      transaction();

      res.json({
        success: true,
        queue_id: queueId,
        status: newStatus
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:queueId', authMiddleware, (req, res) => {
    try {
      const { queueId } = req.params;
      
      const exception = db.prepare(`
        SELECT eq.*, mo.main_order_no, r.route_name, v.plate_number
        FROM exception_queue eq
        LEFT JOIN main_orders mo ON eq.main_order_no = mo.main_order_no
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE eq.queue_id = ?
      `).get(queueId);

      if (!exception) {
        return res.status(404).json({ error: '异常记录不存在' });
      }

      res.json(exception);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
