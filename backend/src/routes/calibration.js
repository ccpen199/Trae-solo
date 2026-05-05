const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();
router.use(authenticateToken);

// 获取标定参数列表
router.get('/parameters', [
  query('category').optional(),
], async (req, res) => {
  try {
    const { category } = req.query;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT * FROM calibration_parameters
      ${whereClause}
      ORDER BY category, parameter_code
    `, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('获取标定参数列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取标定参数详情
router.get('/parameters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM calibration_parameters WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '标定参数不存在' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取标定参数详情错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建标定参数
router.post('/parameters', requireRole(['admin']), [
  body('parameter_code').notEmpty().withMessage('参数代码不能为空'),
  body('parameter_name').notEmpty().withMessage('参数名称不能为空'),
  body('category').notEmpty().withMessage('参数类别不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { parameter_code, parameter_name, category, unit, min_value, max_value, default_value, step_value, description } = req.body;

    const result = await pool.query(`
      INSERT INTO calibration_parameters (
        parameter_code, parameter_name, category, unit, min_value, max_value, default_value, step_value, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [parameter_code, parameter_name, category, unit, min_value, max_value, default_value, step_value, description]);

    await logAudit(req, 'create', 'calibration_parameters', 'parameter', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: '参数代码已存在' });
    }
    console.error('创建标定参数错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取标定版本列表
router.get('/versions', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional(),
  query('vehicle_model_id').optional().isInt().toInt(),
], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vehicle_model_id } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`cv.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (vehicle_model_id) {
      whereConditions.push(`cv.vehicle_model_id = $${paramIndex}`);
      queryParams.push(vehicle_model_id);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM calibration_versions cv ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const versionsQuery = `
      SELECT cv.*, vm.model_name, vm.model_code,
             uc.name as created_by_name,
             ur.name as reviewed_by_name,
             up.name as published_by_name
      FROM calibration_versions cv
      LEFT JOIN vehicle_models vm ON cv.vehicle_model_id = vm.id
      LEFT JOIN users uc ON cv.created_by = uc.id
      LEFT JOIN users ur ON cv.reviewed_by = ur.id
      LEFT JOIN users up ON cv.published_by = up.id
      ${whereClause}
      ORDER BY cv.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(versionsQuery, queryParams);

    res.json({
      versions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('获取标定版本列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取标定版本详情
router.get('/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const versionResult = await pool.query(`
      SELECT cv.*, vm.model_name, vm.model_code,
             uc.name as created_by_name,
             ur.name as reviewed_by_name,
             up.name as published_by_name
      FROM calibration_versions cv
      LEFT JOIN vehicle_models vm ON cv.vehicle_model_id = vm.id
      LEFT JOIN users uc ON cv.created_by = uc.id
      LEFT JOIN users ur ON cv.reviewed_by = ur.id
      LEFT JOIN users up ON cv.published_by = up.id
      WHERE cv.id = $1
    `, [id]);

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ error: '标定版本不存在' });
    }

    const version = versionResult.rows[0];

    const paramsResult = await pool.query(`
      SELECT cvp.*, cp.parameter_code, cp.parameter_name, cp.category, cp.unit,
             cp.min_value, cp.max_value, cp.default_value, cp.step_value
      FROM calibration_version_params cvp
      LEFT JOIN calibration_parameters cp ON cvp.parameter_id = cp.id
      WHERE cvp.version_id = $1
      ORDER BY cp.category, cp.parameter_code
    `, [id]);

    const reviewsResult = await pool.query(`
      SELECT cr.*, u.name as reviewer_name
      FROM calibration_reviews cr
      LEFT JOIN users u ON cr.reviewer_id = u.id
      WHERE cr.version_id = $1
      ORDER BY cr.created_at DESC
    `, [id]);

    res.json({
      ...version,
      parameters: paramsResult.rows,
      reviews: reviewsResult.rows,
    });
  } catch (err) {
    console.error('获取标定版本详情错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建标定版本
router.post('/versions', [
  body('version_code').notEmpty().withMessage('版本代码不能为空'),
  body('version_name').notEmpty().withMessage('版本名称不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { version_code, version_name, vehicle_model_id, ecu_model, description } = req.body;

    const result = await pool.query(`
      INSERT INTO calibration_versions (
        version_code, version_name, vehicle_model_id, ecu_model, description, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *
    `, [version_code, version_name, vehicle_model_id, ecu_model, description, req.user.id]);

    await logAudit(req, 'create', 'calibration_versions', 'version', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: '版本代码已存在' });
    }
    console.error('创建标定版本错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 添加标定版本参数
router.post('/versions/:versionId/parameters', [
  body('parameter_id').isInt().withMessage('参数ID不能为空'),
  body('parameter_value').notEmpty().withMessage('参数值不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { versionId } = req.params;
    const { parameter_id, parameter_value } = req.body;

    const versionResult = await pool.query(
      'SELECT status FROM calibration_versions WHERE id = $1',
      [versionId]
    );

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ error: '标定版本不存在' });
    }

    if (versionResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: '只能修改草稿状态的版本' });
    }

    const existingResult = await pool.query(
      'SELECT id FROM calibration_version_params WHERE version_id = $1 AND parameter_id = $2',
      [versionId, parameter_id]
    );

    let result;
    if (existingResult.rows.length > 0) {
      result = await pool.query(`
        UPDATE calibration_version_params 
        SET parameter_value = $1
        WHERE version_id = $2 AND parameter_id = $3
        RETURNING *
      `, [parameter_value, versionId, parameter_id]);
    } else {
      result = await pool.query(`
        INSERT INTO calibration_version_params (version_id, parameter_id, parameter_value)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [versionId, parameter_id, parameter_value]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('添加标定参数错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 提交审核
router.put('/versions/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;

    const oldResult = await pool.query('SELECT * FROM calibration_versions WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '标定版本不存在' });
    }

    if (oldResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: '只能提交草稿状态的版本' });
    }

    const paramsCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM calibration_version_params WHERE version_id = $1',
      [id]
    );

    if (parseInt(paramsCountResult.rows[0].count) === 0) {
      return res.status(400).json({ error: '版本中没有标定参数，请先添加参数' });
    }

    const result = await pool.query(`
      UPDATE calibration_versions 
      SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    await logAudit(req, 'update', 'calibration_versions', 'version', id, oldResult.rows[0], result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('提交审核错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 审核标定版本
router.put('/versions/:id/review', requireRole(['admin']), [
  body('status').notEmpty().withMessage('审核状态不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, comment } = req.body;

    const oldResult = await pool.query('SELECT * FROM calibration_versions WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '标定版本不存在' });
    }

    if (oldResult.rows[0].status !== 'pending_review') {
      return res.status(400).json({ error: '只能审核待审核状态的版本' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '审核状态必须是 approved 或 rejected' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let newStatus;
      if (status === 'approved') {
        newStatus = 'reviewed';
      } else {
        newStatus = 'draft';
      }

      const versionResult = await client.query(`
        UPDATE calibration_versions 
        SET status = $1, reviewed_by = $2, review_time = CURRENT_TIMESTAMP, review_comment = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [newStatus, req.user.id, comment, id]);

      await client.query(`
        INSERT INTO calibration_reviews (version_id, reviewer_id, status, comment)
        VALUES ($1, $2, $3, $4)
      `, [id, req.user.id, status, comment]);

      await client.query('COMMIT');

      await logAudit(req, 'update', 'calibration_versions', 'version', id, oldResult.rows[0], versionResult.rows[0]);

      res.json(versionResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('审核标定版本错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 发布标定版本
router.put('/versions/:id/publish', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const oldResult = await pool.query('SELECT * FROM calibration_versions WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: '标定版本不存在' });
    }

    if (oldResult.rows[0].status !== 'reviewed') {
      return res.status(400).json({ error: '只能发布已审核通过的版本' });
    }

    const result = await pool.query(`
      UPDATE calibration_versions 
      SET status = 'published', published_by = $1, publish_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [req.user.id, id]);

    await logAudit(req, 'update', 'calibration_versions', 'version', id, oldResult.rows[0], result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('发布标定版本错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
