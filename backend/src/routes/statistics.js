const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db, authService, stateMachine) => {
  const authMiddleware = (req, res, next) => {
    authService.middleware(req, res, next);
  };

  router.get('/dashboard', authMiddleware, (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      let dateCondition = '';
      let dateParams = [];

      if (start_date && end_date) {
        dateCondition = 'AND DATE(mo.created_at) BETWEEN ? AND ?';
        dateParams = [start_date, end_date];
      }

      const statusCounts = db.prepare(`
        SELECT current_status, COUNT(*) as count
        FROM main_orders
        WHERE 1=1 ${dateCondition}
        GROUP BY current_status
      `).all(...dateParams);

      const totalOrders = db.prepare(`
        SELECT COUNT(*) as count FROM main_orders WHERE 1=1 ${dateCondition}
      `).get(...dateParams);

      const completedOrders = db.prepare(`
        SELECT COUNT(*) as count FROM main_orders 
        WHERE current_status = 'completed' ${dateCondition}
      `).get(...dateParams);

      const exceptionOrders = db.prepare(`
        SELECT COUNT(*) as count FROM main_orders 
        WHERE current_status = 'pending_exception' ${dateCondition}
      `).get(...dateParams);

      const pendingTodo = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE is_read = 0
      `).get();

      const activeAlarms = db.prepare(`
        SELECT COUNT(*) as count FROM alarms 
        WHERE is_handled = 0
      `).get();

      const routeStats = db.prepare(`
        SELECT r.route_id, r.route_name, COUNT(mo.id) as order_count
        FROM main_orders mo
        LEFT JOIN routes r ON mo.route_id = r.route_id
        WHERE 1=1 ${dateCondition}
        GROUP BY r.route_id, r.route_name
        ORDER BY order_count DESC
        LIMIT 10
      `).all(...dateParams);

      const statusDistribution = {};
      statusCounts.forEach(item => {
        const info = stateMachine.getStateInfo(item.current_status);
        statusDistribution[item.current_status] = {
          count: item.count,
          label: info.label,
          color: info.color
        };
      });

      res.json({
        summary: {
          total_orders: totalOrders.count,
          completed_orders: completedOrders.count,
          exception_orders: exceptionOrders.count,
          completion_rate: totalOrders.count > 0 
            ? ((completedOrders.count / totalOrders.count) * 100).toFixed(1) 
            : 0
        },
        pending: {
          todos: pendingTodo.count,
          alarms: activeAlarms.count
        },
        status_distribution: statusDistribution,
        top_routes: routeStats
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/finalize/:mainOrderNo', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      const { final_remarks } = req.body;

      const order = db.prepare('SELECT * FROM main_orders WHERE main_order_no = ?').get(mainOrderNo);
      
      if (!order) {
        return res.status(404).json({ error: '主单不存在' });
      }

      if (order.current_status !== 'pending_statistics') {
        return res.status(400).json({ error: '状态不允许完成统计' });
      }

      const details = db.prepare('SELECT * FROM order_details WHERE main_order_no = ?').all(mainOrderNo);
      const predictions = db.prepare('SELECT * FROM arrival_predictions WHERE main_order_no = ?').all(mainOrderNo);

      const totalPassengers = details.reduce((sum, d) => sum + (d.passenger_count || 0), 0);
      const confirmedStations = details.filter(d => d.status === 'confirmed').length;
      const totalStations = details.length;

      let onTimeCount = 0;
      details.forEach(d => {
        if (d.actual_arrival_time && d.scheduled_arrival_time) {
          const actual = new Date(d.actual_arrival_time);
          const scheduled = new Date(d.scheduled_arrival_time);
          const diff = Math.abs(actual - scheduled) / (1000 * 60);
          if (diff <= 5) {
            onTimeCount++;
          }
        }
      });

      const result = stateMachine.transition(
        mainOrderNo,
        'finalize',
        req.user.userId,
        req.user.name,
        final_remarks || '运营统计完成',
        'web'
      );

      db.prepare(`
        UPDATE schedules SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
        WHERE schedule_id = ?
      `).run(order.schedule_id);

      db.prepare(`
        UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE main_order_no = ? AND is_read = 0
      `).run(mainOrderNo);

      db.prepare(`
        UPDATE alarms SET is_handled = 1, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = '订单完成'
        WHERE main_order_no = ? AND is_handled = 0
      `).run(req.user.userId, mainOrderNo);

      res.json({
        success: true,
        main_order_no: mainOrderNo,
        status: 'completed',
        statistics: {
          total_passengers: totalPassengers,
          confirmed_stations: confirmedStations,
          total_stations: totalStations,
          on_time_rate: totalStations > 0 ? ((onTimeCount / totalStations) * 100).toFixed(1) : 0
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/export', authMiddleware, (req, res) => {
    try {
      const { start_date, end_date, status, export_type = 'json' } = req.query;

      let query = `
        SELECT 
          mo.main_order_no,
          mo.current_status,
          mo.created_at,
          mo.updated_at,
          r.route_name,
          r.route_code,
          s.departure_time,
          v.plate_number,
          v.vehicle_type
        FROM main_orders mo
        LEFT JOIN routes r ON mo.route_id = r.route_id
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE 1=1
      `;
      let params = [];

      if (start_date && end_date) {
        query += ' AND DATE(mo.created_at) BETWEEN ? AND ?';
        params.push(start_date, end_date);
      }

      if (status) {
        query += ' AND mo.current_status = ?';
        params.push(status);
      }

      query += ' ORDER BY mo.created_at DESC';

      const orders = db.prepare(query).all(...params);

      const ordersWithDetails = orders.map(order => {
        const details = db.prepare(`
          SELECT station_name, scheduled_arrival_time, actual_arrival_time, passenger_count, status
          FROM order_details WHERE main_order_no = ?
          ORDER BY id
        `).all(order.main_order_no);

        const timeline = db.prepare(`
          SELECT event_type, status_from, status_to, operator_name, comment, created_at
          FROM timeline_events WHERE main_order_no = ?
          ORDER BY created_at
        `).all(order.main_order_no);

        return {
          ...order,
          details,
          timeline
        };
      });

      if (export_type === 'csv') {
        const headers = ['主单号', '状态', '线路', '发车时间', '车牌号', '创建时间', '更新时间'];
        const csvLines = [headers.join(',')];
        
        ordersWithDetails.forEach(order => {
          const stateInfo = stateMachine.getStateInfo(order.current_status);
          csvLines.push([
            order.main_order_no,
            stateInfo.label,
            order.route_name,
            order.departure_time || '',
            order.plate_number || '',
            order.created_at,
            order.updated_at
          ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=bus_orders_${Date.now()}.csv`);
        res.send('\uFEFF' + csvLines.join('\n'));
      } else {
        res.json({
          export_time: new Date().toISOString(),
          total_count: ordersWithDetails.length,
          data: ordersWithDetails
        });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
