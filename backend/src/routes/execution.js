const express = require('express');
const router = express.Router();
const db = require('../database/db');

const statusMap = {
  in_progress: '进行中',
  submitted: '已提交'
};

router.get('/', (req, res) => {
  try {
    const { dealer_id, status, task_type } = req.query;

    let sql = `
      SELECT 
        s.*,
        t.name as task_name,
        t.task_type,
        t.training_method,
        t.exam_method,
        t.duration as required_hours,
        t.start_time,
        t.end_time,
        t.scope,
        d.name as dealer_name,
        d.code as dealer_code,
        d.region as dealer_region
      FROM submissions s
      JOIN training_tasks t ON s.task_id = t.id
      JOIN dealers d ON s.dealer_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (dealer_id) {
      sql += ' AND s.dealer_id = ?';
      params.push(dealer_id);
    }

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    if (task_type) {
      sql += ' AND t.task_type = ?';
      params.push(task_type);
    }

    sql += ' ORDER BY s.updated_at DESC';

    const executions = db.prepare(sql).all(...params);

    const result = executions.map(item => ({
      ...item,
      status_text: statusMap[item.status] || item.status
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取执行列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取执行列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const submission = db.prepare(`
      SELECT 
        s.*,
        t.name as task_name,
        t.task_type,
        t.training_method,
        t.exam_method,
        t.duration as required_hours,
        t.start_time,
        t.end_time,
        t.content as task_content,
        t.scope,
        d.name as dealer_name,
        d.code as dealer_code,
        d.region as dealer_region
      FROM submissions s
      JOIN training_tasks t ON s.task_id = t.id
      JOIN dealers d ON s.dealer_id = d.id
      WHERE s.id = ?
    `).get(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '执行记录不存在'
      });
    }

    const coursePlans = db.prepare(`
      SELECT * FROM course_plans 
      WHERE task_id = ? AND dealer_id = ?
      ORDER BY start_time
    `).all(submission.task_id, submission.dealer_id);

    const enrollments = db.prepare(`
      SELECT * FROM enrollments 
      WHERE task_id = ? AND dealer_id = ?
    `).all(submission.task_id, submission.dealer_id);

    const auditRecord = db.prepare(`
      SELECT * FROM audit_records 
      WHERE submission_id = ?
    `).get(id);

    const taskFiles = db.prepare(`
      SELECT * FROM task_files WHERE task_id = ?
    `).all(submission.task_id);

    res.json({
      success: true,
      data: {
        ...submission,
        status_text: statusMap[submission.status] || submission.status,
        course_plans: coursePlans,
        enrollments: enrollments,
        audit_record: auditRecord,
        task_files: taskFiles,
        photos: JSON.parse(submission.photos || '[]'),
        videos: JSON.parse(submission.videos || '[]'),
        attachments: JSON.parse(submission.attachments || '[]')
      }
    });
  } catch (error) {
    console.error('获取执行详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取执行详情失败'
    });
  }
});

router.get('/course/:task_id/:dealer_id', (req, res) => {
  try {
    const { task_id, dealer_id } = req.params;

    const coursePlans = db.prepare(`
      SELECT * FROM course_plans 
      WHERE task_id = ? AND dealer_id = ?
      ORDER BY start_time
    `).all(task_id, dealer_id);

    res.json({
      success: true,
      data: coursePlans
    });
  } catch (error) {
    console.error('获取课程计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取课程计划失败'
    });
  }
});

router.post('/course', (req, res) => {
  try {
    const { task_id, dealer_id, course_name, lecturer, start_time, end_time, content } = req.body;

    if (!task_id || !dealer_id || !course_name || !lecturer) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const result = db.prepare(`
      INSERT INTO course_plans (task_id, dealer_id, course_name, lecturer, start_time, end_time, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(task_id, dealer_id, course_name, lecturer, start_time, end_time, content);

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '课程计划添加成功'
      }
    });
  } catch (error) {
    console.error('添加课程计划失败:', error);
    res.status(500).json({
      success: false,
      message: '添加课程计划失败'
    });
  }
});

