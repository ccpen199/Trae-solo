const express = require('express');
const { Parser } = require('json2csv');
const { allAsync, getAsync } = require('../utils/db');

const router = express.Router();

router.get('/statistics', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start_date) {
      whereClause += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND created_at <= ?';
      params.push(end_date);
    }

    const deviceStats = await getAsync(`
      SELECT 
        COUNT(*) as total_devices,
        SUM(CASE WHEN push_status = 1 THEN 1 ELSE 0 END) as active_devices,
        SUM(CASE WHEN device_type = 'ios' THEN 1 ELSE 0 END) as ios_devices,
        SUM(CASE WHEN device_type = 'android' THEN 1 ELSE 0 END) as android_devices,
        SUM(CASE WHEN device_type = 'web' THEN 1 ELSE 0 END) as web_devices
      FROM devices
    `);

    const taskStats = await getAsync(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(total_count) as total_sent,
        SUM(success_count) as total_success,
        SUM(failed_count) as total_failed,
        SUM(read_count) as total_read
      FROM push_tasks
      WHERE status = 'completed'
    `);

    const recentTasks = await allAsync(`
      SELECT * FROM push_tasks
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        devices: deviceStats,
        tasks: taskStats,
        recent_tasks: recentTasks
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取统计数据失败'
    });
  }
});

router.get('/export/tasks', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start_date) {
      whereClause += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND created_at <= ?';
      params.push(end_date);
    }

    const tasks = await allAsync(`
      SELECT 
        task_id, title, content, task_type, send_type,
        status, total_count, success_count, failed_count,
        read_count, unread_count, creator, created_at,
        start_time, end_time
      FROM push_tasks
      ${whereClause}
      ORDER BY created_at DESC
    `, params);

    const fields = [
      'task_id', 'title', 'content', 'task_type', 'send_type',
      'status', 'total_count', 'success_count', 'failed_count',
      'read_count', 'unread_count', 'creator', 'created_at',
      'start_time', 'end_time'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(tasks);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=tasks_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('导出任务失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '导出任务失败'
    });
  }
});

router.get('/export/devices', async (req, res) => {
  try {
    const devices = await allAsync(`
      SELECT 
        device_id, username, device_type, os_version,
        app_version, push_status, is_logged_in, is_online,
        last_open_time, created_at
      FROM devices
      ORDER BY created_at DESC
    `);

    const fields = [
      'device_id', 'username', 'device_type', 'os_version',
      'app_version', 'push_status', 'is_logged_in', 'is_online',
      'last_open_time', 'created_at'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(devices);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=devices_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('导出设备失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '导出设备失败'
    });
  }
});

module.exports = router;
