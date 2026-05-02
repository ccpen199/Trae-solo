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
        SELECT mo.*, r.route_name, s.departure_time, s.vehicle_id, v.plate_number
        FROM main_orders mo
        LEFT JOIN routes r ON mo.route_id = r.route_id
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      `;
      let params = [];

      if (status) {
        query += ' WHERE mo.current_status = ?';
        params.push(status);
      }

      query += ' ORDER BY mo.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(pageSize), offset);

      const orders = db.prepare(query).all(...params);

      const countQuery = status 
        ? 'SELECT COUNT(*) as total FROM main_orders WHERE current_status = ?'
        : 'SELECT COUNT(*) as total FROM main_orders';
      const countParams = status ? [status] : [];
      const { total } = db.prepare(countQuery).get(...countParams);

      const ordersWithStateInfo = orders.map(order => ({
        ...order,
        state_info: stateMachine.getStateInfo(order.current_status)
      }));

      res.json({
        data: ordersWithStateInfo,
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

  router.get('/:mainOrderNo', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      
      const order = db.prepare(`
        SELECT mo.*, r.route_name, r.route_code, s.departure_time, s.vehicle_id, s.driver_id,
               v.plate_number, v.vehicle_type, d.user_id as driver_user_id
        FROM main_orders mo
        LEFT JOIN routes r ON mo.route_id = r.route_id
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        LEFT JOIN drivers d ON s.driver_id = d.driver_id
        WHERE mo.main_order_no = ?
      `).get(mainOrderNo);

      if (!order) {
        return res.status(404).json({ error: '主单不存在' });
      }

      const details = db.prepare(`
        SELECT * FROM order_details WHERE main_order_no = ? ORDER BY id
      `).all(mainOrderNo);

      const timeline = db.prepare(`
        SELECT * FROM timeline_events WHERE main_order_no = ? ORDER BY created_at ASC
      `).all(mainOrderNo);

      const validActions = stateMachine.getValidActions(order.current_status, req.user.role);

      res.json({
        order: {
          ...order,
          state_info: stateMachine.getStateInfo(order.current_status)
        },
        details,
        timeline,
        validActions
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', authMiddleware, (req, res) => {
    try {
      const { 
        route_id, driver_id, vehicle_id, departure_time, 
        expected_completion_time, attachments, remarks, assigned_to 
      } = req.body;

      const scheduleData = {
        route_id,
        driver_id,
        vehicle_id,
        departure_time,
        expected_completion_time
      };

      const validation = rulesEngine.validateSchedule(scheduleData);
      if (!validation.valid) {
        return res.status(400).json({ error: '数据校验失败', errors: validation.errors });
      }

      if (rulesEngine.checkDuplicateSchedule(scheduleData)) {
        return res.status(400).json({ error: '存在重复排班（同一线路、司机、车辆、日期）' });
      }

      const scheduleId = uuidv4();
      const mainOrderNo = rulesEngine.generateMainOrderNo();

      const route = db.prepare('SELECT * FROM routes WHERE route_id = ?').get(route_id);
      const stationIds = route.station_order.split(',');
      const stations = db.prepare(`
        SELECT * FROM stations WHERE station_id IN (${stationIds.map(() => '?').join(',')})
        ORDER BY order_index
      `).all(...stationIds);

      const insertSchedule = db.prepare(`
        INSERT INTO schedules (schedule_id, route_id, driver_id, vehicle_id, departure_time, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const insertOrder = db.prepare(`
        INSERT INTO main_orders (main_order_no, schedule_id, route_id, current_status, previous_status, status_flow, assigned_to, expected_completion_time, attachments, remarks, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertDetail = db.prepare(`
        INSERT INTO order_details (detail_id, main_order_no, station_id, station_name, scheduled_arrival_time, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertMessage = db.prepare(`
        INSERT INTO messages (message_id, main_order_no, message_type, title, content, receiver_id, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const departure = new Date(departure_time);
      const minutesPerStation = route.estimated_duration_min / stations.length;

      const transaction = db.transaction(() => {
        insertSchedule.run(scheduleId, route_id, driver_id, vehicle_id, departure_time, 'draft', req.user.userId);

        const orderData = {
          schedule_id: scheduleId,
          route_id,
          assigned_to: assigned_to || req.user.userId,
          expected_completion_time,
          attachments: attachments ? JSON.stringify(attachments) : null,
          remarks
        };

        const orderWithState = stateMachine.createOrderWithInitialState(orderData, req.user.userId, req.user.name);
        
        insertOrder.run(
          mainOrderNo,
          orderWithState.schedule_id,
          orderWithState.route_id,
          orderWithState.current_status,
          orderWithState.previous_status,
          orderWithState.status_flow,
          orderWithState.assigned_to,
          orderWithState.expected_completion_time,
          orderWithState.attachments,
          orderWithState.remarks,
          orderWithState.created_by
        );

        stations.forEach((station, index) => {
          const scheduledArrival = new Date(departure.getTime() + index * minutesPerStation * 60000);
          insertDetail.run(
            uuidv4(),
            mainOrderNo,
            station.station_id,
            station.station_name,
            scheduledArrival.toISOString(),
            'pending'
          );
        });

        insertMessage.run(
          uuidv4(),
          mainOrderNo,
          'todo',
          '新排班待处理',
          `线路 ${route.route_name} 有新的排班任务`,
          assigned_to || req.user.userId,
          `/orders/${mainOrderNo}`
        );
      });

      transaction();

      res.json({
        success: true,
        main_order_no: mainOrderNo,
        schedule_id: scheduleId,
        status: 'draft'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:mainOrderNo/action', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      const { action, comment, reassign_to } = req.body;

      const order = db.prepare('SELECT * FROM main_orders WHERE main_order_no = ?').get(mainOrderNo);
      if (!order) {
        return res.status(404).json({ error: '主单不存在' });
      }

      const validActions = stateMachine.getValidActions(order.current_status, req.user.role);
      const actionConfig = validActions.find(a => a.action === action);
      
      if (!actionConfig) {
        return res.status(400).json({ error: `无权执行操作: ${action}` });
      }

      const insertLog = db.prepare(`
        INSERT INTO operation_logs (log_id, main_order_no, operation_type, old_value, new_value, operator_id, operator_name, source_client)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTimeline = db.prepare(`
        INSERT INTO timeline_events (event_id, main_order_no, event_type, status_from, status_to, operator_id, operator_name, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      if (action === 'reassign' && reassign_to) {
        const transaction = db.transaction(() => {
          db.prepare('UPDATE main_orders SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE main_order_no = ?').run(reassign_to, mainOrderNo);
          
          insertTimeline.run(
            uuidv4(),
            mainOrderNo,
            'reassign',
            order.current_status,
            order.current_status,
            req.user.userId,
            req.user.name,
            comment || `转派给 ${reassign_to}`
          );

          insertLog.run(
            uuidv4(),
            mainOrderNo,
            'reassign',
            order.assigned_to,
            reassign_to,
            req.user.userId,
            req.user.name,
            'web'
          );
        });
        transaction();

        res.json({
          success: true,
          main_order_no: mainOrderNo,
          status: order.current_status,
          assigned_to: reassign_to
        });
        return;
      }

      const result = stateMachine.transition(
        mainOrderNo,
        action,
        req.user.userId,
        req.user.name,
        comment,
        'web'
      );

      if (action === 'submit') {
        db.prepare('UPDATE schedules SET status = ? WHERE schedule_id = ?').run('submitted', order.schedule_id);
      }

      if (action === 'approve') {
        db.prepare('UPDATE schedules SET status = ? WHERE schedule_id = ?').run('scheduled', order.schedule_id);
      }

      if (result.currentState === 'pending_schedule' || result.currentState === 'pending_arrival_prediction') {
        const orderInfo = db.prepare(`
          SELECT mo.*, r.route_name
          FROM main_orders mo
          LEFT JOIN routes r ON mo.route_id = r.route_id
          WHERE mo.main_order_no = ?
        `).get(mainOrderNo);

        const nextAssignee = reassign_to || orderInfo.assigned_to || 'U003';
        
        db.prepare(`
          INSERT INTO messages (message_id, main_order_no, message_type, title, content, receiver_id, action_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          mainOrderNo,
          'todo',
          `待处理: ${stateMachine.getStateInfo(result.currentState).label}`,
          `线路 ${orderInfo.route_name} 需要处理`,
          nextAssignee,
          `/orders/${mainOrderNo}`
        );
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:mainOrderNo/timeline', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      
      const timeline = db.prepare(`
        SELECT * FROM timeline_events WHERE main_order_no = ? ORDER BY created_at ASC
      `).all(mainOrderNo);

      res.json(timeline);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:mainOrderNo/logs', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      
      const logs = db.prepare(`
        SELECT * FROM operation_logs WHERE main_order_no = ? ORDER BY created_at DESC
      `).all(mainOrderNo);

      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
