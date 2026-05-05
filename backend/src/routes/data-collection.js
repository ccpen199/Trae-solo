const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();
router.use(authenticateToken);

// 创建数据采集会话
router.post('/sessions', [
  body('vehicle_id').isInt().withMessage('车辆ID不能为空'),
  body('protocol_type').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicle_id, protocol_type = 'CAN' } = req.body;
    const session_code = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const result = await pool.query(`
      INSERT INTO data_sessions (vehicle_id, session_code, protocol_type, created_by, status)
      VALUES ($1, $2, $3, $4, 'running')
      RETURNING *
    `, [vehicle_id, session_code, protocol_type, req.user.id]);

    await logAudit(req, 'create', 'data_sessions', 'session', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('创建数据采集会话错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取数据采集会话列表
router.get('/sessions', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('vehicle_id').optional().isInt().toInt(),
  query('status').optional(),
], async (req, res) => {
  try {
    const { page = 1, limit = 10, vehicle_id, status } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (vehicle_id) {
      whereConditions.push(`ds.vehicle_id = $${paramIndex}`);
      queryParams.push(vehicle_id);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`ds.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM data_sessions ds ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const sessionsQuery = `
      SELECT ds.*, v.vin, v.ecu_serial, vm.model_name, u.name as created_by_name
      FROM data_sessions ds
      LEFT JOIN vehicles v ON ds.vehicle_id = v.id
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      LEFT JOIN users u ON ds.created_by = u.id
      ${whereClause}
      ORDER BY ds.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(sessionsQuery, queryParams);

    res.json({
      sessions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('获取会话列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 结束数据采集会话
router.put('/sessions/:id/end', async (req, res) => {
  try {
    const { id } = req.params;

    const oldResult = await pool.query('SELECT * FROM data_sessions WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM time_series_data WHERE session_id = $1',
      [id]
    );
    const totalSamples = parseInt(countResult.rows[0].total);

    const result = await pool.query(`
      UPDATE data_sessions 
      SET status = 'completed', end_time = CURRENT_TIMESTAMP, total_samples = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [totalSamples, id]);

    await logAudit(req, 'update', 'data_sessions', 'session', id, oldResult.rows[0], result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('结束会话错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 添加时序数据
router.post('/time-series', [
  body('session_id').isInt().withMessage('会话ID不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { session_id, vehicle_id, rpm, intake_pressure, intake_temp, coolant_temp, voltage, throttle_position, vehicle_speed, fuel_consumption, raw_data } = req.body;

    const sessionResult = await pool.query('SELECT vehicle_id FROM data_sessions WHERE id = $1', [session_id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const actualVehicleId = vehicle_id || sessionResult.rows[0].vehicle_id;

    const result = await pool.query(`
      INSERT INTO time_series_data (
        session_id, vehicle_id, rpm, intake_pressure, intake_temp, 
        coolant_temp, voltage, throttle_position, vehicle_speed, fuel_consumption, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, session_id, timestamp
    `, [session_id, actualVehicleId, rpm, intake_pressure, intake_temp, coolant_temp, voltage, throttle_position, vehicle_speed, fuel_consumption, raw_data ? JSON.stringify(raw_data) : null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('添加时序数据错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 批量添加时序数据
router.post('/time-series/batch', [
  body('session_id').isInt().withMessage('会话ID不能为空'),
  body('data').isArray().withMessage('数据必须是数组'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { session_id, vehicle_id, data } = req.body;

    const sessionResult = await pool.query('SELECT vehicle_id FROM data_sessions WHERE id = $1', [session_id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const actualVehicleId = vehicle_id || sessionResult.rows[0].vehicle_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of data) {
        await client.query(`
          INSERT INTO time_series_data (
            session_id, vehicle_id, rpm, intake_pressure, intake_temp, 
            coolant_temp, voltage, throttle_position, vehicle_speed, fuel_consumption, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [session_id, actualVehicleId, item.rpm, item.intake_pressure, item.intake_temp, item.coolant_temp, item.voltage, item.throttle_position, item.vehicle_speed, item.fuel_consumption, item.raw_data ? JSON.stringify(item.raw_data) : null]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: '批量插入成功', count: data.length });
  } catch (err) {
    console.error('批量添加时序数据错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取时序数据
router.get('/time-series', [
  query('session_id').optional().isInt().toInt(),
  query('vehicle_id').optional().isInt().toInt(),
  query('start_time').optional(),
  query('end_time').optional(),
  query('limit').optional().isInt({ min: 1, max: 10000 }).toInt(),
], async (req, res) => {
  try {
    const { session_id, vehicle_id, start_time, end_time, limit = 1000 } = req.query;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (session_id) {
      whereConditions.push(`session_id = $${paramIndex}`);
      queryParams.push(session_id);
      paramIndex++;
    }

    if (vehicle_id) {
      whereConditions.push(`vehicle_id = $${paramIndex}`);
      queryParams.push(vehicle_id);
      paramIndex++;
    }

    if (start_time) {
      whereConditions.push(`timestamp >= $${paramIndex}`);
      queryParams.push(start_time);
      paramIndex++;
    }

    if (end_time) {
      whereConditions.push(`timestamp <= $${paramIndex}`);
      queryParams.push(end_time);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT * FROM time_series_data
      ${whereClause}
      ORDER BY timestamp ASC
      LIMIT $${paramIndex}
    `;
    queryParams.push(limit);

    const result = await pool.query(dataQuery, queryParams);

    res.json({
      data: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('获取时序数据错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取时序数据统计信息
router.get('/time-series/stats', [
  query('session_id').isInt().toInt(),
], async (req, res) => {
  try {
    const { session_id } = req.query;

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_samples,
        MIN(timestamp) as first_sample_time,
        MAX(timestamp) as last_sample_time,
        AVG(rpm) as avg_rpm,
        MAX(rpm) as max_rpm,
        MIN(rpm) as min_rpm,
        AVG(coolant_temp) as avg_coolant_temp,
        MAX(coolant_temp) as max_coolant_temp,
        AVG(voltage) as avg_voltage,
        MIN(voltage) as min_voltage,
        MAX(voltage) as max_voltage
      FROM time_series_data
      WHERE session_id = $1
    `, [session_id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取时序数据统计错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取通讯日志
router.get('/communication-logs', [
  query('vehicle_id').optional().isInt().toInt(),
  query('session_id').optional().isInt().toInt(),
  query('is_success').optional(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], async (req, res) => {
  try {
    const { vehicle_id, session_id, is_success, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (vehicle_id) {
      whereConditions.push(`vehicle_id = $${paramIndex}`);
      queryParams.push(vehicle_id);
      paramIndex++;
    }

    if (session_id) {
      whereConditions.push(`session_id = $${paramIndex}`);
      queryParams.push(session_id);
      paramIndex++;
    }

    if (is_success !== undefined) {
      whereConditions.push(`is_success = $${paramIndex}`);
      queryParams.push(is_success === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM communication_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const logsQuery = `
      SELECT * FROM communication_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(logsQuery, queryParams);

    res.json({
      logs: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('获取通讯日志错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 记录通讯日志
router.post('/communication-logs', async (req, res) => {
  try {
    const { vehicle_id, session_id, protocol_type, direction, message_type, message_data, response_time_ms, is_success, error_message } = req.body;

    const result = await pool.query(`
      INSERT INTO communication_logs (
        vehicle_id, session_id, protocol_type, direction, message_type, 
        message_data, response_time_ms, is_success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [vehicle_id, session_id, protocol_type || 'CAN', direction, message_type, message_data, response_time_ms, is_success !== false, error_message]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('记录通讯日志错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
