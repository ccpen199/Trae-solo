const express = require('express');
const router = express.Router();
const violationService = require('../services/ViolationService');
const pollutionTrajectoryEngine = require('../engines/PollutionTrajectoryEngine');

router.get('/', async (req, res) => {
  try {
    const { status, type, enterpriseId, startTime, endTime, page = 1, pageSize = 20 } = req.query;
    const result = await violationService.getViolationEvents(
      { status, type, enterpriseId, startTime, endTime },
      parseInt(page),
      parseInt(pageSize)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const { enterpriseId, startTime, endTime } = req.query;
    const result = await violationService.getStatistics({
      enterpriseId,
      startTime,
      endTime,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await violationService.getViolationDetail(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await violationService.enterpriseRespond(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await violationService.escalateToInspection(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pollutionTrajectoryEngine.analyzeViolation(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inspections/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { regulatorId } = req.body;
    const result = await violationService.assignInspectionOrder(id, regulatorId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inspections/:id/result', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await violationService.submitInspectionResult(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/rectification', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await violationService.submitRectification(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rectifications/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await violationService.reviewRectification(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/check-overdue', async (req, res) => {
  try {
    const result = await violationService.checkOverdueResponses();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
