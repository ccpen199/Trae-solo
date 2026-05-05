const express = require('express');
const router = express.Router();
const db = require('../database/db');

const statusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

router.get('/', (req, res) => {
  try {
    const { status, dealer_id, region, keyword } = req.query;

    let sql = `
      SELECT 
        ar.*,
        t.name as task_name,
        t.task_type,
        t.training_method,
        t.exam_method,
        t.duration as required_hours,
        d.name as dealer_name,
        d.code as dealer_code,
        d.region,
        s.actual_hours,
        s.status as submission_status,
        s.submitted_at
      FROM audit_records ar
      JOIN training_tasks t ON ar.task_id = t.id
      JOIN dealers d ON ar.dealer_id = d.id
      JOIN submissions s ON ar.submission_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND ar.status = ?';
      params.push(status);
    }

    if (dealer_id) {
      sql += ' AND ar.dealer_id = ?';
      params.push(dealer_id);
    }

    if (region) {
      sql += ' AND d.region = ?';
      params.push(region);
    }

    if (keyword) {
      sql += ' AND (t.name LIKE ? OR d.name LIKE ? OR d.code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY ar.created_at DESC';

    const audits = db.prepare(sql).all(...params);

    const result = audits.map(item => ({
      ...item,
      status_text: statusMap[item.status] || item.status
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取审核列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审核列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const audit = db.prepare(`
      SELECT 
        ar.*,
        t.name as task_name,
        t.task_type,
        t.training_method,
        t.exam_method,
        t.duration as required_hours,
        t.content as task_content,
        d.name as dealer_name,
        d.code as dealer_code,
        d.region,
        s.actual_hours,
        s.status as submission_status,
        s.submitted_at,
        s.photos,
        s.videos,
        s.attachments
      FROM audit_records ar
      JOIN training_tasks t ON ar.task_id = t.id
      JOIN dealers d ON ar.dealer_id = d.id
      JOIN submissions s ON ar.submission_id = s.id
      WHERE ar.id = ?
    `).get(id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: '审核记录不存在'
      });
    }

    const coursePlans = db.prepare(`
      SELECT * FROM course_plans 
      WHERE task_id = ? AND dealer_id = ?
      ORDER BY start_time
    `).all(audit.task_id, audit.dealer_id);

    const enrollments = db.prepare(`
      SELECT * FROM enrollments 
      WHERE task_id = ? AND dealer_id = ?
    `).all(audit.task_id, audit.dealer_id);

    const taskFiles = db.prepare(`
      SELECT * FROM task_files WHERE task_id = ?
    `).all(audit.task_id);

    res.json({
      success: true,
      data: {
        ...audit,
        status_text: statusMap[audit.status] || audit.status,
        course_plans: coursePlans,
        enrollments: enrollments,
        task_files: taskFiles,
        photos: JSON.parse(audit.photos || '[]'),
        videos: JSON.parse(audit.videos || '[]'),
        attachments: JSON.parse(audit.attachments || '[]')
      }
    });
  } catch (error) {
    console.error('获取审核详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审核详情失败'
    });
  }
});

router.put('/:id/audit', (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, auditor } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '审核状态无效'
      });
    }

    const audit = db.prepare('SELECT * FROM audit_records WHERE id = ?').get(id);
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: '审核记录不存在'
      });
    }

    if (audit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该审核已处理，无法重复审核'
      });
    }

    db.prepare(`
      UPDATE audit_records 
      SET status = ?, comment = ?, auditor = ?, audited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, comment || null, auditor || '系统管理员', id);

    db.prepare(`
      UPDATE training_tasks 
      SET status = ?
      WHERE id = ?
    `).run(status === 'approved' ? 'approved' : 'rejected', audit.task_id);

    res.json({
      success: true,
      message: status === 'approved' ? '审核通过' : '审核驳回'
    });
  } catch (error) {
    console.error('处理审核失败:', error);
    res.status(500).json({
      success: false,
      message: '处理审核失败'
    });
  }
});

router.get('/export/list', (req, res) => {
  try {
    const { status, region, start_date, end_date } = req.query;

    let sql = `
      SELECT 
        d.region as 区域,
        d.name as 经销商名称,
        d.code as 经销商代码,
        t.name as 任务名称,
        t.task_type as 任务类型,
        t.training_method as 内训方式,
        t.exam_method as 考核方式,
        t.duration as 要求课时,
        s.actual_hours as 执行课时,
        s.status as 提交状态,
        ar.status as 审核状态,
        ar.comment as 审核意见,
        s.submitted_at as 提交时间,
        ar.audited_at as 审核时间
      FROM audit_records ar
      JOIN training_tasks t ON ar.task_id = t.id
      JOIN dealers d ON ar.dealer_id = d.id
      JOIN submissions s ON ar.submission_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND ar.status = ?';
      params.push(status);
    }

    if (region) {
      sql += ' AND d.region = ?';
      params.push(region);
    }

    if (start_date) {
      sql += ' AND date(s.submitted_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(s.submitted_at) <= date(?)';
      params.push(end_date);
    }

    sql += ' ORDER BY s.submitted_at DESC';

    const data = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: data,
      message: '导出数据获取成功'
    });
  } catch (error) {
    console.error('获取导出数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取导出数据失败'
    });
  }
});

module.exports = router;
