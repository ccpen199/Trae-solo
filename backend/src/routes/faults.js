const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();
router.use(authenticateToken);

// 获取故障码列表
router.get('/dtcs', [
  query('category').optional(),
  query('search').optional(),
], async (req, res) => {
  try {
    const { category, search } = req.query;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(dtc_code ILIKE $${paramIndex} OR dtc_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT * FROM dtcs
      ${whereClause}
      ORDER BY dtc_code
    `, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('获取故障码列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取故障码详情
router.get('/dtcs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM dtcs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '故障码不存在' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取故障码详情错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建故障码
router.post('/dtcs', [
  body('dtc_code').notEmpty().withMessage('故障码不能为空'),
  body('dtc_name').notEmpty().withMessage('故障码名称不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dtc_code, dtc_name, category, severity, description, possible_causes, troubleshooting_steps } = req.body;

    const result = await pool.query(`
      INSERT INTO dtcs (dtc_code, dtc_name, category, severity, description, possible_causes, troubleshooting_steps)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [dtc_code, dtc_name, category || '传感器异常', severity || 'medium', description, possible_causes, troubleshooting_steps]);

    await logAudit(req, 'create', 'dtcs', 'dtc', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: '故障码已存在' });
    }
    console.error('创建故障码错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取故障记录列表
router.get('/records', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('vehicle_id').optional().isInt().toInt(),
  query('status').optional(),
  query('fault_category').optional(),
  query('severity').optional(),
], async (req, res) => {
  try {
    const { page = 1, limit = 10, vehicle_id, status, fault_category, severity } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (vehicle_id) {
      whereConditions.push(`fr.vehicle_id = $${paramIndex}`);
      queryParams.push(vehicle_id);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`fr.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (fault_category) {
      whereConditions.push(`fr.fault_category = $${paramIndex}`);
      queryParams.push(fault_category);
      paramIndex++;
    }

    if (severity) {
      whereConditions.push(`fr.severity = $${paramIndex}`);
      queryParams.push(severity);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM fault_records fr ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const recordsQuery = `
      SELECT fr.*, v.vin, v.ecu_serial, vm.model_name, d.dtc_code, d.dtc_name, u.name as repair_user_name
      FROM fault_records fr
      LEFT JOIN vehicles v ON fr.vehicle_id = v.id
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      LEFT JOIN dtcs d ON fr.dtc_id = d.id
      LEFT JOIN users u ON fr.repair_user_id = u.id
      ${whereClause}
      ORDER BY fr.occurrence_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(recordsQuery, queryParams);

    res.json({
      records: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('获取故障记录列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取故障记录详情
router.get('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT fr.*, v.vin, v.license_plate, v.ecu_serial, vm.model_name, 
             d.dtc_code, d.dtc_name, d.category as dtc_category,
             d.description as dtc_description, d.possible_causes, d.troubleshooting_steps,
             u.name as repair_user_name
      FROM fault_records fr
      LEFT JOIN vehicles v ON fr.vehicle_id = v.id
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      LEFT JOIN dtcs d ON fr.dtc_id = d.id
      LEFT JOIN users u ON fr.repair_user_id = u.id
      WHERE fr.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '故障记录不存在' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取故障记录详情错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建故障记录
router.post('/records', [
  body('vehicle_id').isInt().withMessage('车辆ID不能为空'),
  body('fault_code').notEmpty().withMessage('故障码不能为空'),
  body('fault_name').notEmpty().withMessage('故障名称不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      vehicle_id, dtc_id, fault_category, fault_code, fault_name, severity,
      source_sensor, source_actuator, details, suggestion
    } = req.body;

    let actualCategory = fault_category;
    let actualSeverity = severity || 'medium';

    if (dtc_id) {
      const dtcResult = await pool.query('SELECT category, severity FROM dtcs WHERE id = $1', [dtc_id]);
      if (dtcResult.rows.length > 0) {
        actualCategory = actualCategory || dtcResult.rows[0].category;
        actualSeverity = severity || dtcResult.rows[0].severity;
      }
    }

    const result = await pool.query(`
      INSERT INTO fault_records (
        vehicle_id, dtc_id, fault_category, fault_code, fault_name, severity,
        occurrence_time, status, source_sensor, source_actuator, details, suggestion
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'active', $7, $8, $9, $10)
      RETURNING *
    `, [
      vehicle_id, dtc_id, actualCategory || '传感器异常', fault_code, fault_name, actualSeverity,
      source_sensor, source_actuator, details, suggestion
    ]);

    await logAudit(req, 'create', 'fault_records', 'fault_record', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('创建故障记录错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 清除故障
router.put('/records/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;

    const oldResult = await pool.query('SELECT * FROM fault_records WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '故障记录不存在' });
    }

    const result = await pool.query(`
      UPDATE fault_records 
      SET status = 'cleared', cleared_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    await logAudit(req, 'update', 'fault_records', 'fault_record', id, oldResult.rows[0], result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('清除故障错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 维修故障
router.put('/records/:id/repair', [
  body('repair_result').notEmpty().withMessage('维修结果不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { repair_result } = req.body;

    const oldResult = await pool.query('SELECT * FROM fault_records WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '故障记录不存在' });
    }

    const result = await pool.query(`
      UPDATE fault_records 
      SET status = 'repaired', repair_result = $1, repair_user_id = $2, repair_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [repair_result, req.user.id, id]);

    await logAudit(req, 'update', 'fault_records', 'fault_record', id, oldResult.rows[0], result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('维修故障错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取故障类别统计
router.get('/stats/categories', [
  query('vehicle_id').optional().isInt().toInt(),
  query('start_date').optional(),
  query('end_date').optional(),
], async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (vehicle_id) {
      whereConditions.push(`vehicle_id = $${paramIndex}`);
      queryParams.push(vehicle_id);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`occurrence_time >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`occurrence_time <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT 
        fault_category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count
      FROM fault_records
      ${whereClause}
      GROUP BY fault_category
      ORDER BY count DESC
    `, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('获取故障类别统计错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
