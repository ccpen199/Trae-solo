const db = require('../models/database');

class Validator {
  validateConfigChange(configId, userId, changeType, newValue) {
    const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(configId);
    if (!config) {
      return { valid: false, reason: '配置不存在' };
    }

    if (config.status !== 'active') {
      return { valid: false, reason: '配置未激活，无法变更' };
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return { valid: false, reason: '用户不存在' };
    }

    const permission = db.prepare(
      'SELECT * FROM permissions WHERE user_id = ? AND app_id = ?'
    ).get(userId, config.app_id);

    const hasPermission = user.role === 'admin' || 
                         user.role === 'devops' ||
                         (permission && ['admin', 'owner'].includes(permission.role));

    if (!hasPermission) {
      return { valid: false, reason: '无变更权限' };
    }

    if (changeType === 'url' && !this.isValidUrl(newValue)) {
      return { valid: false, reason: 'URL格式不正确' };
    }

    if (changeType === 'method' && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(newValue)) {
      return { valid: false, reason: '不支持的HTTP方法' };
    }

    if (changeType === 'timeout') {
      const timeout = parseInt(newValue);
      if (isNaN(timeout) || timeout < 1000 || timeout > 300000) {
        return { valid: false, reason: '超时时间必须在1-300秒之间' };
      }
    }

    return { valid: true };
  }

  validateTaskCreation(configId, userId, payload) {
    const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(configId);
    if (!config) {
      return { valid: false, reason: '配置不存在' };
    }

    if (config.status !== 'active') {
      return { valid: false, reason: '配置未激活' };
    }

    const pendingChanges = db.prepare(
      'SELECT COUNT(*) as count FROM change_orders WHERE config_id = ? AND status = ?'
    ).get(configId, 'pending').count;

    if (pendingChanges > 0) {
      return { valid: false, reason: '存在待审批的变更，请先处理后再执行' };
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return { valid: false, reason: '用户不存在' };
    }

    if (!payload || Object.keys(payload).length === 0) {
      return { valid: false, reason: '请求体不能为空' };
    }

    try {
      JSON.parse(JSON.stringify(payload));
    } catch (e) {
      return { valid: false, reason: '请求体不是有效的JSON格式' };
    }

    return { valid: true };
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  maskSensitiveData(data, fields = ['secret_key', 'password', 'token']) {
    if (!data) return data;
    
    const mask = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const result = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        if (fields.includes(key)) {
          result[key] = '***' + (typeof value === 'string' ? value.slice(-4) : '');
        } else if (typeof value === 'object') {
          result[key] = mask(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return mask(data);
  }
}

module.exports = new Validator();
