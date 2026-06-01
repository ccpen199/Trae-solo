const axios = require('axios');
const crypto = require('crypto');
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

class WebhookExecutor {
  async executeTask(taskId) {
    const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(task.config_id);
    if (!config) {
      throw new Error('配置不存在');
    }

    if (config.status !== 'active') {
      throw new Error('配置未激活');
    }

    db.prepare('UPDATE execution_tasks SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('running', taskId);

    const headers = config.headers ? JSON.parse(config.headers) : {};
    const payload = task.payload ? JSON.parse(task.payload) : {};

    if (config.secret_key) {
      const signature = crypto
        .createHmac('sha256', config.secret_key)
        .update(task.payload || '{}')
        .digest('hex');
      headers['X-Signature'] = `sha256=${signature}`;
    }

    let retryCount = 0;
    let lastError = null;
    let logId = null;

    while (retryCount <= config.retry_count) {
      const startTime = Date.now();
      
      try {
        const response = await axios({
          method: config.method.toLowerCase(),
          url: config.url,
          headers,
          data: payload,
          timeout: config.timeout,
          validateStatus: () => true
        });

        const duration = Date.now() - startTime;
        const success = response.status >= 200 && response.status < 300;

        logId = uuidv4();
        db.prepare(`
          INSERT INTO call_logs (
            id, task_id, config_id, request_url, request_method, request_headers,
            request_body, response_status, response_headers, response_body,
            duration, success, retry_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          logId, taskId, config.id, config.url, config.method,
          JSON.stringify(headers), task.payload, response.status,
          JSON.stringify(response.headers),
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          duration, success ? 1 : 0, retryCount
        );

        if (success) {
          db.prepare(`
            UPDATE execution_tasks 
            SET status = ?, completed_at = CURRENT_TIMESTAMP, result = ? 
            WHERE id = ?
          `).run('completed', JSON.stringify({ success: true, logId }), taskId);
          
          return { success: true, logId, taskId };
        }

        lastError = `HTTP ${response.status}`;
      } catch (error) {
        const duration = Date.now() - startTime;
        logId = uuidv4();
        
        db.prepare(`
          INSERT INTO call_logs (
            id, task_id, config_id, request_url, request_method, request_headers,
            request_body, response_status, error_message, duration, success, retry_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          logId, taskId, config.id, config.url, config.method,
          JSON.stringify(headers), task.payload, null, error.message,
          duration, 0, retryCount
        );

        lastError = error.message;
      }

      retryCount++;
      if (retryCount <= config.retry_count) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (logId) {
      db.prepare(`
        INSERT INTO exception_records (
          id, log_id, task_id, error_type, error_message, original_request
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), logId, taskId, 'execution_failed', lastError,
        JSON.stringify({ url: config.url, method: config.method, headers, payload })
      );

      db.prepare(`
        INSERT INTO alerts (id, task_id, log_id, alert_type, severity, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), taskId, logId, 'execution_failed', 'high',
        `Webhook执行失败: ${config.name} - ${lastError}`
      );
    }

    db.prepare(`
      UPDATE execution_tasks 
      SET status = ?, completed_at = CURRENT_TIMESTAMP, result = ? 
      WHERE id = ?
    `).run('failed', JSON.stringify({ success: false, error: lastError, logId }), taskId);

    return { success: false, error: lastError, logId, taskId };
  }

  validateExecution(configId, userId, payload) {
    const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(configId);
    if (!config) {
      return { valid: false, reason: '配置不存在' };
    }

    if (config.status !== 'active') {
      return { valid: false, reason: '配置未激活' };
    }

    const pendingChange = db.prepare(
      'SELECT * FROM change_orders WHERE config_id = ? AND status = ?'
    ).get(configId, 'pending');
    if (pendingChange) {
      return { valid: false, reason: '有待审批的变更单，请先处理' };
    }

    if (!payload || Object.keys(JSON.parse(payload || '{}')).length === 0) {
      return { valid: false, reason: '请求体不能为空' };
    }

    return { valid: true };
  }
}

module.exports = new WebhookExecutor();
