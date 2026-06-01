import express from 'express';

export default function epgRoutes(db) {
  const router = express.Router();

  router.get('/channels', (req, res) => {
    try {
      const channels = db.prepare('SELECT * FROM epg_channels ORDER BY channel_number ASC').all();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/channels', (req, res) => {
    try {
      const { channel_id, channel_name, channel_number, logo_url, category } = req.body;

      if (!channel_id || !channel_name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO epg_channels (channel_id, channel_name, channel_number, logo_url, category)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(channel_id, channel_name, channel_number || null, logo_url || null, category || null);

      const channel = db.prepare('SELECT * FROM epg_channels WHERE channel_id = ?').get(channel_id);
      res.status(201).json(channel);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/programs', (req, res) => {
    try {
      const { channel_id, date, category } = req.query;

      let query = 'SELECT * FROM epg_programs WHERE 1=1';
      const params = [];

      if (channel_id) {
        query += ' AND channel_id = ?';
        params.push(channel_id);
      }

      if (date) {
        query += ' AND DATE(start_time) = ?';
        params.push(date);
      }

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY start_time ASC';

      const programs = db.prepare(query).all(...params);
      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/programs/:id', (req, res) => {
    try {
      const program = db.prepare('SELECT * FROM epg_programs WHERE id = ?').get(req.params.id);
      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/programs', (req, res) => {
    try {
      const { channel_id, program_name, start_time, end_time, description, category } = req.body;

      if (!channel_id || !program_name || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stmt = db.prepare(`
        INSERT INTO epg_programs (channel_id, program_name, start_time, end_time, description, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(channel_id, program_name, start_time, end_time, description || null, category || null);

      const program = db.prepare('SELECT * FROM epg_programs WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/recordings', (req, res) => {
    try {
      const { status } = req.query;

      let query = 'SELECT * FROM recording_schedules WHERE 1=1';
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY scheduled_time ASC';

      const recordings = db.prepare(query).all(...params);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/recordings', (req, res) => {
    try {
      const { program_id, channel_id, program_name, scheduled_time, end_time } = req.body;

      if (!scheduled_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stmt = db.prepare(`
        INSERT INTO recording_schedules (program_id, channel_id, program_name, scheduled_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `);

      const result = stmt.run(program_id || null, channel_id || null, program_name || null, scheduled_time, end_time);

      const recording = db.prepare('SELECT * FROM recording_schedules WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(recording);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/recordings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { status, completed_time, file_path } = req.body;

      const recording = db.prepare('SELECT * FROM recording_schedules WHERE id = ?').get(id);
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      const stmt = db.prepare(`
        UPDATE recording_schedules
        SET status = COALESCE(?, status),
            completed_time = COALESCE(?, completed_time),
            file_path = COALESCE(?, file_path)
        WHERE id = ?
      `);

      stmt.run(status, completed_time, file_path, id);

      const updatedRecording = db.prepare('SELECT * FROM recording_schedules WHERE id = ?').get(id);
      res.json(updatedRecording);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/recordings/:id', (req, res) => {
    try {
      const { id } = req.params;

      const recording = db.prepare('SELECT * FROM recording_schedules WHERE id = ?').get(id);
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      db.prepare('DELETE FROM recording_schedules WHERE id = ?').run(id);

      res.json({ message: 'Recording deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
