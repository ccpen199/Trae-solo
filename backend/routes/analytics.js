import express from 'express';

export default function analyticsRoutes(db) {
  const router = express.Router();

  router.get('/usage', (req, res) => {
    try {
      const { device_id, start_date, end_date } = req.query;

      let query = 'SELECT * FROM usage_reports WHERE 1=1';
      const params = [];

      if (device_id) {
        query += ' AND device_id = ?';
        params.push(device_id);
      }

      if (start_date) {
        query += ' AND report_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND report_date <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY report_date DESC';

      const reports = db.prepare(query).all(...params);
      const parsedReports = reports.map(report => ({
        ...report,
        metadata: report.metadata ? JSON.parse(report.metadata) : null
      }));
      res.json(parsedReports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/usage', (req, res) => {
    try {
      const { device_id, report_date, total_duration, control_count, avg_power_level, metadata } = req.body;

      if (!device_id || !report_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stmt = db.prepare(`
        INSERT INTO usage_reports (device_id, report_date, total_duration, control_count, avg_power_level, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        device_id,
        report_date,
        total_duration || 0,
        control_count || 0,
        avg_power_level || null,
        metadata ? JSON.stringify(metadata) : null
      );

      const report = db.prepare('SELECT * FROM usage_reports WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({
        ...report,
        metadata: report.metadata ? JSON.parse(report.metadata) : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/preferences', (req, res) => {
    try {
      const { user_id } = req.query;

      const watchLogs = db.prepare(`
        SELECT category, COUNT(*) as watch_count, SUM(watch_duration) as total_duration
        FROM watch_logs
        GROUP BY category
        ORDER BY total_duration DESC
      `).all();

      const totalWatchTime = watchLogs.reduce((sum, log) => sum + (log.total_duration || 0), 0);

      const preferences = watchLogs.map(log => ({
        category: log.category,
        watch_count: log.watch_count,
        total_duration: log.total_duration,
        percentage: totalWatchTime > 0 ? ((log.total_duration / totalWatchTime) * 100).toFixed(2) : 0
      }));

      const interestTags = preferences
        .filter(p => parseFloat(p.percentage) > 10)
        .map(p => p.category);

      res.json({
        preferences,
        interest_tags: interestTags,
        total_watch_time: totalWatchTime
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/watch-logs', (req, res) => {
    try {
      const { channel_id, program_id, watch_duration, skip_count, category } = req.body;

      if (!channel_id || !watch_duration) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stmt = db.prepare(`
        INSERT INTO watch_logs (channel_id, program_id, watch_duration, skip_count, category)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(channel_id, program_id || null, watch_duration, skip_count || 0, category || null);

      const log = db.prepare('SELECT * FROM watch_logs WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/trends', (req, res) => {
    try {
      const { device_id, days } = req.query;
      const daysNum = parseInt(days) || 7;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      let query = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as control_count,
          AVG(response_time) as avg_response_time
        FROM control_logs
        WHERE created_at >= ?
      `;
      const params = [startDate.toISOString()];

      if (device_id) {
        query += ' AND device_id = ?';
        params.push(device_id);
      }

      query += ' GROUP BY DATE(created_at) ORDER BY date ASC';

      const trends = db.prepare(query).all(...params);

      const usageQuery = `
        SELECT
          report_date,
          SUM(total_duration) as total_duration,
          SUM(control_count) as control_count
        FROM usage_reports
        WHERE report_date >= ?
      `;
      const usageParams = [startDate.toISOString().split('T')[0]];

      if (device_id) {
        usageQuery += ' AND device_id = ?';
        usageParams.push(device_id);
      }

      usageQuery += ' GROUP BY report_date ORDER BY report_date ASC';

      const usage = db.prepare(usageQuery).all(...usageParams);

      res.json({
        control_trends: trends,
        usage_trends: usage,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days: daysNum
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
