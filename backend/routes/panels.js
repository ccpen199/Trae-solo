import express from 'express';

export default function panelRoutes(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const panels = db.prepare('SELECT * FROM remote_panels ORDER BY created_at DESC').all();
      const parsedPanels = panels.map(panel => ({
        ...panel,
        layout_data: JSON.parse(panel.layout_data)
      }));
      res.json(parsedPanels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const panel = db.prepare('SELECT * FROM remote_panels WHERE id = ?').get(req.params.id);
      if (!panel) {
        return res.status(404).json({ error: 'Panel not found' });
      }
      res.json({
        ...panel,
        layout_data: JSON.parse(panel.layout_data)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { device_id, name, layout_data, theme } = req.body;

      if (!device_id || !name || !layout_data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(device_id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const stmt = db.prepare(`
        INSERT INTO remote_panels (device_id, name, layout_data, theme)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(device_id, name, JSON.stringify(layout_data), theme || 'light');

      const panel = db.prepare('SELECT * FROM remote_panels WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({
        ...panel,
        layout_data: JSON.parse(panel.layout_data)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, layout_data, theme } = req.body;

      const panel = db.prepare('SELECT * FROM remote_panels WHERE id = ?').get(id);
      if (!panel) {
        return res.status(404).json({ error: 'Panel not found' });
      }

      const stmt = db.prepare(`
        UPDATE remote_panels
        SET name = COALESCE(?, name),
            layout_data = COALESCE(?, layout_data),
            theme = COALESCE(?, theme),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        name,
        layout_data ? JSON.stringify(layout_data) : null,
        theme,
        id
      );

      const updatedPanel = db.prepare('SELECT * FROM remote_panels WHERE id = ?').get(id);
      res.json({
        ...updatedPanel,
        layout_data: JSON.parse(updatedPanel.layout_data)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;

      const panel = db.prepare('SELECT * FROM remote_panels WHERE id = ?').get(id);
      if (!panel) {
        return res.status(404).json({ error: 'Panel not found' });
      }

      db.prepare('DELETE FROM remote_panels WHERE id = ?').run(id);

      res.json({ message: 'Panel deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
