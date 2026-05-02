const express = require('express');
const router = express.Router();
const monitorService = require('../services/MonitorService');
const geoFencingEngine = require('../engines/GeoFencingEngine');

router.get('/points', async (req, res) => {
  try {
    const { type, status, enterpriseId, page = 1, pageSize = 20 } = req.query;
    const result = await monitorService.getMonitorPoints(
      { type, status, enterpriseId },
      parseInt(page),
      parseInt(pageSize)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/points', async (req, res) => {
  try {
    const data = req.body;
    const result = await monitorService.createMonitorPoint(data);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/points/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const result = await monitorService.updateMonitorPoint(id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/points/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await monitorService.deleteMonitorPoint(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/points/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, page = 1, pageSize = 100 } = req.query;
    const result = await monitorService.getMonitorData(
      id,
      startTime,
      endTime,
      parseInt(page),
      parseInt(pageSize)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/points/:id/data/latest', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await monitorService.getLatestData(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/data/ingest', async (req, res) => {
  try {
    const { monitorPointId, rawData, dataTime } = req.body;
    const result = await monitorService.ingestMonitorData(
      monitorPointId,
      rawData,
      dataTime
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/real-time', async (req, res) => {
  try {
    const { monitorPointIds } = req.query;
    const ids = monitorPointIds ? monitorPointIds.split(',') : [];
    const result = await monitorService.getRealTimeStatus(ids);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/realtime', async (req, res) => {
  try {
    const { monitorPointIds } = req.query;
    const ids = monitorPointIds ? monitorPointIds.split(',') : [];
    const result = await monitorService.getRealTimeStatus(ids);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/heatmap', async (req, res) => {
  try {
    const { type = 'all', hours = 24 } = req.query;
    const result = await geoFencingEngine.getHeatMapData(type, { hours: parseInt(hours) });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/fences', async (req, res) => {
  try {
    const data = req.body;
    const result = await geoFencingEngine.createFence(data);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/fences/stats', async (req, res) => {
  try {
    const { enterpriseId } = req.query;
    const result = await geoFencingEngine.getFenceStats(enterpriseId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/fences/generate/enterprise', async (req, res) => {
  try {
    const { enterpriseId } = req.body;
    const result = await geoFencingEngine.generateEnterpriseFence(enterpriseId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
