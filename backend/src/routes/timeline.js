const express = require('express');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireRole, PERMISSIONS, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const TimelineEngine = require('../engines/TimelineEngine');

const router = express.Router();

router.get('/live/:liveStreamId', asyncHandler(async (req, res) => {
  const { liveStreamId } = req.params;
  const { limit = 100, offset = 0, eventTypes, startTime, endTime } = req.query;

  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  if (eventTypes) {
    options.eventTypes = eventTypes.split(',');
  }

  if (startTime) {
    options.startTime = parseInt(startTime);
  }

  if (endTime) {
    options.endTime = parseInt(endTime);
  }

  const events = await TimelineEngine.getLiveTimeline(liveStreamId, options);

  res.json({
    success: true,
    data: {
      list: events,
      limit: options.limit,
      offset: options.offset
    }
  });
}));

router.get('/my', asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, eventTypes } = req.query;

  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  if (eventTypes) {
    options.eventTypes = eventTypes.split(',');
  }

  const events = await TimelineEngine.getUserTimeline(req.user.id, options);

  res.json({
    success: true,
    data: {
      list: events,
      limit: options.limit,
      offset: options.offset
    }
  });
}));

router.get('/audit', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { limit = 500, offset = 0, eventTypes, startTime, endTime, userId, liveStreamId } = req.query;

  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  if (eventTypes) {
    options.eventTypes = eventTypes.split(',');
  }

  if (startTime) {
    options.startTime = parseInt(startTime);
  }

  if (endTime) {
    options.endTime = parseInt(endTime);
  }

  if (userId) {
    options.userId = userId;
  }

  if (liveStreamId) {
    options.liveStreamId = liveStreamId;
  }

  const events = await TimelineEngine.getAuditLog(options);

  res.json({
    success: true,
    data: {
      list: events,
      limit: options.limit,
      offset: options.offset
    }
  });
}));

router.get('/live/:liveStreamId/stats', asyncHandler(async (req, res) => {
  const { liveStreamId } = req.params;

  const stats = await TimelineEngine.getStatistics(liveStreamId);

  if (!stats) {
    throw new AppError('直播间不存在', 404, 'LIVE_STREAM_NOT_FOUND');
  }

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