router.put('/course/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { course_name, lecturer, start_time, end_time, content } = req.body;

    db.prepare(`
      UPDATE course_plans 
      SET course_name = ?, lecturer = ?, start_time = ?, end_time = ?, content = ?
      WHERE id = ?
    `).run(course_name, lecturer, start_time, end_time, content, id);

    res.json({
      success: true,
      message: '课程计划更新成功'
    });
  } catch (error) {
    console.error('更新课程计划失败:', error);
    res.status(500).json({
      success: false,
      message: '更新课程计划失败'
    });
  }
});

router.delete('/course/:id', (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM course_plans WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '课程计划删除成功'
    });
  } catch (error) {
    console.error('删除课程计划失败:', error);
    res.status(500).json({
      success: false,
      message: '删除课程计划失败'
    });
  }
});

router.get('/enrollment/:task_id/:dealer_id', (req, res) => {
  try {
    const { task_id, dealer_id } = req.params;

    const enrollments = db.prepare(`
      SELECT * FROM enrollments 
      WHERE task_id = ? AND dealer_id = ?
    `).all(task_id, dealer_id);

    const personnel = db.prepare(`
      SELECT * FROM personnel WHERE dealer_id = ?
    `).all(dealer_id);

    res.json({
      success: true,
      data: {
        enrollments,
        available_personnel: personnel
      }
    });
  } catch (error) {
    console.error('获取报名设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报名设置失败'
    });
  }
});

router.post('/enrollment', (req, res) => {
  try {
    const { task_id, dealer_id, personnel_list } = req.body;

    if (!task_id || !dealer_id || !Array.isArray(personnel_list)) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    db.prepare('DELETE FROM enrollments WHERE task_id = ? AND dealer_id = ?').run(task_id, dealer_id);

    const insertEnrollment = db.prepare(`
      INSERT INTO enrollments (task_id, dealer_id, person_name, person_id)
      VALUES (?, ?, ?, ?)
    `);

    for (const person of personnel_list) {
      insertEnrollment.run(task_id, dealer_id, person.name, person.employee_id || null);
    }

    res.json({
      success: true,
      message: '报名设置保存成功'
    });
  } catch (error) {
    console.error('保存报名设置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存报名设置失败'
    });
  }
});

router.put('/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const { actual_hours, photos, videos, attachments } = req.body;

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '执行记录不存在'
      });
    }

    if (submission.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: '已提交的执行无法重复提交'
      });
    }

    db.prepare(`
      UPDATE submissions 
      SET status = 'submitted', 
          actual_hours = ?,
          photos = ?,
          videos = ?,
          attachments = ?,
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      actual_hours || 0,
      JSON.stringify(photos || []),
      JSON.stringify(videos || []),
      JSON.stringify(attachments || []),
      id
    );

    db.prepare(`
      INSERT INTO audit_records (task_id, dealer_id, submission_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(submission.task_id, submission.dealer_id, id);

    res.json({
      success: true,
      message: '内训执行提交成功'
    });
  } catch (error) {
    console.error('提交执行失败:', error);
    res.status(500).json({
      success: false,
      message: '提交执行失败'
    });
  }
});

router.put('/:id/save', (req, res) => {
  try {
    const { id } = req.params;
    const { actual_hours, photos, videos, attachments } = req.body;

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '执行记录不存在'
      });
    }

    if (submission.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: '已提交的执行无法修改'
      });
    }

    db.prepare(`
      UPDATE submissions 
      SET actual_hours = ?,
          photos = ?,
          videos = ?,
          attachments = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      actual_hours || 0,
      JSON.stringify(photos || []),
      JSON.stringify(videos || []),
      JSON.stringify(attachments || []),
      id
    );

    res.json({
      success: true,
      message: '执行记录保存成功'
    });
  } catch (error) {
    console.error('保存执行记录失败:', error);
    res.status(500).json({
      success: false,
      message: '保存执行记录失败'
    });
  }
});

module.exports = router;
