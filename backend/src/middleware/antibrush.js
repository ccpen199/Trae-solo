const db = require('../database');

const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 60;
const BRUSH_THRESHOLD = 10;

function checkRateLimit(fingerprint, action) {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW;
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM behavior_logs
    WHERE device_fingerprint = ? AND action = ? AND created_at > datetime(?, 'unixepoch')
  `).get(fingerprint, action, windowStart / 1000);
  
  return count.count < MAX_REQUESTS;
}

function analyzeBehaviorPattern(fingerprint) {
  const logs = db.prepare(`
    SELECT action, created_at FROM behavior_logs
    WHERE device_fingerprint = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(fingerprint);

  if (logs.length < 10) return { risk: 'low' };

  const actionCounts = {};
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  const resumeViews = actionCounts['view_resume'] || 0;
  const jobViews = actionCounts['view_job'] || 0;

  if (resumeViews > BRUSH_THRESHOLD || jobViews > BRUSH_THRESHOLD * 2) {
    return { risk: 'high', reason: 'Abnormally high view frequency' };
  }

  const timeIntervals = [];
  for (let i = 0; i < logs.length - 1; i++) {
    const t1 = new Date(logs[i].created_at).getTime();
    const t2 = new Date(logs[i + 1].created_at).getTime();
    timeIntervals.push(t1 - t2);
  }

  const avgInterval = timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length;
  if (avgInterval < 500 && logs.length > 20) {
    return { risk: 'high', reason: 'Automated behavior pattern detected' };
  }

  return { risk: 'low' };
}

function antiBrushMiddleware(req, res, next) {
  const fingerprint = req.headers['x-device-fingerprint'];
  const action = req.method + ':' + req.path;

  if (fingerprint) {
    if (!checkRateLimit(fingerprint, action)) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }

    const behavior = analyzeBehaviorPattern(fingerprint);
    if (behavior.risk === 'high') {
      console.warn(`High risk behavior detected: ${fingerprint} - ${behavior.reason}`);
    }
  }

  next();
}

module.exports = { antiBrushMiddleware, checkRateLimit, analyzeBehaviorPattern };
