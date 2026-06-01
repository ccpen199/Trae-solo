const db = require('../models/database');

const deviceController = {
  getAllDevices: (req, res) => {
    try {
      const { station_id, status } = req.query;
      
      let sql = 'SELECT d.*, s.name as station_name FROM devices d JOIN stations s ON d.station_id = s.id WHERE 1=1';
      const params = [];

      if (station_id) {
        sql += ' AND d.station_id = ?';
        params.push(station_id);
      }
      if (status) {
        sql += ' AND d.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY d.created_at DESC';
      const devices = db.prepare(sql).all(params);

      res.json({ success: true, data: devices });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDeviceStats: (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT 
          device_type,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
          SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
          SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault
        FROM devices
        GROUP BY device_type
      `).all();

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateDeviceStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      db.prepare('UPDATE devices SET status = ?, last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, id);

      if (status === 'fault') {
        const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
        
        db.prepare(`
          INSERT INTO alerts (station_id, device_id, alert_type, message, level, is_resolved)
          VALUES (?, ?, 'device_fault', ?, 'error', 0)
        `).run(device.station_id, id, `${device.device_name} 设备故障`);

        db.prepare(`
          INSERT INTO work_orders (station_id, device_id, title, description, type, status, priority)
          VALUES (?, ?, ?, ?, 'repair', 'pending', 'high')
        `).run(device.station_id, id, `${device.device_name} 故障维修`, 
                `设备 ${device.device_name} 出现故障，需要及时处理`);
      }

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      res.json({ success: true, data: device });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getWorkOrders: (req, res) => {
    try {
      const { status, priority } = req.query;
      
      let sql = `
        SELECT wo.*, s.name as station_name, d.device_name
        FROM work_orders wo
        JOIN stations s ON wo.station_id = s.id
        LEFT JOIN devices d ON wo.device_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        sql += ' AND wo.status = ?';
        params.push(status);
      }
      if (priority) {
        sql += ' AND wo.priority = ?';
        params.push(priority);
      }

      sql += ' ORDER BY wo.created_at DESC';
      const orders = db.prepare(sql).all(params);

      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateWorkOrder: (req, res) => {
    try {
      const { id } = req.params;
      const { status, assignee, description } = req.body;

      const updates = [];
      const params = [];

      if (status) {
        updates.push('status = ?');
        params.push(status);
        if (status === 'completed') {
          updates.push('completed_at = CURRENT_TIMESTAMP');
        }
      }
      if (assignee) {
        updates.push('assignee = ?');
        params.push(assignee);
      }
      if (description) {
        updates.push('description = ?');
        params.push(description);
      }

      if (updates.length > 0) {
        params.push(id);
        db.prepare(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`).run(params);
      }

      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAlerts: (req, res) => {
    try {
      const { is_resolved, level } = req.query;
      
      let sql = `
        SELECT a.*, s.name as station_name, d.device_name
        FROM alerts a
        JOIN stations s ON a.station_id = s.id
        LEFT JOIN devices d ON a.device_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (is_resolved !== undefined) {
        sql += ' AND a.is_resolved = ?';
        params.push(is_resolved);
      }
      if (level) {
        sql += ' AND a.level = ?';
        params.push(level);
      }

      sql += ' ORDER BY a.created_at DESC';
      const alerts = db.prepare(sql).all(params);

      res.json({ success: true, data: alerts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  resolveAlert: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('UPDATE alerts SET is_resolved = 1 WHERE id = ?').run(id);
      
      const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
      res.json({ success: true, data: alert });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = deviceController;