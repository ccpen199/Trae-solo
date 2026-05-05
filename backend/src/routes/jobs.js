import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 前台：获取职位列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, page_size = 10, keyword = '', department, location } = req.query;

    let sql = `SELECT id, title, department, location, salary_range, job_type, 
               experience_requirement, education_requirement, is_recommended, 
               publish_date, view_count
               FROM jobs WHERE status = 1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (title LIKE $${paramIndex} OR department LIKE $${paramIndex} OR location LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (department) {
      sql += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (location) {
      sql += ` AND location = $${paramIndex}`;
      params.push(location);
      paramIndex++;
    }

    const countSql = sql.replace('SELECT id, title, department, location, salary_range, job_type, experience_requirement, education_requirement, is_recommended, publish_date, view_count', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY is_recommended DESC, sort_order ASC, publish_date DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size))
        }
      }
    });
  } catch (err) {
    console.error('获取职位列表错误:', err);
    res.status(500).json({ success: false, message: '获取职位列表失败' });
  }
});

// 前台：获取职位详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT * FROM jobs WHERE id = $1 AND status = 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '职位不存在' });
    }

    await query(
      'UPDATE jobs SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('获取职位详情错误:', err);
    res.status(500).json({ success: false, message: '获取职位详情失败' });
  }
});

// 前台：提交简历
router.post('/resume', async (req, res) => {
  try {
    const { 
      job_id, name, phone, email, gender, age, 
      education, work_experience, self_introduction, 
      work_history, education_history, skills, resume_file 
    } = req.body;

    if (!job_id || !name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: '职位、姓名和电话不能为空' 
      });
    }

    const jobResult = await query(
      'SELECT id FROM jobs WHERE id = $1 AND status = 1',
      [job_id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '职位不存在或已关闭' });
    }

    const result = await query(
      `INSERT INTO resumes (
        job_id, name, phone, email, gender, age, 
        education, work_experience, self_introduction, 
        work_history, education_history, skills, resume_file, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0) 
      RETURNING *`,
      [
        job_id, name, phone, email, gender, age,
        education, work_experience, self_introduction,
        work_history, education_history, skills, resume_file
      ]
    );

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: '简历提交成功，请等待通知' 
    });
  } catch (err) {
    console.error('提交简历错误:', err);
    res.status(500).json({ success: false, message: '提交简历失败' });
  }
});

// 后台：获取职位列表
router.get('/admin/list', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { page = 1, page_size = 20, keyword = '', status } = req.query;

    let sql = `SELECT * FROM jobs WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (title LIKE $${paramIndex} OR department LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      sql += ` AND status = $${paramIndex}`;
      params.push(parseInt(status));
      paramIndex++;
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY is_recommended DESC, sort_order ASC, publish_date DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size))
        }
      }
    });
  } catch (err) {
    console.error('获取后台职位列表错误:', err);
    res.status(500).json({ success: false, message: '获取职位列表失败' });
  }
});

// 后台：创建职位
router.post('/', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { 
      title, department, location, salary_range, requirements, 
      responsibilities, benefits, job_type, experience_requirement, 
      education_requirement, is_recommended, sort_order 
    } = req.body;

    const result = await query(
      `INSERT INTO jobs (
        title, department, location, salary_range, requirements,
        responsibilities, benefits, job_type, experience_requirement,
        education_requirement, is_recommended, sort_order, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1) 
      RETURNING *`,
      [
        title, department, location, salary_range, requirements,
        responsibilities, benefits, job_type, experience_requirement,
        education_requirement, is_recommended || false, sort_order || 0
      ]
    );

    res.json({ success: true, data: result.rows[0], message: '职位创建成功' });
  } catch (err) {
    console.error('创建职位错误:', err);
    res.status(500).json({ success: false, message: '创建职位失败' });
  }
});

// 后台：更新职位
router.put('/:id', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, department, location, salary_range, requirements, 
      responsibilities, benefits, job_type, experience_requirement, 
      education_requirement, is_recommended, sort_order, status 
    } = req.body;

    const result = await query(
      `UPDATE jobs SET 
        title = $1, department = $2, location = $3, salary_range = $4, 
        requirements = $5, responsibilities = $6, benefits = $7, 
        job_type = $8, experience_requirement = $9, education_requirement = $10, 
        is_recommended = $11, sort_order = $12, status = $13, updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [
        title, department, location, salary_range, requirements,
        responsibilities, benefits, job_type, experience_requirement,
        education_requirement, is_recommended, sort_order || 0, status ?? 1, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '职位不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '职位更新成功' });
  } catch (err) {
    console.error('更新职位错误:', err);
    res.status(500).json({ success: false, message: '更新职位失败' });
  }
});

// 后台：删除职位
router.delete('/:id', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const resumeCheck = await query(
      'SELECT COUNT(*) FROM resumes WHERE job_id = $1',
      [id]
    );

    if (parseInt(resumeCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: '该职位下还有简历，无法删除' });
    }

    const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '职位不存在' });
    }

    res.json({ success: true, message: '职位删除成功' });
  } catch (err) {
    console.error('删除职位错误:', err);
    res.status(500).json({ success: false, message: '删除职位失败' });
  }
});

// 后台：获取简历列表
router.get('/resumes/list', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { 
      page = 1, 
      page_size = 20, 
      keyword = '', 
      job_id, 
      status 
    } = req.query;

    let sql = `SELECT r.*, j.title as job_title
               FROM resumes r 
               LEFT JOIN jobs j ON r.job_id = j.id 
               WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (r.name LIKE $${paramIndex} OR r.phone LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (job_id) {
      sql += ` AND r.job_id = $${paramIndex}`;
      params.push(job_id);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      sql += ` AND r.status = $${paramIndex}`;
      params.push(parseInt(status));
      paramIndex++;
    }

    const countSql = sql.replace('SELECT r.*, j.title as job_title', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY r.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size))
        }
      }
    });
  } catch (err) {
    console.error('获取简历列表错误:', err);
    res.status(500).json({ success: false, message: '获取简历列表失败' });
  }
});

// 后台：获取简历详情
router.get('/resumes/:id', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT r.*, j.title as job_title
       FROM resumes r 
       LEFT JOIN jobs j ON r.job_id = j.id 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '简历不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('获取简历详情错误:', err);
    res.status(500).json({ success: false, message: '获取简历详情失败' });
  }
});

// 后台：更新简历状态
router.put('/resumes/:id/status', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE resumes 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '简历不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '状态更新成功' });
  } catch (err) {
    console.error('更新简历状态错误:', err);
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
});

// 后台：删除简历
router.delete('/resumes/:id', authMiddleware, permissionMiddleware('manage_jobs'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM resumes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '简历不存在' });
    }

    res.json({ success: true, message: '简历删除成功' });
  } catch (err) {
    console.error('删除简历错误:', err);
    res.status(500).json({ success: false, message: '删除简历失败' });
  }
});

export default router;
