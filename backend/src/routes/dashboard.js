const express = require('express');
const { all, get } = require('../database/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', async (req, res) => {
  try {
    const elderlyCount = await get('SELECT COUNT(*) as count FROM elderly WHERE status = ?', ['入住中']);
    const activePlans = await get('SELECT COUNT(*) as count FROM care_plans WHERE is_active = 1');
    const todayRecords = await get("SELECT COUNT(*) as count FROM care_records WHERE DATE(executed_at) = DATE('now')");
    const pendingIncidents = await get("SELECT COUNT(*) as count FROM incidents WHERE status IN ('待处理', '处理中')");

    res.json({
      elderlyCount: elderlyCount.count,
      activePlans: activePlans.count,
      todayRecords: todayRecords.count,
      pendingIncidents: pendingIncidents.count
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/self-check', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const missedDoses = await all(`
      SELECT COUNT(*) as count FROM medication_administration WHERE status = '漏服'
    `);

    const timeoutTasks = await all(`
      SELECT COUNT(*) as count 
      FROM care_records 
      WHERE status = '超时'
    `);

    const arrears = await all(`
      SELECT COUNT(*) as count 
      FROM fee_records 
      WHERE payment_status = '欠费'
    `);

    const pendingIncidents = await all(`
      SELECT COUNT(*) as count 
      FROM incidents 
      WHERE status IN ('待处理', '处理中')
    `);

    const lowStock = await all(`
      SELECT COUNT(*) as count 
      FROM medications 
      WHERE stock_quantity <= warning_threshold
    `);

    res.json({
      missedDoses: missedDoses[0].count,
      timeoutTasks: timeoutTasks[0].count,
      arrears: arrears[0].count,
      pendingIncidents: pendingIncidents[0].count,
      lowStock: lowStock[0].count,
      allPassed: 
        missedDoses[0].count === 0 && 
        timeoutTasks[0].count === 0 && 
        arrears[0].count === 0 && 
        pendingIncidents[0].count === 0 &&
        lowStock[0].count === 0
    });
  } catch (error) {
    console.error('自测错误:', error);
    res.status(500).json({ error: '自测失败' });
  }
});

router.get('/recent-activity', async (req, res) => {
  try {
    let records;
    if (req.user.role === 'family') {
      records = await all(`
        SELECT 
          cr.id, 
          'care' as type, 
          cr.task_type as title, 
          cr.notes as description,
          cr.executed_at as time,
          e.name as elderly_name
        FROM care_records cr
        JOIN elderly e ON cr.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        WHERE fa.family_member_id = ?
        UNION ALL
        SELECT 
          i.id, 
          'incident' as type, 
          i.incident_type as title, 
          i.description as description,
          i.occurred_at as time,
          e.name as elderly_name
        FROM incidents i
        JOIN elderly e ON i.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        WHERE fa.family_member_id = ?
        UNION ALL
        SELECT 
          ma.id, 
          'medication' as type, 
          m.name as title, 
          CASE WHEN ma.status = '已执行' THEN '已服用' ELSE ma.status END as description,
          COALESCE(ma.administered_time, ma.scheduled_time) as time,
          e.name as elderly_name
        FROM medication_administration ma
        JOIN elderly e ON ma.elderly_id = e.id
        JOIN medication_orders mo ON ma.order_id = mo.id
        JOIN medications m ON mo.medication_id = m.id
        JOIN family_access fa ON e.id = fa.elderly_id
        WHERE fa.family_member_id = ? AND ma.status IN ('已执行', '已服用', '漏服', '拒服', '延迟')
        ORDER BY time DESC
        LIMIT 20
      `, [req.user.id, req.user.id, req.user.id]);
    } else {
      records = await all(`
        SELECT 
          cr.id, 
          'care' as type, 
          cr.task_type as title, 
          cr.notes as description,
          cr.executed_at as time,
          e.name as elderly_name
        FROM care_records cr
        JOIN elderly e ON cr.elderly_id = e.id
        UNION ALL
        SELECT 
          i.id, 
          'incident' as type, 
          i.incident_type as title, 
          i.description as description,
          i.occurred_at as time,
          e.name as elderly_name
        FROM incidents i
        JOIN elderly e ON i.elderly_id = e.id
        UNION ALL
        SELECT 
          ma.id, 
          'medication' as type, 
          m.name as title, 
          CASE WHEN ma.status = '已执行' THEN '已服用' ELSE ma.status END as description,
          COALESCE(ma.administered_time, ma.scheduled_time) as time,
          e.name as elderly_name
        FROM medication_administration ma
        JOIN elderly e ON ma.elderly_id = e.id
        JOIN medication_orders mo ON ma.order_id = mo.id
        JOIN medications m ON mo.medication_id = m.id
        WHERE ma.status IN ('已执行', '已服用', '漏服', '拒服', '延迟')
        ORDER BY time DESC
        LIMIT 20
      `);
    }
    res.json(records);
  } catch (error) {
    console.error('获取最近活动错误:', error);
    res.status(500).json({ error: '获取最近活动失败' });
  }
});

router.get('/family/:elderlyId', async (req, res) => {
  try {
    let access = null;
    if (req.user.role === 'family') {
      access = await get(
        'SELECT * FROM family_access WHERE family_member_id = ? AND elderly_id = ?',
        [req.user.id, req.params.elderlyId]
      );

      if (!access) {
        return res.status(403).json({ error: '无权访问' });
      }
    }

    const elderly = await get('SELECT * FROM elderly WHERE id = ?', [req.params.elderlyId]);
    const careRecords = await all(`
      SELECT cr.*, u.name as executor_name
      FROM care_records cr
      LEFT JOIN users u ON cr.executed_by = u.id
      WHERE cr.elderly_id = ?
      ORDER BY cr.executed_at DESC
      LIMIT 30
    `, [req.params.elderlyId]);

    const medications = await all(`
      SELECT mo.*, m.name as medication_name
      FROM medication_orders mo
      JOIN medications m ON mo.medication_id = m.id
      WHERE mo.elderly_id = ? AND mo.is_active = 1
    `, [req.params.elderlyId]);

    const incidents = await all(`
      SELECT i.*
      FROM incidents i
      WHERE i.elderly_id = ?
      ORDER BY i.occurred_at DESC
      LIMIT 10
    `, [req.params.elderlyId]);

    const fees = await all(`
      SELECT * FROM fee_records
      WHERE elderly_id = ?
      ORDER BY billing_month DESC
      LIMIT 6
    `, [req.params.elderlyId]);

    res.json({
      elderly,
      careRecords,
      medications,
      incidents,
      fees,
      permissions: access
    });
  } catch (error) {
    console.error('家属视图错误:', error);
    res.status(500).json({ error: '获取家属视图数据失败' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await all(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: '获取通知失败' });
  }
});

module.exports = router;
