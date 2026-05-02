import express from 'express';
import TraceService from '../services/traceService.js';

const router = express.Router();

router.get('/requests', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || null;

    const requests = TraceService.listRequests(limit, offset, status);
    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/requests/:requestId', (req, res) => {
  try {
    const request = TraceService.getRequestWithDetails(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: '请求记录不存在',
      });
    }
    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/player/:playerId/requests', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const requests = TraceService.getPlayerRequests(req.params.playerId, limit, offset);
    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/requests/:requestId/logs', (req, res) => {
  try {
    const logs = TraceService.getRequestLogs(req.params.requestId);
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;