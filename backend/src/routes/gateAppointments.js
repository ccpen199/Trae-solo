const express = require('express');
const router = express.Router();
const { 
  generateId, 
  generateAppointmentNo
} = require('../utils');
const GateRuleEngine = require('../rules/gateRuleEngine');

module.exports = (db) => {
  const gateEngine = new GateRuleEngine(db);

  router.get('/', (req, res) => {
    try {
      const { status, container_id, gate_no, appointment_time } = req.query;
      
      let query = `
        SELECT ga.*, c.container_no, c.size_type, c.weight
        FROM gate_appointments ga
        LEFT JOIN containers c ON ga.container_id = c.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND ga.status = ?';
        params.push(status);
      }

      if (container_id) {
        query += ' AND ga.container_id = ?';
        params.push(container_id);
      }

      if (gate_no) {
        query += ' AND ga.gate_no = ?';
        params.push(gate_no);
      }

      if (appointment_time) {
        query += ' AND DATE(ga.appointment_time) = ?';
        params.push(appointment_time);
      }

      query += ' ORDER BY ga.created_at DESC';

      const appointments = db.prepare(query).all(...params);
      res.json({ success: true, data: appointments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const appointment = db.prepare(`
        SELECT ga.*, c.container_no, c.size_type, c.weight,
               u.name as driver_name
        FROM gate_appointments ga
        LEFT JOIN containers c ON ga.container_id = c.id
        LEFT JOIN users u ON ga.driver_name = u.name
        WHERE ga.id = ?
      `).get(id);
      
      if (!appointment) {
        return res.status(404).json({ success: false, message: '闸口预约不存在' });
      }

      res.json({ success: true, data: appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { 
        container_id, 
        gate_no, 
        appointment_time, 
        driver_name, 
        vehicle_no,
        created_by
      } = req.body;

      if (!container_id || !gate_no || !appointment_time) {
        return res.status(400).json({ 
          success: false, 
          message: '集装箱、闸口和预约时间为必填项' 
        });
      }

      const validation = gateEngine.validateGateAppointment({
        container_id,
        appointment_time,
        gate_no
      });

      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          message: validation.errors.join('; ') 
        });
      }

      const container = db.prepare(
        'SELECT * FROM containers WHERE id = ?'
      ).get(container_id);

      if (!container) {
        return res.status(404).json({ 
          success: false, 
          message: '集装箱不存在' 
        });
      }

      const id = generateId();
      const appointmentNo = generateAppointmentNo();

      const insertAppointment = db.prepare(`
        INSERT INTO gate_appointments (
          id, appointment_no, container_id, gate_no, 
          appointment_time, status, driver_name, vehicle_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertAppointment.run(
        id,
        appointmentNo,
        container_id,
        gate_no,
        appointment_time,
        'SCHEDULED',
        driver_name,
        vehicle_no
      );

      res.status(201).json({ 
        success: true, 
        data: { id, appointment_no: appointmentNo } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/check-in', (req, res) => {
    try {
      const { id } = req.params;
      const { operator_id, actual_time } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const result = gateEngine.checkIn(id, actual_time);
      
      if (result.success === false) {
        return res.status(400).json({ success: false, message: result.message });
      }

      const appointment = db.prepare(`
        SELECT ga.*, c.container_no
        FROM gate_appointments ga
        LEFT JOIN containers c ON ga.container_id = c.id
        WHERE ga.id = ?
      `).get(id);

      res.json({ 
        success: true, 
        data: { 
          appointment_no: appointment.appointment_no,
          container_no: appointment.container_no,
          status: 'CHECKED_IN',
          actual_time: appointment.actual_time
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/check-out', (req, res) => {
    try {
      const { id } = req.params;
      const { operator_id } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const result = gateEngine.checkOut(id);
      
      if (result.success === false) {
        return res.status(400).json({ success: false, message: result.message });
      }

      const appointment = db.prepare(`
        SELECT ga.*, c.container_no
        FROM gate_appointments ga
        LEFT JOIN containers c ON ga.container_id = c.id
        WHERE ga.id = ?
      `).get(id);

      res.json({ 
        success: true, 
        data: { 
          appointment_no: appointment.appointment_no,
          container_no: appointment.container_no,
          status: 'CHECKED_OUT'
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/gates/available', (req, res) => {
    try {
      const availableGates = gateEngine.getAvailableGates();
      const allGates = ['G01', 'G02', 'G03', 'G04', 'G05'];
      
      const gateStatuses = allGates.map(gate => ({
        gate_no: gate,
        status: availableGates.includes(gate) ? 'AVAILABLE' : 'LOCKED'
      }));

      res.json({ 
        success: true, 
        data: gateStatuses 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/gates/:gate_no/lock', (req, res) => {
    try {
      const { gate_no } = req.params;
      const { task_id, operator_id } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const result = gateEngine.lockGate(gate_no, task_id, operator_id);
      
      if (result.success === false) {
        return res.status(400).json({ success: false, message: result.message });
      }

      res.json({ 
        success: true, 
        data: { 
          gate_no,
          status: 'LOCKED'
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/gates/:gate_no/unlock', (req, res) => {
    try {
      const { gate_no } = req.params;

      const success = gateEngine.unlockGate(gate_no);
      
      if (!success) {
        return res.status(400).json({ success: false, message: '闸口未锁定或解锁失败' });
      }

      res.json({ 
        success: true, 
        data: { 
          gate_no,
          status: 'AVAILABLE'
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/statistics/today', (req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      const statistics = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM gate_appointments
        WHERE DATE(appointment_time) = ?
        GROUP BY status
      `).all(today);

      const total = db.prepare(`
        SELECT COUNT(*) as count 
        FROM gate_appointments 
        WHERE DATE(appointment_time) = ?
      `).get(today);

      res.json({ 
        success: true, 
        data: { 
          date: today,
          total: total.count,
          by_status: statistics 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
