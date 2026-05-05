const express = require('express');
const router = express.Router();
const db = require('../database/db');

const statusMap = {
  draft: '草稿',
  published: '已发布',
  submitted: '已提交',
  approved: '已通过',
  rejected: '已驳回'
};

router.get('/', (req, res) => {
  try {
    const { task_type, status, keyword } = req.query;
    
    let sql = `
      SELECT 
        t.*,
        d.name as dealer_name,
        d.code as dealer_code,
        d.region as dealer_region
      FROM training_tasks t
      LEFT JOIN dealers d ON t.dealer_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (task_type) {
      sql += ' AND t.task_type = ?';
      params.push(task_type);
    }

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (keyword) {
      sql += ' AND t.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    sql += ' ORDER BY t.created_at DESC';

    const tasks = db.prepare(sql).all(...params);
    
    const tasksWithStatusText = tasks.map(task => ({
      ...task,
      status_text: statusMap[task.status] || task.status
    }));

    res.json({
      success: true,
      data: tasksWithStatusText
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const task = db.prepare(`
      SELECT 
        t.*,
        d.name as dealer_name,
        d.code as dealer_code,
        d.region as dealer_region
      FROM training_tasks t
      LEFT JOIN dealers d ON t.dealer_id = d.id
      WHERE t.id = ?
    `).get(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const dealers = db.prepare(`
      SELECT d.* 
      FROM dealers d
      JOIN task_dealers td ON d.id = td.dealer_id
      WHERE td.task_id = ?
    `).all(id);

    const files = db.prepare(`
      SELECT * FROM task_files WHERE task_id = ?
    `).all(id);

    res.json({
      success: true,
      data: {
        ...task,
        status_text: statusMap[task.status] || task.status,
        assigned_dealers: dealers,
        files: files
      }
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败'
    });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      name,
      task_type = 'A',
      scope,
      training_method,
      exam_method,
      duration,
      content,
      start_time,
      end_time,
      dealer_id
    } = req.body;

    if (!name || !scope || !training_method || !exam_method || !duration) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const created_by = task_type === 'B' ? 'dealer' : 'factory';

    const result = db.prepare(`
      INSERT INTO training_tasks 
      (name, task_type, scope, training_method, exam_method, duration, content, start_time, end_time, dealer_id, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      name,
      task_type,
      scope,
      training_method,
      exam_method,
      duration,
      content,
      start_time,
      end_time,
      dealer_id || null,
      created_by
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '任务创建成功'
      }
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建任务失败'
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingTask = db.prepare('SELECT * FROM training_tasks WHERE id = ?').get(id);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (existingTask.is_published === 1) {
      return res.status(400).json({
        success: false,
        message: '已发布的任务无法修改'
      });
    }

    const allowedFields = [
      'name', 'scope', 'training_method', 'exam_method', 
      'duration', 'content', 'start_time', 'end_time'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    db.prepare(`
      UPDATE training_tasks SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...updateValues);

    res.json({
      success: true,
      message: '任务更新成功'
    });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败'
    });
  }
});

router.post('/:id/publish', (req, res) => {
  try {
    const { id } = req.params;
    const { dealer_ids } = req.body;

    const task = db.prepare('SELECT * FROM training_tasks WHERE id = ?').get(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (task.is_published === 1) {
      return res.status(400).json({
        success: false,
        message: '任务已发布，不可重复发布'
      });
    }

    if (task.task_type === 'A' && task.scope === '指定经销商') {
      if (!dealer_ids || !Array.isArray(dealer_ids) || dealer_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '指定经销商范围时必须选择经销商'
        });
      }

      const insertTaskDealer = db.prepare(`
        INSERT INTO task_dealers (task_id, dealer_id) VALUES (?, ?)
      `);

      const insertSubmission = db.prepare(`
        INSERT INTO submissions (task_id, dealer_id, photos, videos, attachments, actual_hours, status)
        VALUES (?, ?, '[]', '[]', '[]', 0, 'in_progress')
      `);

      for (const dealer_id of dealer_ids) {
        try {
          insertTaskDealer.run(id, dealer_id);
        } catch (e) {
          console.log('经销商已关联:', dealer_id);
        }
        try {
          insertSubmission.run(id, dealer_id);
        } catch (e) {
          console.log('提交记录已存在:', dealer_id);
        }
      }
    }

    if (task.task_type === 'A' && task.scope === '全部经销商') {
      const allDealers = db.prepare('SELECT id FROM dealers').all();
      const insertTaskDealer = db.prepare(`
        INSERT OR IGNORE INTO task_dealers (task_id, dealer_id) VALUES (?, ?)
      `);
      const insertSubmission = db.prepare(`
        INSERT OR IGNORE INTO submissions (task_id, dealer_id, photos, videos, attachments, actual_hours, status)
        VALUES (?, ?, '[]', '[]', '[]', 0, 'in_progress')
      `);

      for (const dealer of allDealers) {
        insertTaskDealer.run(id, dealer.id);
        insertSubmission.run(id, dealer.id);
      }
    }

    if (task.task_type === 'B') {
      db.prepare(`
        INSERT OR IGNORE INTO task_dealers (task_id, dealer_id) VALUES (?, ?)
      `).run(id, task.dealer_id);

      db.prepare(`
        INSERT OR IGNORE INTO submissions (task_id, dealer_id, photos, videos, attachments, actual_hours, status)
        VALUES (?, ?, '[]', '[]', '[]', 0, 'in_progress')
      `).run(id, task.dealer_id);
    }

    db.prepare(`
      UPDATE training_tasks 
      SET status = 'published', is_published = 1, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    res.json({
      success: true,
      message: '任务发布成功'
    });
  } catch (error) {
    console.error('发布任务失败:', error);
    res.status(500).json({
      success: false,
      message: '发布任务失败'
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const task = db.prepare('SELECT * FROM training_tasks WHERE id = ?').get(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (task.is_published === 1) {
      return res.status(400).json({
        success: false,
        message: '已发布的任务无法删除'
      });
    }

    db.prepare('DELETE FROM task_files WHERE task_id = ?').run(id);
    db.prepare('DELETE FROM training_tasks WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '任务删除成功'
    });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败'
    });
  }
});

module.exports = router;
