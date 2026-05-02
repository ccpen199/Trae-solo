const express = require('express');
const { query, run } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotent');
const ruleEngine = require('../services/ruleEngine');
const stateMachine = require('../services/stateMachine');

const router = express.Router();

router.get('/', authenticate, requirePermission('rule:view'), async (req, res) => {
  try {
    const { status, rule_type, search, page = 1, pageSize = 20 } = req.query;
    
    let sql = `SELECT ar.*, u.name as creator_name
               FROM alert_rules ar
               LEFT JOIN users u ON ar.created_by = u.id
               WHERE 1=1`;
    const params = [];
    
    if (status !== undefined) {
      sql += ' AND ar.status = ?';
      params.push(parseInt(status));
    }
    if (rule_type) {
      sql += ' AND ar.rule_type = ?';
      params.push(rule_type);
    }
    if (search) {
      sql += ' AND (ar.name LIKE ? OR ar.description LIKE ? OR ar.code LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    sql += ' ORDER BY ar.created_at DESC';
    
    const allRules = query(sql, params);
    const total = allRules.length;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const rules = query(sql, params);
    
    res.json({
      success: true,
      data: {
        rules,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取规则列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/:id', authenticate, requirePermission('rule:view'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const rules = query(
      `SELECT ar.*, u.name as creator_name
       FROM alert_rules ar
       LEFT JOIN users u ON ar.created_by = u.id
       WHERE ar.id = ?`,
      [id]
    );
    
    if (rules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '规则不存在'
      });
    }
    
    res.json({
      success: true,
      data: { rule: rules[0] }
    });
  } catch (error) {
    console.error('获取规则详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/', authenticate, requirePermission('rule:create'), checkIdempotency, async (req, res) => {
  try {
    const { name, description, rule_type, metric_name, condition, threshold, duration, severity, is_dedup, dedup_window, dedup_key } = req.body;
    
    if (!name || !condition) {
      return res.status(400).json({
        success: false,
        message: '规则名称和条件不能为空'
      });
    }
    
    const rule = ruleEngine.createAlertRule(
      {
        name,
        description,
        rule_type: rule_type || 'metric',
        metric_name,
        condition,
        threshold,
        duration,
        severity: severity || 'warning',
        is_dedup: !!is_dedup,
        dedup_window: dedup_window || 300,
        dedup_key
      },
      req.user.id
    );
    
    res.json({
      success: true,
      message: '规则创建成功',
      data: { rule }
    });
  } catch (error) {
    console.error('创建规则错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.put('/:id', authenticate, requirePermission('rule:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = ruleEngine.updateAlertRule(parseInt(id), req.body, req.user.id);
    
    res.json({
      success: true,
      message: '规则更新成功',
      data: { rule }
    });
  } catch (error) {
    console.error('更新规则错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', authenticate, requirePermission('rule:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = query('SELECT * FROM alert_rules WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '规则不存在'
      });
    }
    
    run('DELETE FROM alert_rules WHERE id = ?', [id]);
    
    stateMachine.logOperation(req.user.id, 'rule', 'delete', id, existing[0], null);
    
    res.json({
      success: true,
      message: '规则删除成功'
    });
  } catch (error) {
    console.error('删除规则错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/:id/test', authenticate, requirePermission('rule:view'), async (req, res) => {
  try {
    const { id } = req.params;
    const { metrics, ticket_id } = req.body;
    
    const rules = query('SELECT * FROM alert_rules WHERE id = ? AND status = 1', [id]);
    if (rules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '规则不存在或未启用'
      });
    }
    
    const rule = rules[0];
    const testMetrics = metrics || [];
    
    const result = ruleEngine.evaluateMetricRule(rule, testMetrics, ticket_id, req.user.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('测试规则错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
