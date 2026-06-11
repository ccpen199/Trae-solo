const express = require('express');
const { db } = require('../db');
const { logCommand, detectDeviceTypeByCommand, updatePowerStats, updateLastUsed } = require('../middleware/commandLogger');
const { getCachedData, setCachedData } = require('../middleware/networkDetector');

const router = express.Router();

function calculateConfidence(rawCode, modelCode) {
  if (!rawCode || !modelCode) return 0;
  const raw = Buffer.from(rawCode, 'base64').toString();
  const model = Buffer.from(modelCode, 'base64').toString();
  
  let matches = 0;
  const minLen = Math.min(raw.length, model.length);
  for (let i = 0; i < minLen; i++) {
    if (raw[i] === model[i]) matches++;
  }
  return matches / Math.max(raw.length, model.length);
}

function normalizeBody(body) {
  const normalized = { ...body };
  const mappings = {
    deviceId: 'device_id',
    irCodeId: 'ir_code_id',
    commandName: 'command_name',
    rawCodeData: 'raw_code_data',
    sceneId: 'scene_id',
    typeId: 'type_id',
    brandId: 'brand_id'
  };
  for (const [camel, snake] of Object.entries(mappings)) {
    if (body[camel] !== undefined && body[snake] === undefined) {
      normalized[snake] = body[camel];
    }
  }
  return normalized;
}

router.post('/send', (req, res) => {
  const { user } = req;
  const body = normalizeBody(req.body);
  const { device_id, command, ir_code_id, params } = body;

  if (!device_id || !command) {
    return res.status(400).json({ error: 'Missing device_id or command' });
  }

  const device = db.prepare(`
    SELECT ud.*, m.code_format, m.frequency
    FROM user_devices ud
    JOIN ir_code_models m ON ud.model_id = m.id
    WHERE ud.id = ? AND ud.user_id = ?
  `).get(device_id, user.id);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  let irCode;
  if (ir_code_id) {
    irCode = db.prepare('SELECT * FROM ir_codes WHERE id = ? AND ir_code_model_id = ?').get(ir_code_id, device.model_id);
  } else {
    irCode = db.prepare('SELECT * FROM ir_codes WHERE ir_code_model_id = ? AND command_name = ?').get(device.model_id, command);
  }

  if (!irCode) {
    logCommand(user.id, device_id, null, command, false, 'IR code not found', req.networkStatus);
    return res.status(404).json({ error: 'IR code not found for this command' });
  }

  let useCache = false;
  let cachedResult = null;
  if (req.networkStatus === 'weak') {
    const cacheKey = `ir_send_${device_id}_${command}`;
    cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      useCache = true;
    } else {
      setCachedData(cacheKey, { irCode, params }, 24);
    }
  }

  const detectedType = detectDeviceTypeByCommand(command);
  
  const success = useCache || Math.random() > 0.05;

  if (success) {
    updateLastUsed(device_id);
    if (command === 'power' || command.includes('mode_')) {
      updatePowerStats(user.id, device_id, 15);
    }
  }

  logCommand(user.id, device_id, irCode.id, command, success, success ? null : 'IR transmission failed', req.networkStatus);

  const response = {
    success,
    device_id,
    command,
    params: params || {},
    code_format: device.code_format,
    frequency: device.frequency,
    code_data: irCode.code_data,
    detected_type: detectedType,
    used_cache: useCache,
    network_status: req.networkStatus
  };

  if (!success) {
    return res.status(503).json(response);
  }

  res.json(response);
});

router.post('/learn', (req, res) => {
  const { user } = req;
  const body = normalizeBody(req.body);
  const { device_id, command_name, raw_code_data } = body;

  if (!device_id || !command_name || !raw_code_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const device = db.prepare('SELECT * FROM user_devices WHERE id = ? AND user_id = ?').get(device_id, user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const allCodes = db.prepare(`
    SELECT c.*, m.brand_id, m.device_type_id
    FROM ir_codes c
    JOIN ir_code_models m ON c.ir_code_model_id = m.id
  `).all();

  let bestMatch = null;
  let bestConfidence = 0;

  for (const code of allCodes) {
    const confidence = calculateConfidence(raw_code_data, code.code_data);
    if (confidence > bestConfidence && confidence > 0.6) {
      bestConfidence = confidence;
      bestMatch = code;
    }
  }

  const result = db.prepare(`
    INSERT INTO learned_ir_codes (user_id, device_id, command_name, raw_code_data, matched_model_id, confidence_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    device_id,
    command_name,
    raw_code_data,
    bestMatch ? bestMatch.ir_code_model_id : null,
    Number(bestConfidence.toFixed(4))
  );

  const learned = db.prepare('SELECT * FROM learned_ir_codes WHERE id = ?').get(result.lastInsertRowid);

  logCommand(user.id, device_id, null, `learn:${command_name}`, true, null, req.networkStatus);

  res.status(201).json({
    ...learned,
    matched: bestMatch ? {
      model_id: bestMatch.ir_code_model_id,
      command_name: bestMatch.command_name,
      confidence: bestConfidence
    } : null
  });
});

router.get('/match', (req, res) => {
  const { rawCode } = req.query;

  if (!rawCode) {
    return res.status(400).json({ error: 'Missing rawCode parameter' });
  }

  const allCodes = db.prepare(`
    SELECT c.*, m.brand_id, m.device_type_id, m.model_number,
      b.name as brand_name, dt.name as type_name, dt.category
    FROM ir_codes c
    JOIN ir_code_models m ON c.ir_code_model_id = m.id
    JOIN brands b ON m.brand_id = b.id
    JOIN device_types dt ON m.device_type_id = dt.id
  `).all();

  const matches = [];
  for (const code of allCodes) {
    const confidence = calculateConfidence(rawCode, code.code_data);
    if (confidence > 0.5) {
      matches.push({
        confidence: Number(confidence.toFixed(4)),
        ir_code_id: code.id,
        command_name: code.command_name,
        model_id: code.ir_code_model_id,
        model_number: code.model_number,
        brand_id: code.brand_id,
        brand_name: code.brand_name,
        device_type_id: code.device_type_id,
        device_type_name: code.type_name,
        category: code.category
      });
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);
  const topMatches = matches.slice(0, 10);

  const detectedType = detectDeviceTypeByCommand(rawCode);

  res.json({
    raw_code: rawCode,
    detected_type: detectedType,
    matches: topMatches,
    total_matches: matches.length
  });
});

router.get('/learned', (req, res) => {
  const { user } = req;
  const { deviceId } = req.query;

  let sql = `
    SELECT l.*,
      d.name as device_name,
      m.model_number,
      b.name as brand_name
    FROM learned_ir_codes l
    JOIN user_devices d ON l.device_id = d.id
    JOIN ir_code_models m ON d.model_id = m.id
    JOIN brands b ON d.brand_id = b.id
    WHERE l.user_id = ?
  `;
  const params = [user.id];
  
  if (deviceId) {
    sql += ' AND l.device_id = ?';
    params.push(deviceId);
  }
  sql += ' ORDER BY l.created_at DESC';

  const learned = db.prepare(sql).all(...params);
  res.json(learned);
});

module.exports = router;
