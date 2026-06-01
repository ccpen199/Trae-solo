const db = require('../models/database');

class AlertService {
  async createAlert(type, severity, title, description, responsibleRole, suggestedAction, closingCriteria, entityType, entityId) {
    const result = await db.run(
      'INSERT INTO workbench_alerts (type, severity, title, description, responsible_role, suggested_action, closing_criteria, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [type, severity, title, description, responsibleRole, suggestedAction, closingCriteria, entityType, entityId]
    );
    return result.lastID;
  }

  async checkVariableValidation(generation) {
    const variables = JSON.parse(generation.variables || '{}');
    const missing = [];
    
    const requiredFields = await db.all(
      'SELECT * FROM variable_fields WHERE required = 1 AND status = "active"'
    );
    
    for (const field of requiredFields) {
      if (!variables[field.key] || variables[field.key].toString().trim() === '') {
        missing.push(field.name);
      }
    }
    
    if (missing.length > 0) {
      await this.createAlert(
        'variable_missing',
        'warning',
        '邮件变量缺失',
        `以下必填变量为空: ${missing.join(', ')}`,
        'frontline_user',
        '请补充完整所有必填变量后重新生成邮件',
        '所有必填变量已填充有效值',
        'email_generation',
        generation.id
      );
    }
  }

  async checkToneMatch(generation, expectedTone) {
    if (generation.tone !== expectedTone) {
      await this.createAlert(
        'tone_mismatch',
        'info',
        '邮件语气不符',
        `当前邮件语气为 ${generation.tone}，期望为 ${expectedTone}`,
        'model_operator',
        '调整邮件生成参数或手动修改内容语气',
        '邮件语气符合预期要求',
        'email_generation',
        generation.id
      );
    }
  }

  async checkSensitiveCustomer(customer, generation) {
    if (customer.is_sensitive) {
      await this.createAlert(
        'sensitive_customer',
        'critical',
        '涉及敏感客户',
        `即将发送邮件给敏感客户: ${customer.name}`,
        'reviewer',
        '需要审核人员人工确认后才能发送',
        '审核人员已批准发送给该敏感客户',
        'email_generation',
        generation.id
      );
    }
  }

  async checkReplyClassification(reply) {
    if (reply.confidence < 0.7) {
      await this.createAlert(
        'classification_error',
        'warning',
        '回复分类置信度低',
        `当前分类置信度为 ${(reply.confidence * 100).toFixed(1)}%，低于70%阈值`,
        'reviewer',
        '请人工复核并修正分类结果',
        '已人工复核并确认分类正确',
        'reply_classification',
        reply.id
      );
    }
  }

  async getAlerts(status = 'open', roleName = null) {
    let sql = `
      SELECT w.*, u.name as assignee_name, 
             (SELECT name FROM users WHERE id = w.closed_by) as closed_by_name
      FROM workbench_alerts w
      LEFT JOIN users u ON w.assignee_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND w.status = ?';
      params.push(status);
    }
    
    if (roleName) {
      sql += ' AND w.responsible_role = ?';
      params.push(roleName);
    }
    
    sql += ' ORDER BY w.created_at DESC';
    
    return await db.all(sql, params);
  }

  async closeAlert(alertId, userId, reason) {
    await db.run(
      'UPDATE workbench_alerts SET status = "closed", closed_by = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId, alertId]
    );
  }
}

module.exports = new AlertService();
