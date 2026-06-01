import express from 'express';
import crypto from 'crypto';

export default function controlRoutes(db, io) {
  const router = express.Router();

  const SECRET_KEY = process.env.SECRET_KEY || 'device_fingerprint_secret_key';

  function generateWatermark(deviceId, command, timestamp) {
    const data = `${deviceId}:${command}:${timestamp}:${SECRET_KEY}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  router.post('/:deviceId/control', (req, res) => {
    try {
      const { deviceId } = req.params;
      const { command, params } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'Missing command' });
      }

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const timestamp = Date.now();
      const watermark = generateWatermark(deviceId, command, timestamp);

      const startTime = Date.now();

      const controlResult = {
        success: Math.random() > 0.1,
        responseTime: Math.floor(Math.random() * 200) + 50
      };

      const stmt = db.prepare(`
        INSERT INTO control_logs (device_id, command, watermark, result, response_time)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        deviceId,
        JSON.stringify({ command, params }),
        watermark,
        controlResult.success ? 'success' : 'failure',
        controlResult.responseTime
      );

      db.prepare('UPDATE devices SET last_control_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?').run('online', deviceId);

      io.emit('device:status', {
        deviceId,
        status: 'online',
        lastControl: new Date().toISOString()
      });

      res.json({
        success: controlResult.success,
        watermark,
        timestamp,
        responseTime: controlResult.responseTime,
        device: {
          id: device.id,
          name: device.name,
          status: 'online'
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:deviceId/learn', (req, res) => {
    try {
      const { deviceId } = req.params;
      const { key_name, code_data, frequency, format, event_type } = req.body;

      if (!key_name || !code_data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const learningId = crypto.randomUUID();

      const stmt = db.prepare(`
        INSERT INTO learning_logs (device_id, key_name, status)
        VALUES (?, ?, 'pending')
      `);

      stmt.run(deviceId, key_name);

      io.emit('learning:start', {
        deviceId,
        learningId,
        keyName: key_name,
        status: 'waiting_confirmation'
      });

      res.json({
        learning_id: learningId,
        status: 'pending',
        message: '请在设备上按下对应按键进行确认',
        timeout: 30000
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:deviceId/learn/:learningId/confirm', (req, res) => {
    try {
      const { deviceId, learningId } = req.params;
      const { code_data, frequency, format, event_type } = req.body;

      const learningLog = db.prepare(`
        SELECT * FROM learning_logs
        WHERE device_id = ? AND id = ? AND status = 'pending'
      `).get(deviceId, learningId);

      if (!learningLog) {
        return res.status(404).json({ error: 'Learning session not found or expired' });
      }

      const codeDataToStore = code_data || {
        simulated: true,
        timestamp: Date.now(),
        format: format || 'NEC',
        frequency: frequency || 38000
      };

      const stmt = db.prepare(`
        INSERT INTO ir_codes (device_id, code_type, key_name, code_data, frequency, format, event_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        deviceId,
        'learned',
        learningLog.key_name,
        JSON.stringify(codeDataToStore),
        frequency || 38000,
        format || 'NEC',
        event_type || 'short'
      );

      db.prepare('UPDATE learning_logs SET status = ? WHERE id = ?').run('confirmed', learningId);

      io.emit('learning:complete', {
        deviceId,
        learningId,
        keyName: learningLog.key_name,
        status: 'success'
      });

      res.json({
        status: 'confirmed',
        message: '红外码学习成功',
        code_id: stmt.lastInsertRowid
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:deviceId/codes', (req, res) => {
    try {
      const { deviceId } = req.params;
      const { event_type } = req.query;

      let query = 'SELECT * FROM ir_codes WHERE device_id = ?';
      const params = [deviceId];

      if (event_type) {
        query += ' AND event_type = ?';
        params.push(event_type);
      }

      query += ' ORDER BY key_name ASC';

      const codes = db.prepare(query).all(...params);
      const parsedCodes = codes.map(code => ({
        ...code,
        code_data: JSON.parse(code.code_data)
      }));

      res.json(parsedCodes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:deviceId/codes', (req, res) => {
    try {
      const { deviceId } = req.params;
      const { code_type, key_name, code_data, frequency, format, event_type } = req.body;

      if (!key_name || !code_data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const stmt = db.prepare(`
        INSERT INTO ir_codes (device_id, code_type, key_name, code_data, frequency, format, event_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        deviceId,
        code_type || 'manual',
        key_name,
        JSON.stringify(code_data),
        frequency || null,
        format || null,
        event_type || 'short'
      );

      const code = db.prepare('SELECT * FROM ir_codes WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({
        ...code,
        code_data: JSON.parse(code.code_data)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:deviceId/status', (req, res) => {
    try {
      const { deviceId } = req.params;

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const recentLogs = db.prepare(`
        SELECT * FROM control_logs
        WHERE device_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(deviceId);

      res.json({
        device: {
          id: device.id,
          name: device.name,
          type: device.device_type,
          protocol: device.protocol,
          status: device.status,
          fingerprint: device.fingerprint,
          last_control_at: device.last_control_at
        },
        recent_activity: recentLogs
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
