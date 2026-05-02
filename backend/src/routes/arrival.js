const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db, authService, stateMachine, rulesEngine) => {
  const authMiddleware = (req, res, next) => {
    authService.middleware(req, res, next);
  };

  router.get('/predict/:mainOrderNo', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      
      const order = db.prepare(`
        SELECT mo.*, s.departure_time, s.route_id
        FROM main_orders mo
        LEFT JOIN schedules s ON mo.schedule_id = s.schedule_id
        WHERE mo.main_order_no = ?
      `).get(mainOrderNo);

      if (!order) {
        return res.status(404).json({ error: '主单不存在' });
      }

      const predictions = rulesEngine.calculateArrivalETA(order.route_id, order.departure_time);

      const existingPredictions = db.prepare(`
        SELECT * FROM arrival_predictions WHERE main_order_no = ?
      `).all(mainOrderNo);

      if (existingPredictions.length === 0) {
        const insertPrediction = db.prepare(`
          INSERT INTO arrival_predictions (prediction_id, main_order_no, station_id, predicted_arrival_time, confidence, prediction_source)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        predictions.predictions.forEach(p => {
          insertPrediction.run(
            p.prediction_id,
            mainOrderNo,
            p.station_id,
            p.predicted_arrival_time,
            p.confidence,
            p.prediction_source
          );
        });
      }

      res.json(predictions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/confirm/:mainOrderNo', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      const { station_id, actual_arrival_time, passenger_count, remarks } = req.body;

      const order = db.prepare('SELECT * FROM main_orders WHERE main_order_no = ?').get(mainOrderNo);
      if (!order) {
        return res.status(404).json({ error: '主单不存在' });
      }

      const detail = db.prepare(`
        SELECT * FROM order_details WHERE main_order_no = ? AND station_id = ?
      `).get(mainOrderNo, station_id);

      if (!detail) {
        return res.status(404).json({ error: '站点明细不存在' });
      }

      const updateDetail = db.prepare(`
        UPDATE order_details 
        SET actual_arrival_time = ?, passenger_count = ?, remarks = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE main_order_no = ? AND station_id = ?
      `);

      updateDetail.run(
        actual_arrival_time || new Date().toISOString(),
        passenger_count || 0,
        remarks || '',
        'confirmed',
        mainOrderNo,
        station_id
      );

      db.prepare(`
        INSERT INTO operation_logs (log_id, main_order_no, operation_type, old_value, new_value, operator_id, operator_name, source_client)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        mainOrderNo,
        'arrival_confirm',
        detail.status,
        'confirmed',
        req.user.userId,
        req.user.name,
        'web'
      );

      const allDetails = db.prepare('SELECT * FROM order_details WHERE main_order_no = ?').all(mainOrderNo);
      const allConfirmed = allDetails.every(d => d.status === 'confirmed');

      if (allConfirmed) {
        stateMachine.transition(
          mainOrderNo,
          'complete',
          req.user.userId,
          req.user.name,
          '所有站点已确认到站',
          'web'
        );
      }

      res.json({
        success: true,
        main_order_no: mainOrderNo,
        station_id,
        status: 'confirmed'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/history/:mainOrderNo', authMiddleware, (req, res) => {
    try {
      const { mainOrderNo } = req.params;
      
      const details = db.prepare(`
        SELECT * FROM order_details WHERE main_order_no = ? ORDER BY id
      `).all(mainOrderNo);

      const predictions = db.prepare(`
        SELECT * FROM arrival_predictions WHERE main_order_no = ? ORDER BY id
      `).all(mainOrderNo);

      res.json({
        details,
        predictions
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
