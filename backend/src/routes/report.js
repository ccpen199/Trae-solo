const express = require('express');
const router = express.Router();
const reportAutoGenEngine = require('../engines/ReportAutoGenEngine');

router.post('/generate', async (req, res) => {
  try {
    const { type, options } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: '请指定报告类型' });
    }

    const result = await reportAutoGenEngine.generateReport(type, options || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/daily', async (req, res) => {
  try {
    const { endTime } = req.body;
    const result = await reportAutoGenEngine.generateReport('daily', { endTime });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/weekly', async (req, res) => {
  try {
    const { endTime } = req.body;
    const result = await reportAutoGenEngine.generateReport('weekly', { endTime });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/monthly', async (req, res) => {
  try {
    const { endTime } = req.body;
    const result = await reportAutoGenEngine.generateReport('monthly', { endTime });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/quarterly', async (req, res) => {
  try {
    const { endTime } = req.body;
    const result = await reportAutoGenEngine.generateReport('quarterly', { endTime });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/yearly', async (req, res) => {
  try {
    const { endTime } = req.body;
    const result = await reportAutoGenEngine.generateReport('yearly', { endTime });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/event', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: '请指定事件ID' });
    }

    const result = await reportAutoGenEngine.generateReport('event', { eventId });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate/custom', async (req, res) => {
  try {
    const { startTime, endTime, title, enterpriseIds, types } = req.body;
    const result = await reportAutoGenEngine.generateReport('custom', {
      startTime,
      endTime,
      title,
      enterpriseIds,
      types,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    const result = await reportAutoGenEngine.listReports(type, parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await reportAutoGenEngine.getReport(id);

    if (!result) {
      return res.status(404).json({ success: false, error: '报告不存在' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
