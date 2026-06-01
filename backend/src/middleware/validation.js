import db from '../database/init.js';

export const validateTaskExecution = (req, res, next) => {
  const { strategy_id, change_order_id, task_type } = req.body;

  if (strategy_id) {
    const strategy = db.prepare(`
      SELECT bs.*, e.status as env_status
      FROM backup_strategies bs
      JOIN environments e ON bs.env_id = e.id
      WHERE bs.id = ?
    `).get(strategy_id);

    if (!strategy) {
      return res.status(400).json({ error: '备份策略不存在' });
    }

    if (strategy.status !== 'active') {
      return res.status(400).json({ error: '备份策略未激活' });
    }

    if (strategy.env_status !== 'active') {
      return res.status(400).json({ error: '环境未处于可用状态' });
    }

    if (!strategy.rule_version) {
      return res.status(400).json({ error: '策略规则版本未设置' });
    }

    req.strategy = strategy;
  }

  if (change_order_id) {
    const changeOrder = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(change_order_id);
    
    if (!changeOrder) {
      return res.status(400).json({ error: '变更单不存在' });
    }

    if (changeOrder.status !== 'approved') {
      return res.status(400).json({ error: '变更单未审批通过，无法执行' });
    }

    if (changeOrder.previous_node_result && JSON.parse(changeOrder.previous_node_result).status !== 'success') {
      return res.status(400).json({ error: '上一节点执行未通过' });
    }

    if (changeOrder.required_materials) {
      const required = JSON.parse(changeOrder.required_materials);
      const attachments = db.prepare('SELECT COUNT(*) as count FROM attachments WHERE change_order_id = ?').get(change_order_id);
      if (attachments.count < required.length) {
        return res.status(400).json({ error: '必填材料不完整' });
      }
    }

    req.changeOrder = changeOrder;
  }

  next();
};

export const validateChangeOrder = (req, res, next) => {
  const { change_type, app_id, env_id, strategy_id, new_config } = req.body;

  if (!change_type || !app_id) {
    return res.status(400).json({ error: '变更类型和应用ID为必填项' });
  }

  if (strategy_id) {
    const existingStrategy = db.prepare('SELECT * FROM backup_strategies WHERE id = ?').get(strategy_id);
    if (!existingStrategy) {
      return res.status(400).json({ error: '策略不存在' });
    }
    
    if (new_config && JSON.stringify(existingStrategy) === JSON.stringify(new_config)) {
      return res.status(400).json({ error: '配置未发生变化，无需提交变更单' });
    }
  }

  const recentChanges = db.prepare(`
    SELECT COUNT(*) as count FROM change_orders
    WHERE app_id = ? AND status IN ('draft', 'pending_approval', 'approved')
    AND created_at > datetime('now', '-24 hours')
  `).get(app_id);

  if (recentChanges.count >= 5) {
    return res.status(400).json({ error: '24小时内变更过于频繁，请稍后再试' });
  }

  next();
};

export const preventDuplicateTask = (req, res, next) => {
  const { strategy_id, task_type } = req.body;
  
  if (strategy_id && task_type) {
    const recentTask = db.prepare(`
      SELECT * FROM tasks
      WHERE strategy_id = ? AND task_type = ? AND status IN ('pending', 'running')
      AND created_at > datetime('now', '-5 minutes')
      ORDER BY created_at DESC LIMIT 1
    `).get(strategy_id, task_type);

    if (recentTask) {
      return res.status(409).json({ 
        error: '存在相同的待执行或执行中任务，请避免重复提交',
        existing_task: recentTask.task_no
      });
    }
  }

  next();
};

export default {
  validateTaskExecution,
  validateChangeOrder,
  preventDuplicateTask
};
