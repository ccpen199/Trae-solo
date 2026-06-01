const express = require('express');
const Joi = require('joi');
const { allAsync, getAsync, runAsync, db } = require('../utils/db');

const router = express.Router();

const taskSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  jump_url: Joi.string().allow('', null),
  image_url: Joi.string().allow('', null),
  task_type: Joi.string().valid('transaction', 'operation').required(),
  trigger_type: Joi.string().allow('', null),
  target_users: Joi.string().allow('', null),
  send_type: Joi.string().valid('immediate', 'scheduled').required(),
  scheduled_time: Joi.string().allow('', null),
  creator: Joi.string().allow('', null),
});

const reviewSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  reviewer: Joi.string().required(),
  review_comment: Joi.string().allow('', null),
});

const generateTaskId = () => {
  return 'TASK' + Date.now().toString(36).toUpperCase();
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, task_type, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (task_type) {
      whereClause += ' AND task_type = ?';
      params.push(task_type);
    }

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const tasks = await allAsync(
      `SELECT * FROM push_tasks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const totalResult = await getAsync(
      `SELECT COUNT(*) as total FROM push_tasks ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: tasks,
        total: totalResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取任务列表失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await getAsync('SELECT * FROM push_tasks WHERE id = ?', [req.params.id]);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在'
      });
    }

    const records = await allAsync(`
      SELECT pr.*, d.username, d.device_type 
      FROM push_records pr
      LEFT JOIN devices d ON pr.device_id = d.device_id
      WHERE pr.task_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 100
    `, [task.task_id]);

    res.json({
      success: true,
      data: { ...task, records },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取任务详情失败'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details[0].message
      });
    }

    const task_id = generateTaskId();
    const status = 'pending_review';

    const result = await runAsync(`
      INSERT INTO push_tasks (
        task_id, title, content, jump_url, image_url,
        task_type, trigger_type, target_users, send_type,
        scheduled_time, status, creator
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task_id, value.title, value.content, value.jump_url, value.image_url,
      value.task_type, value.trigger_type, value.target_users, value.send_type,
      value.scheduled_time || null, status, value.creator || 'admin'
    ]);

    res.json({
      success: true,
      data: { id: result.lastID, task_id },
      message: '创建任务成功'
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '创建任务失败'
    });
  }
});

router.post('/:id/review', async (req, res) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details[0].message
      });
    }

    const existing = await getAsync('SELECT * FROM push_tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在'
      });
    }

    if (existing.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '该任务状态不允许审核'
      });
    }

    await runAsync(`
      UPDATE push_tasks SET
        status = ?, reviewer = ?, review_comment = ?, review_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [value.status, value.reviewer, value.review_comment || '', req.params.id]);

    if (value.status === 'approved' && existing.send_type === 'immediate') {
      setTimeout(async () => {
        try {
          const devices = await allAsync('SELECT * FROM devices WHERE push_status = 1');
          const total_count = devices.length;
          
          await runAsync(`
            UPDATE push_tasks SET
              status = 'sending', start_time = CURRENT_TIMESTAMP, total_count = ?
            WHERE id = ?
          `, [total_count, req.params.id]);

          let success_count = 0;
          let failed_count = 0;

          const recordStmt = db.prepare(`
            INSERT INTO push_records (task_id, device_id, status, sent_time, error_message)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
          `);

          for (const device of devices) {
            const success = Math.random() > 0.1;
            if (success) {
              success_count++;
              recordStmt.run(existing.task_id, device.device_id, 'success', null);
            } else {
              failed_count++;
              recordStmt.run(existing.task_id, device.device_id, 'failed', '推送模拟失败');
            }
          }
          recordStmt.finalize();

          await runAsync(`
            UPDATE push_tasks SET
              status = 'completed', success_count = ?, failed_count = ?,
              unread_count = ?, end_time = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [success_count, failed_count, success_count, req.params.id]);

        } catch (err) {
          console.error('发送推送失败:', err);
          await runAsync(`
            UPDATE push_tasks SET status = 'failed', end_time = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [req.params.id]);
        }
      }, 1000);
    }

    res.json({
      success: true,
      data: null,
      message: '审核成功'
    });
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '审核失败'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM push_tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在'
      });
    }

    await runAsync('DELETE FROM push_tasks WHERE id = ?', [req.params.id]);
    await runAsync('DELETE FROM push_records WHERE task_id = ?', [existing.task_id]);

    res.json({
      success: true,
      data: null,
      message: '删除任务成功'
    });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '删除任务失败'
    });
  }
});

module.exports = router;
