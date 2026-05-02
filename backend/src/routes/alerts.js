const express = require('express');
const { query, run } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const ruleEngine = require('../services/ruleEngine');
const stateMachine = require('../services/stateMachine');

const router = express.Router();

router.get('/', authenticate, requirePermission('alert:view'), async (req, res) => {
  try {
    const { status, severity, ticket_id, page = 1, pageSize = 20 } = req.query;
    
    let sql = `SELECT ae.*, ar.name as rule_name, ar.code as rule_code,
               t.ticket_no, t.title as ticket_title
               FROM alert_events ae
               LEFT JOIN alert_rules ar ON ae.alert_rule_id = ar.id
               LEFT JOIN tickets t ON ae.ticket_id = t.id
               WHERE 1=1`;
    const params = [];
    
    if (status) {
      sql += ' AND ae.status = ?';
      params.push(status);
    }
    if (severity) {
      sql += ' AND ae.severity = ?';
      params.push(severity);
    }
    if (ticket_id) {
      sql += ' AND ae.ticket_id = ?';
      params.push(ticket_id);
    }
    
    sql += ' ORDER BY ae.last_triggered_at DESC';
    
    const allAlerts = query(sql, params);
    const total = allAlerts.length;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const alerts = query(sql, params);
    
    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取告警列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/:id', authenticate, requirePermission('alert:view'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const alerts = query(
      `SELECT ae.*, ar.name as rule_name, ar.code as rule_code,
       t.ticket_no, t.title as ticket_title
       FROM alert_events ae
       LEFT JOIN alert_rules ar ON ae.alert_rule_id = ar.id
       LEFT JOIN tickets t ON ae.ticket_id = t.id
       WHERE ae.id = ?`,
      [id]
    );
    
    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '告警事件不存在'
      });
    }
    
    res.json({
      success: true,
      data: { alert: alerts[0] }
    });
  } catch (error) {
    console.error('获取告警详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/:id/resolve', authenticate, requirePermission('alert:handle'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const alert = ruleEngine.resolveAlertEvent(parseInt(id), req.user.id, comment);
    
    res.json({
      success: true,
      message: '告警已解决',
      data: { alert }
    });
  } catch (error) {
    console.error('解决告警错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/acknowledge', authenticate, requirePermission('alert:handle'), async (req, res) => {
  try {
    const { id } = req.params;
    
    run(
      `UPDATE alert_events SET status = 'acknowledged' WHERE id = ? AND status = 'firing'`,
      [id]
    );
    
    const alerts = query('SELECT * FROM alert_events WHERE id = ?', [id]);
    
    stateMachine.logOperation(req.user.id, 'alert', 'acknowledge', id, null, { status: 'acknowledged' });
    
    res.json({
      success: true,
      message: '告警已确认',
      data: { alert: alerts[0] }
    });
  } catch (error) {
    console.error('确认告警错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/evaluate', authenticate, requirePermission('alert:handle'), async (req, res) => {
  try {
    const { metrics, ticket_id } = req.body;
    
    if (!metrics || metrics.length === 0) {
      return res.status(400).json({
        success: false,
        message: '指标数据不能为空'
      });
    }
    
    const result = ruleEngine.evaluateAllRulesForMetric(metrics, ticket_id, req.user.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('评估规则错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
