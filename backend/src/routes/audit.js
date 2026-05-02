const express = require('express');
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('audit:view'), async (req, res) => {
  try {
    const { module, action, user_id, target_type, start_date, end_date, page = 1, pageSize = 20 } = req.query;
    
    let sql = `SELECT ol.*, u.name as user_name
               FROM operation_logs ol
               LEFT JOIN users u ON ol.user_id = u.id
               WHERE 1=1`;
    const params = [];
    
    if (module) {
      sql += ' AND ol.module = ?';
      params.push(module);
    }
    if (action) {
      sql += ' AND ol.action = ?';
      params.push(action);
    }
    if (user_id) {
      sql += ' AND ol.user_id = ?';
      params.push(parseInt(user_id));
    }
    if (target_type) {
      sql += ' AND ol.target_type = ?';
      params.push(target_type);
    }
    if (start_date) {
      sql += ' AND DATE(ol.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(ol.created_at) <= ?';
      params.push(end_date);
    }
    
    sql += ' ORDER BY ol.created_at DESC';
    
    const allLogs = query(sql, params);
    const total = allLogs.length;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const logs = query(sql, params);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取审计日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/modules', authenticate, requirePermission('audit:view'), async (req, res) => {
  try {
    const modules = query(
      'SELECT DISTINCT module FROM operation_logs ORDER BY module'
    );
    
    const actions = query(
      'SELECT DISTINCT action FROM operation_logs ORDER BY action'
    );
    
    res.json({
      success: true,
      data: {
        modules: modules.map(m => m.module),
        actions: actions.map(a => a.action)
      }
    });
  } catch (error) {
    console.error('获取模块列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
