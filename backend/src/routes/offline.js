const express = require('express');
const { db } = require('../db');
const { logCommand } = require('../middleware/commandLogger');
const { getCachedData, setCachedData } = require('../middleware/networkDetector');

const router = express.Router();

router.get('/codes', (req, res) => {
  const { user } = req;
  const cacheKey = `offline_codes_user_${user.id}`;

  if (req.networkStatus === 'weak') {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logCommand(user.id, null, null, 'offline:codes:cache', true, null, req.networkStatus);
      return res.json({
        source: 'cache',
        network_status: req.networkStatus,
        cached_at: cached.cached_at,
        expires_at: cached.expires_at,
        devices: cached.devices
      });
    }
  }

  const devices = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.room,
      d.device_type_id,
      dt.name as device_type_name,
      dt.category,
      d.brand_id,
      b.name as brand_name,
      d.model_id,
      m.model_number,
      m.code_format,
      m.frequency,
      m.version
    FROM user_devices d
    JOIN device_types dt ON d.device_type_id = dt.id
    JOIN brands b ON d.brand_id = b.id
    JOIN ir_code_models m ON d.model_id = m.id
    WHERE d.user_id = ?
    ORDER BY d.room, d.name
  `).all(user.id);

  const devicesWithCodes = devices.map(d => {
    const codes = db.prepare(`
      SELECT id, command_name, code_data
      FROM ir_codes
      WHERE ir_code_model_id = ?
      ORDER BY command_name
    `).all(d.model_id);

    const learnedCodes = db.prepare(`
      SELECT id, command_name, raw_code_data, confidence_score
      FROM learned_ir_codes
      WHERE user_id = ? AND device_id = ?
      ORDER BY created_at DESC
    `).all(user.id, d.id);

    return {
      ...d,
      standard_codes: codes,
      learned_codes: learnedCodes
    };
  });

  const sceneData = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.description,
      s.icon,
      s.is_active,
      JSON_GROUP_ARRAY(
        JSON_OBJECT(
          'id', sa.id,
          'device_id', sa.device_id,
          'command', sa.command,
          'params', sa.params,
          'delay_seconds', sa.delay_seconds,
          'order_index', sa.order_index
        )
      ) as actions_json
    FROM scenes s
    LEFT JOIN scene_actions sa ON s.id = sa.scene_id
    WHERE s.user_id = ? AND s.is_active = 1
    GROUP BY s.id
    ORDER BY s.name
  `).all(user.id);

  const scenes = sceneData.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    is_active: s.is_active,
    actions: JSON.parse(s.actions_json || '[]').filter(a => a.id !== null)
  }));

  const result = {
    source: 'database',
    network_status: req.networkStatus,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    devices: devicesWithCodes,
    scenes
  };

  setCachedData(cacheKey, {
    cached_at: result.cached_at,
    expires_at: result.expires_at,
    devices: devicesWithCodes,
    scenes
  }, 24);

  logCommand(user.id, null, null, 'offline:codes', true, null, req.networkStatus);

  res.json(result);
});

router.post('/sync', (req, res) => {
  const { user } = req;
  const { pending_commands, learned_codes } = req.body;

  const syncResults = {
    commands_synced: 0,
    commands_failed: 0,
    learned_synced: 0,
    learned_failed: 0,
    details: []
  };

  if (pending_commands && Array.isArray(pending_commands)) {
    for (const cmd of pending_commands) {
      try {
        const logResult = db.prepare(`
          INSERT INTO command_logs (user_id, device_id, ir_code_id, command, success, error_message, network_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          user.id,
          cmd.device_id,
          cmd.ir_code_id || null,
          cmd.command,
          cmd.success ? 1 : 0,
          cmd.error_message || null,
          'offline_sync'
        );
        syncResults.commands_synced++;
        syncResults.details.push({ type: 'command', id: logResult.lastInsertRowid, success: true });
      } catch (err) {
        syncResults.commands_failed++;
        syncResults.details.push({ type: 'command', error: err.message, success: false });
      }
    }
  }

  if (learned_codes && Array.isArray(learned_codes)) {
    for (const code of learned_codes) {
      try {
        const result = db.prepare(`
          INSERT INTO learned_ir_codes (user_id, device_id, command_name, raw_code_data, matched_model_id, confidence_score)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          user.id,
          code.device_id,
          code.command_name,
          code.raw_code_data,
          code.matched_model_id || null,
          code.confidence_score || null
        );
        syncResults.learned_synced++;
        syncResults.details.push({ type: 'learned', id: result.lastInsertRowid, success: true });
      } catch (err) {
        syncResults.learned_failed++;
        syncResults.details.push({ type: 'learned', error: err.message, success: false });
      }
    }
  }

  const cacheKey = `offline_codes_user_${user.id}`;
  db.prepare('DELETE FROM offline_cache WHERE cache_key = ?').run(cacheKey);

  logCommand(user.id, null, null, 'offline:sync', true, null, req.networkStatus);

  res.json({
    success: true,
    synced_at: new Date().toISOString(),
    network_status: req.networkStatus,
    ...syncResults
  });
});

router.get('/cache-status', (req, res) => {
  const { user } = req;

  const caches = db.prepare(`
    SELECT 
      cache_key,
      created_at,
      expires_at,
      CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END as is_valid
    FROM offline_cache
    WHERE cache_key LIKE ?
    ORDER BY created_at DESC
  `).all(`%user_${user.id}%`);

  const now = new Date();
  const validCaches = caches.filter(c => c.is_valid).length;
  const expiredCaches = caches.length - validCaches;

  logCommand(user.id, null, null, 'offline:cache-status', true, null, req.networkStatus);

  res.json({
    network_status: req.networkStatus,
    total_caches: caches.length,
    valid_caches: validCaches,
    expired_caches: expiredCaches,
    caches: caches.map(c => ({
      ...c,
      expires_in_minutes: c.is_valid 
        ? Math.round((new Date(c.expires_at) - now) / 60000)
        : 0
    }))
  });
});

router.delete('/cache', (req, res) => {
  const { user } = req;
  const { cacheKey } = req.query;

  if (cacheKey) {
    db.prepare('DELETE FROM offline_cache WHERE cache_key = ?').run(cacheKey);
  } else {
    db.prepare('DELETE FROM offline_cache WHERE cache_key LIKE ?').run(`%user_${user.id}%`);
  }

  logCommand(user.id, null, null, 'offline:cache-clear', true, null, req.networkStatus);

  res.json({
    success: true,
    message: cacheKey ? `Cache ${cacheKey} cleared` : 'All offline caches cleared'
  });
});

module.exports = router;
