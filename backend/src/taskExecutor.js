const { EventEmitter } = require('events');

class TaskExecutor extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.runningTasks = new Map();
  }

  getTaskSteps(taskType, target) {
    const steps = {
      deploy: [
        { name: '拉取代码', description: '从代码仓库拉取最新代码', duration: 2000 },
        { name: '构建应用', description: '执行构建脚本', duration: 3000 },
        { name: '停止旧版本', description: '停止旧版本服务', duration: 1000 },
        { name: '部署新版本', description: `部署 ${target} 到目标环境`, duration: 2500 },
        { name: '启动服务', description: '启动应用服务', duration: 2000 },
        { name: '健康检查', description: '检查服务健康状态', duration: 1500 },
        { name: '业务验证', description: '执行冒烟测试验证', duration: 2000 }
      ],
      config: [
        { name: '拉取配置', description: '从配置中心获取配置', duration: 1000 },
        { name: '校验配置', description: '验证配置格式和完整性', duration: 1500 },
        { name: '备份配置', description: '备份当前配置', duration: 500 },
        { name: '下发配置', description: `将配置下发到 ${target}`, duration: 2000 },
        { name: '重启服务', description: '重启服务使配置生效', duration: 2000 },
        { name: '验证配置', description: '验证配置是否正确加载', duration: 1500 }
      ],
      rollback: [
        { name: '停止服务', description: '停止当前版本服务', duration: 1500 },
        { name: '回滚版本', description: '切换到上一个稳定版本', duration: 2000 },
        { name: '启动服务', description: '启动回滚后的服务', duration: 2000 },
        { name: '健康检查', description: '检查回滚后服务状态', duration: 1500 },
        { name: '验证回滚', description: '验证回滚结果', duration: 1500 }
      ],
      restart: [
        { name: '停止服务', description: '优雅停止服务', duration: 2000 },
        { name: '清理资源', description: '清理临时资源', duration: 1000 },
        { name: '启动服务', description: '重新启动服务', duration: 2500 },
        { name: '健康检查', description: '服务健康检查', duration: 1500 }
      ],
      hotfix: [
        { name: '拉取修复代码', description: '拉取紧急修复代码', duration: 1500 },
        { name: '构建补丁', description: '应用补丁包', duration: 2000 },
        { name: '热更新', description: '热更新应用', duration: 1500 },
        { name: '验证修复', description: '验证修复效果', duration: 2000 }
      ]
    };

    return steps[taskType] || steps.deploy;
  }

  async executeTask(taskId) {
    const task = this.db.prepare(`
      SELECT et.*, co.title as change_order_title, a.app_name, e.env_name
      FROM execution_tasks et
      LEFT JOIN change_orders co ON et.change_order_id = co.id
      LEFT JOIN applications a ON co.app_id = a.id
      LEFT JOIN environments e ON co.env_id = e.id
      WHERE et.id = ?
    `).get(taskId);

    if (!task) {
      throw new Error('任务不存在');
    }

    if (task.status === 'running') {
      throw new Error('任务正在执行中');
    }

    const steps = this.getTaskSteps(task.task_type, task.target || task.app_name || '目标应用');
    const totalSteps = steps.length;
    
    this.db.prepare(`
      UPDATE execution_tasks 
      SET status = 'running', started_at = CURRENT_TIMESTAMP, result = ?
      WHERE id = ?
    `).run(JSON.stringify({ currentStep: 0, totalSteps, steps: steps.map(s => ({ ...s, status: 'pending' })) }), taskId);

    this.emit('task:started', { taskId, task });
    this.runningTasks.set(taskId, { task, steps, currentStep: 0 });

    let stepResults = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      this.db.prepare(`
        UPDATE execution_tasks 
        SET result = ?
        WHERE id = ?
      `).run(JSON.stringify({ 
        currentStep: i + 1, 
        totalSteps, 
        currentStepName: step.name,
        steps: steps.map((s, idx) => ({ 
          ...s, 
          status: idx < i ? 'completed' : idx === i ? 'running' : 'pending'
        })),
        stepResults
      }), taskId);

      this.emit('task:step:start', { taskId, stepIndex: i, step });

      try {
        const result = await this.executeStep(task, step, i, totalSteps);
        
        stepResults.push({ step: step.name, status: 'success', result, completedAt: new Date().toISOString() });
        
        this.emit('task:step:complete', { taskId, stepIndex: i, step, result });
        
        this.db.prepare(`
          INSERT INTO call_logs (task_id, api_name, method, request_url, response_status, duration_ms, called_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(taskId, step.name, 'EXECUTE', step.description, 200, step.duration, task.executed_by || 1);
        
      } catch (error) {
        stepResults.push({ step: step.name, status: 'failed', error: error.message, completedAt: new Date().toISOString() });
        
        this.emit('task:step:failed', { taskId, stepIndex: i, step, error: error.message });

        this.db.prepare(`
          UPDATE execution_tasks 
          SET status = 'failed', completed_at = CURRENT_TIMESTAMP, result = ?
          WHERE id = ?
        `).run(JSON.stringify({ 
          currentStep: i + 1, 
          totalSteps, 
          failedStep: step.name,
          error: error.message,
          steps: steps.map((s, idx) => ({ 
            ...s, 
            status: idx < i ? 'completed' : idx === i ? 'failed' : 'pending'
          })),
          stepResults
        }), taskId);

        this.db.prepare(`
          INSERT INTO alarm_records (alarm_type, severity, source, message, related_id, related_type, handle_result)
          VALUES ('task_failure', 'high', 'execution', ?, ?, 'task', 'pending')
        `).run(`任务执行失败: ${task.task_no} - ${step.name}`, taskId);

        this.emit('task:failed', { taskId, task, error: error.message, failedStep: step.name });
        this.runningTasks.delete(taskId);
        
        return { success: false, error: error.message, failedStep: step.name };
      }
    }

    this.db.prepare(`
      UPDATE execution_tasks 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, result = ?
      WHERE id = ?
    `).run(JSON.stringify({ 
      currentStep: totalSteps, 
      totalSteps, 
      steps: steps.map(s => ({ ...s, status: 'completed' })),
      stepResults,
      summary: `成功执行 ${totalSteps} 个步骤`
    }), taskId);

    this.db.prepare(`
      UPDATE change_orders 
      SET status = 'executed', executed_by = ?, executed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(task.executed_by || 1, task.change_order_id);

    this.emit('task:completed', { taskId, task, stepResults });
    this.runningTasks.delete(taskId);

    return { success: true, stepResults };
  }

  async executeStep(task, step, stepIndex, totalSteps) {
    return new Promise((resolve, reject) => {
      const delay = step.duration || 2000;
      
      setTimeout(() => {
        const successRate = task.task_type === 'hotfix' ? 0.85 : 0.95;
        const shouldFail = Math.random() > successRate;
        
        if (shouldFail && stepIndex > Math.floor(totalSteps / 2)) {
          reject(new Error(`${step.name} 失败: 模拟执行异常`));
        } else {
          resolve({
            message: `${step.name} 完成`,
            details: step.description,
            duration: delay,
            timestamp: new Date().toISOString()
          });
        }
      }, delay);
    });
  }

  getTaskStatus(taskId) {
    const task = this.db.prepare(`
      SELECT et.*, u.name as executor_name,
             co.order_no, co.title as change_order_title, co.type as change_order_type,
             a.app_code, a.app_name, a.tech_stack,
             e.env_name, e.env_type, e.server_address,
             v.version_number, v.release_notes
      FROM execution_tasks et
      LEFT JOIN users u ON et.executed_by = u.id
      LEFT JOIN change_orders co ON et.change_order_id = co.id
      LEFT JOIN applications a ON co.app_id = a.id
      LEFT JOIN environments e ON co.env_id = e.id
      LEFT JOIN versions v ON a.id = v.app_id AND v.status IN ('published', 'staging', 'testing')
      WHERE et.id = ?
      ORDER BY v.id DESC
      LIMIT 1
    `).get(taskId);

    if (!task) {
      return null;
    }

    let result = {};
    try {
      result = task.result ? JSON.parse(task.result) : {};
    } catch (e) {
      result = { raw: task.result };
    }

    const sourceCode = {
      repository: task.tech_stack ? `${task.app_code}.git` : null,
      branch: task.change_order_type === 'hotfix' ? 'hotfix' : 'main',
      version: task.version_number || 'latest',
      commit_id: task.change_order_title ? `#${task.order_no}` : null,
      change_order: task.order_no,
      change_order_title: task.change_order_title
    };

    const targetEnvironment = {
      app_code: task.app_code,
      app_name: task.app_name,
      env_name: task.env_name || '默认环境',
      env_type: task.env_type || 'production',
      server_address: task.server_address || '127.0.0.1',
      tech_stack: task.tech_stack
    };

    return {
      ...task,
      result,
      sourceCode,
      targetEnvironment,
      progress: result.currentStep && result.totalSteps 
        ? Math.round((result.currentStep / result.totalSteps) * 100) 
        : task.status === 'completed' ? 100 : 0
    };
  }

  cancelTask(taskId) {
    const running = this.runningTasks.get(taskId);
    if (running) {
      this.db.prepare(`
        UPDATE execution_tasks 
        SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(taskId);
      
      this.runningTasks.delete(taskId);
      this.emit('task:cancelled', { taskId });
      return true;
    }
    return false;
  }
}

module.exports = { TaskExecutor };
