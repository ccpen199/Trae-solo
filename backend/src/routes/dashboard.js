const express = require('express');
const { query, run } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const ruleEngine = require('../services/ruleEngine');

const router = express.Router();

router.get('/stats', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = ruleEngine.getDashboardStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取仪表盘统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/configs', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { is_public } = req.query;
    
    let sql = `SELECT dc.*, u.name as owner_name
               FROM dashboard_configs dc
               LEFT JOIN users u ON dc.owner_id = u.id
               WHERE 1=1`;
    const params = [];
    
    if (is_public !== undefined) {
      sql += ' AND dc.is_public = ?';
      params.push(is_public === 'true' ? 1 : 0);
    } else {
      sql += ' AND (dc.owner_id = ? OR dc.is_public = 1)';
      params.push(userId);
    }
    
    sql += ' ORDER BY dc.created_at DESC';
    
    const configs = query(sql, params);
    
    res.json({
      success: true,
      data: { configs }
    });
  } catch (error) {
    console.error('获取仪表盘配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/configs', authenticate, requirePermission('dashboard:edit'), async (req, res) => {
  try {
    const { name, description, config, is_public } = req.body;
    const userId = req.user.id;
    
    if (!name || !config) {
      return res.status(400).json({
        success: false,
        message: '名称和配置不能为空'
      });
    }
    
    const code = `DASH-${Date.now()}`;
    
    const result = run(
      `INSERT INTO dashboard_configs 
       (name, code, description, config, owner_id, is_public, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [
        name,
        code,
        description,
        JSON.stringify(config),
        userId,
        is_public ? 1 : 0
      ]
    );
    
    const configs = query('SELECT * FROM dashboard_configs WHERE id = ?', [result.lastInsertRowid]);
    
    res.json({
      success: true,
      message: '仪表盘配置创建成功',
      data: { config: configs[0] }
    });
  } catch (error) {
    console.error('创建仪表盘配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/configs/:id', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const configs = query(
      `SELECT dc.*, u.name as owner_name
       FROM dashboard_configs dc
       LEFT JOIN users u ON dc.owner_id = u.id
       WHERE dc.id = ? AND (dc.owner_id = ? OR dc.is_public = 1)`,
      [id, userId]
    );
    
    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仪表盘配置不存在或无权限访问'
      });
    }
    
    try {
      configs[0].config = JSON.parse(configs[0].config);
    } catch (e) {
      // 保持原样
    }
    
    res.json({
      success: true,
      data: { config: configs[0] }
    });
  } catch (error) {
    console.error('获取仪表盘配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.put('/configs/:id', authenticate, requirePermission('dashboard:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, config, is_public } = req.body;
    const userId = req.user.id;
    
    const existing = query('SELECT * FROM dashboard_configs WHERE id = ? AND owner_id = ?', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仪表盘配置不存在或无权限编辑'
      });
    }
    
    run(
      `UPDATE dashboard_configs 
       SET name = ?, description = ?, config = ?, is_public = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        name || existing[0].name,
        description !== undefined ? description : existing[0].description,
        config ? JSON.stringify(config) : existing[0].config,
        is_public !== undefined ? (is_public ? 1 : 0) : existing[0].is_public,
        id
      ]
    );
    
    const updated = query('SELECT * FROM dashboard_configs WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '仪表盘配置更新成功',
      data: { config: updated[0] }
    });
  } catch (error) {
    console.error('更新仪表盘配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/chart/tickets-by-status', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const data = query(
      `SELECT status, COUNT(*) as count 
       FROM tickets 
       GROUP BY status 
       ORDER BY COUNT(*) DESC`
    );
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取工单状态统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/chart/tickets-by-node', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const data = query(
      `SELECT current_node, COUNT(*) as count 
       FROM tickets 
       GROUP BY current_node 
       ORDER BY COUNT(*) DESC`
    );
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取工单节点统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/chart/alerts-by-severity', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const data = query(
      `SELECT severity, COUNT(*) as count 
       FROM alert_events 
       WHERE status = 'firing'
       GROUP BY severity 
       ORDER BY 
         CASE severity 
           WHEN 'critical' THEN 1 
           WHEN 'warning' THEN 2 
           WHEN 'info' THEN 3 
         END`
    );
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取告警级别统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/chart/tickets-trend', authenticate, requirePermission('dashboard:view'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const data = query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as count
       FROM tickets
       WHERE created_at >= DATE('now', '-' || ? || ' days')
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [parseInt(days)]
    );
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取工单趋势错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
