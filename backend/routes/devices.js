import express from 'express';

export default function deviceRoutes(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const devices = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      const capabilities = db.prepare('SELECT * FROM device_capabilities WHERE device_type = ?').get(device.device_type);
      res.json({ ...device, capabilities: capabilities ? JSON.parse(capabilities.capabilities) : null });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { device_type, name, protocol, manufacturer, model } = req.body;

      if (!device_type || !name || !protocol) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const fingerprint = `DEV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const stmt = db.prepare(`
        INSERT INTO devices (device_type, name, protocol, manufacturer, model, fingerprint)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(device_type, name, protocol, manufacturer || null, model || null, fingerprint);

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(device);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const { name, status, manufacturer, model } = req.body;
      const { id } = req.params;

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const stmt = db.prepare(`
        UPDATE devices
        SET name = COALESCE(?, name),
            status = COALESCE(?, status),
            manufacturer = COALESCE(?, manufacturer),
            model = COALESCE(?, model),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(name, status, manufacturer, model, id);

      const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      db.prepare('DELETE FROM devices WHERE id = ?').run(id);

      res.json({ message: 'Device deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id/capabilities', (req, res) => {
    try {
      const { id } = req.params;

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const capabilities = db.prepare('SELECT * FROM device_capabilities WHERE device_type = ?').get(device.device_type);
      if (!capabilities) {
        return res.status(404).json({ error: 'Capabilities not found for this device type' });
      }

      res.json(JSON.parse(capabilities.capabilities));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
