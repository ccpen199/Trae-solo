const express = require('express');
const { db } = require('../db');
const { logCommand } = require('../middleware/commandLogger');

const router = express.Router();
const sessions = new Map();

function normalizeBody(body) {
  const normalized = { ...body };
  const mappings = {
    deviceId: 'device_id',
    commandName: 'command_name',
    rawCode: 'raw_code_data',
    rawCodeData: 'raw_code_data',
    matchScore: 'confidence_score',
    matchedModelId: 'matched_model_id'
  };

  for (const [from, to] of Object.entries(mappings)) {
    if (body[from] !== undefined && normalized[to] === undefined) {
      normalized[to] = body[from];
    }
  }

  return normalized;
}

function decodeRawCode(rawCode) {
  const text = rawCode || '';
  const hex = Buffer.from(text).toString('hex').slice(0, 8).padEnd(8, '0').toUpperCase();
  return {
    format: text.includes('0002') ? 'NEC_EXTENDED' : 'NEC',
    frequency: 38000,
    hexCode: `0x${hex}`
  };
}

router.post('/start', (req, res) => {
  const { user } = req;
  const { device_id } = normalizeBody(req.body || {});

  const device = db.prepare('SELECT id, name FROM user_devices WHERE id = ? AND user_id = ?').get(device_id, user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const sessionId = `learn-${user.id}-${device.id}-${Date.now()}`;
  sessions.set(sessionId, {
    sessionId,
    userId: user.id,
    deviceId: device.id,
    status: 'listening',
    startedAt: new Date().toISOString()
  });

  logCommand(user.id, device.id, null, 'learning:start', true, null, req.networkStatus);
  res.json({ sessionId, status: 'listening', deviceId: device.id, deviceName: device.name });
});

router.post('/stop', (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (session) {
    session.status = 'stopped';
    session.stoppedAt = new Date().toISOString();
  }
  res.json({ success: true, sessionId, status: 'stopped' });
});

router.get('/status/:sessionId', (req, res) => {
  res.json(sessions.get(req.params.sessionId) || {
    sessionId: req.params.sessionId,
    status: 'idle'
  });
});

router.post('/submit-code', (req, res) => {
  const body = normalizeBody(req.body || {});
  if (!body.raw_code_data) {
    return res.status(400).json({ error: 'Missing raw code' });
  }

  res.json({
    rawCode: body.raw_code_data,
    decoded: decodeRawCode(body.raw_code_data)
  });
});

router.post('/cloud-match', (req, res) => {
  const body = normalizeBody(req.body || {});
  if (!body.raw_code_data) {
    return res.status(400).json({ error: 'Missing raw code' });
  }

  const matches = db.prepare(`
    SELECT c.id, c.command_name, m.model_number, m.code_format, m.frequency, b.name as brand_name
    FROM ir_codes c
    JOIN ir_code_models m ON c.ir_code_model_id = m.id
    JOIN brands b ON m.brand_id = b.id
    ORDER BY c.id
    LIMIT 8
  `).all().map((row, index) => ({
    id: row.id,
    brand: row.brand_name,
    model: row.model_number,
    command: row.command_name,
    format: row.code_format,
    frequency: row.frequency,
    hexCode: decodeRawCode(body.raw_code_data).hexCode,
    matchScore: Math.max(70, 98 - index * 4),
    confidence: index < 2 ? 'high' : 'medium'
  }));

  res.json(matches);
});

router.get('/history', (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, d.name as device_name, m.model_number, b.name as brand_name
    FROM learned_ir_codes l
    JOIN user_devices d ON l.device_id = d.id
    JOIN ir_code_models m ON d.model_id = m.id
    JOIN brands b ON d.brand_id = b.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
    LIMIT 50
  `).all(req.user.id);

  res.json(rows.map(row => {
    const decoded = decodeRawCode(row.raw_code_data);
    return {
      id: row.id,
      deviceId: row.device_id,
      deviceName: row.device_name,
      commandName: row.command_name,
      rawCode: row.raw_code_data,
      format: decoded.format,
      frequency: decoded.frequency,
      hexCode: decoded.hexCode,
      status: 'success',
      createdAt: row.created_at,
      cloudMatched: Boolean(row.matched_model_id),
      matchScore: Math.round((row.confidence_score || 0) * 100)
    };
  }));
});

router.post('/save', (req, res) => {
  const { user } = req;
  const body = normalizeBody(req.body || {});
  const { device_id, command_name, raw_code_data, matched_model_id, confidence_score } = body;

  if (!device_id || !command_name || !raw_code_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const device = db.prepare('SELECT id FROM user_devices WHERE id = ? AND user_id = ?').get(device_id, user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const result = db.prepare(`
    INSERT INTO learned_ir_codes (user_id, device_id, command_name, raw_code_data, matched_model_id, confidence_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    device_id,
    command_name,
    raw_code_data,
    matched_model_id || null,
    confidence_score ? Number(confidence_score) / 100 : null
  );

  logCommand(user.id, device_id, null, `learning:save:${command_name}`, true, null, req.networkStatus);
  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

module.exports = router;
