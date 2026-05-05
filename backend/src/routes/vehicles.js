const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();
router.use(authenticateToken);

// 获取车型列表
router.get('/models', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM vehicle_models ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('获取车型列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建车型
router.post('/models', [
  body('model_name').notEmpty().withMessage('车型名称不能为空'),
  body('model_code').notEmpty().withMessage('车型代码不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { model_name, model_code, engine_type, displacement, fuel_type, manufacturer, description } = req.body;

    const result = await pool.query(`
      INSERT INTO vehicle_models (model_name, model_code, engine_type, displacement, fuel_type, manufacturer, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [model_name, model_code, engine_type, displacement, fuel_type, manufacturer, description]);

    await logAudit(req, 'create', 'vehicle_models', 'vehicle_model', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: '车型代码已存在' });
    }
    console.error('创建车型错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取车辆列表（支持分页和搜索）
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional(),
  query('model_id').optional().isInt().toInt(),
  query('status').optional(),
], async (req, res) => {
  try {
    const { page = 1, limit = 10, search, model_id, status } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(v.vin ILIKE $${paramIndex} OR v.license_plate ILIKE $${paramIndex} OR v.ecu_serial ILIKE $${paramIndex} OR v.owner_name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (model_id) {
      whereConditions.push(`v.model_id = $${paramIndex}`);
      queryParams.push(model_id);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`v.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM vehicles v ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const vehiclesQuery = `
      SELECT v.*, vm.model_name, vm.model_code, vm.manufacturer
      FROM vehicles v
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      ${whereClause}
      ORDER BY v.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(vehiclesQuery, queryParams);

    res.json({
      vehicles: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('获取车辆列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取车辆详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleResult = await pool.query(`
      SELECT v.*, vm.model_name, vm.model_code, vm.engine_type, vm.displacement, vm.manufacturer
      FROM vehicles v
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      WHERE v.id = $1
    `, [id]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    const vehicle = vehicleResult.rows[0];

    const sensorsResult = await pool.query(`
      SELECT * FROM sensors WHERE vehicle_id = $1 ORDER BY created_at
    `, [id]);

    const actuatorsResult = await pool.query(`
      SELECT * FROM actuators WHERE vehicle_id = $1 ORDER BY created_at
    `, [id]);

    const faultRecordsResult = await pool.query(`
      SELECT fr.*, d.dtc_code, d.dtc_name, d.category as dtc_category
      FROM fault_records fr
      LEFT JOIN dtcs d ON fr.dtc_id = d.id
      WHERE fr.vehicle_id = $1
      ORDER BY fr.occurrence_time DESC
      LIMIT 20
    `, [id]);

    res.json({
      ...vehicle,
      sensors: sensorsResult.rows,
      actuators: actuatorsResult.rows,
      recentFaults: faultRecordsResult.rows,
    });
  } catch (err) {
    console.error('获取车辆详情错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建车辆
router.post('/', [
  body('model_id').isInt().withMessage('车型ID不能为空'),
  body('ecu_serial').notEmpty().withMessage('ECU序列号不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      vin, license_plate, model_id, ecu_serial, ecu_model, engine_number,
      production_date, purchase_date, mileage, status, owner_name, owner_phone, remarks
    } = req.body;

    const result = await pool.query(`
      INSERT INTO vehicles (
        vin, license_plate, model_id, ecu_serial, ecu_model, engine_number,
        production_date, purchase_date, mileage, status, owner_name, owner_phone, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      vin, license_plate, model_id, ecu_serial, ecu_model, engine_number,
      production_date, purchase_date, mileage || 0, status || 'active',
      owner_name, owner_phone, remarks
    ]);

    await logAudit(req, 'create', 'vehicles', 'vehicle', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'VIN或ECU序列号已存在' });
    }
    console.error('创建车辆错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新车辆
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vin, license_plate, model_id, ecu_serial, ecu_model, engine_number,
      production_date, purchase_date, mileage, status, owner_name, owner_phone, remarks
    } = req.body;

    const oldResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }
    const oldData = oldResult.rows[0];

    const result = await pool.query(`
      UPDATE vehicles SET
        vin = COALESCE($1, vin),
        license_plate = COALESCE($2, license_plate),
        model_id = COALESCE($3, model_id),
        ecu_serial = COALESCE($4, ecu_serial),
        ecu_model = COALESCE($5, ecu_model),
        engine_number = COALESCE($6, engine_number),
        production_date = COALESCE($7, production_date),
        purchase_date = COALESCE($8, purchase_date),
        mileage = COALESCE($9, mileage),
        status = COALESCE($10, status),
        owner_name = COALESCE($11, owner_name),
        owner_phone = COALESCE($12, owner_phone),
        remarks = COALESCE($13, remarks),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [
      vin, license_plate, model_id, ecu_serial, ecu_model, engine_number,
      production_date, purchase_date, mileage, status, owner_name, owner_phone, remarks, id
    ]);

    await logAudit(req, 'update', 'vehicles', 'vehicle', id, oldData, result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'VIN或ECU序列号已存在' });
    }
    console.error('更新车辆错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除车辆
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const oldResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);

    await logAudit(req, 'delete', 'vehicles', 'vehicle', id, oldResult.rows[0], null);

    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除车辆错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取车辆传感器列表
router.get('/:vehicleId/sensors', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(`
      SELECT * FROM sensors WHERE vehicle_id = $1 ORDER BY created_at
    `, [vehicleId]);

    res.json(result.rows);
  } catch (err) {
    console.error('获取传感器列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建传感器
router.post('/:vehicleId/sensors', [
  body('sensor_code').notEmpty().withMessage('传感器代码不能为空'),
  body('sensor_name').notEmpty().withMessage('传感器名称不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicleId } = req.params;
    const { sensor_code, sensor_name, sensor_type, unit, min_value, max_value, warning_min, warning_max, position, description } = req.body;

    const result = await pool.query(`
      INSERT INTO sensors (vehicle_id, sensor_code, sensor_name, sensor_type, unit, min_value, max_value, warning_min, warning_max, position, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [vehicleId, sensor_code, sensor_name, sensor_type, unit, min_value, max_value, warning_min, warning_max, position, description]);

    await logAudit(req, 'create', 'sensors', 'sensor', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('创建传感器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取车辆执行器列表
router.get('/:vehicleId/actuators', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(`
      SELECT * FROM actuators WHERE vehicle_id = $1 ORDER BY created_at
    `, [vehicleId]);

    res.json(result.rows);
  } catch (err) {
    console.error('获取执行器列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建执行器
router.post('/:vehicleId/actuators', [
  body('actuator_code').notEmpty().withMessage('执行器代码不能为空'),
  body('actuator_name').notEmpty().withMessage('执行器名称不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicleId } = req.params;
    const { actuator_code, actuator_name, actuator_type, control_method, working_voltage, position, description } = req.body;

    const result = await pool.query(`
      INSERT INTO actuators (vehicle_id, actuator_code, actuator_name, actuator_type, control_method, working_voltage, position, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [vehicleId, actuator_code, actuator_name, actuator_type, control_method, working_voltage, position, description]);

    await logAudit(req, 'create', 'actuators', 'actuator', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('创建执行器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
