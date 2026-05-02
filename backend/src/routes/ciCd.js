const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

const createStatusHistory = (entityType, entityId, fromStatus, toStatus, action, comment, actorId) => {
  db.prepare(`
    INSERT INTO status_history (id, entity_type, entity_id, from_status, to_status, action, comment, actor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), entityType, entityId, fromStatus, toStatus, action, comment, actorId);
};

const createMessage = (recipientId, entityType, entityId, title, content, type = 'todo') => {
  db.prepare(`
    INSERT INTO messages (id, recipient_id, entity_type, entity_id, title, content, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), recipientId, entityType, entityId, title, content, type);
};

const createAuditLog = (actorId, action, entityType, entityId, details) => {
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), actorId, action, entityType, entityId, JSON.stringify(details));
};

router.get('/', authenticateToken, (req, res) => {
  const { status, repository_id, merge_request_id, stage, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*,
           r.name as repository_name,
           mr.main_order_no as mr_order_no
    FROM ci_pipelines p
    JOIN repositories r ON p.repository_id = r.id
    LEFT JOIN merge_requests mr ON p.merge_request_id = mr.id
  `;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (repository_id) {
    conditions.push('p.repository_id = ?');
    params.push(repository_id);
  }

  if (merge_request_id) {
    conditions.push('p.merge_request_id = ?');
    params.push(merge_request_id);
  }

  if (stage) {
    conditions.push('p.stage = ?');
    params.push(stage);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const pipelines = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM ci_pipelines p';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const countResult = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({
    data: pipelines,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countResult.total
    }
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const pipeline = db.prepare(`
    SELECT p.*,
           r.name as repository_name,
           mr.main_order_no as mr_order_no,
           c.commit_hash
    FROM ci_pipelines p
    JOIN repositories r ON p.repository_id = r.id
    LEFT JOIN merge_requests mr ON p.merge_request_id = mr.id
    LEFT JOIN commits c ON p.commit_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!pipeline) {
    return res.status(404).json({ error: '流水线不存在' });
  }

  const deployments = db.prepare(`
    SELECT * FROM deployments WHERE pipeline_id = ?
    ORDER BY created_at DESC
  `).all(pipeline.id);

  res.json({
    ...pipeline,
    deployments,
    available_actions: getPipelineActions(pipeline, req.user)
  });
});

const getPipelineActions = (pipeline, user) => {
  const actions = [];

  if (!['admin', 'devops'].includes(user.role)) {
    return actions;
  }

  switch (pipeline.status) {
    case 'failed':
      if (pipeline.retry_count < 3) {
        actions.push({ action: 'retry', label: '重试' });
      }
      actions.push({ action: 'approve_continue', label: '人工审批继续' });
      actions.push({ action: 'rollback', label: '一键回滚' });
      break;

    case 'pending':
      actions.push({ action: 'start', label: '开始构建' });
      break;

    case 'success':
      actions.push({ action: 'deploy', label: '部署' });
      break;

    default:
      break;
  }

  return actions;
};

router.post('/', authenticateToken, (req, res) => {
  const { repository_id, merge_request_id, commit_id, stage } = req.body;

  if (!repository_id) {
    return res.status(400).json({ error: '仓库ID不能为空' });
  }

  const pipelineId = uuidv4();
  const initialStatus = 'pending';

  db.prepare(`
    INSERT INTO ci_pipelines (
      id, repository_id, merge_request_id, commit_id, stage, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    pipelineId,
    repository_id,
    merge_request_id,
    commit_id,
    stage || 'build',
    initialStatus
  );

  createAuditLog(req.user.id, 'CREATE_PIPELINE', 'PIPELINE', pipelineId, {
    repository_id,
    merge_request_id,
    stage: stage || 'build'
  });

  res.status(201).json({
    id: pipelineId,
    status: initialStatus,
    message: '流水线已创建'
  });
});

router.post('/:id/action', authenticateToken, (req, res) => {
  const { action, environment, version, previous_version } = req.body;
  const pipelineId = req.params.id;

  const pipeline = db.prepare('SELECT * FROM ci_pipelines WHERE id = ?').get(pipelineId);
  if (!pipeline) {
    return res.status(404).json({ error: '流水线不存在' });
  }

  if (!['admin', 'devops'].includes(req.user.role)) {
    return res.status(403).json({ error: '权限不足' });
  }

  let newStatus = pipeline.status;
  let actionResult = '';

  switch (action) {
    case 'start':
      if (pipeline.status !== 'pending') {
        return res.status(400).json({ error: '当前状态无法启动' });
      }
      newStatus = 'running';
      actionResult = '构建开始';
      
      db.prepare(`
        UPDATE ci_pipelines 
        SET status = ?, start_time = strftime("%s", "now"), updated_at = strftime("%s", "now")
        WHERE id = ?
      `).run(newStatus, pipelineId);
      
      simulatePipeline(pipelineId);
      break;

    case 'retry':
      if (pipeline.status !== 'failed') {
        return res.status(400).json({ error: '只有失败的流水线才能重试' });
      }
      if (pipeline.retry_count >= 3) {
        return res.status(400).json({ error: '已达到最大重试次数' });
      }
      
      newStatus = 'running';
      actionResult = '重新构建';
      
      db.prepare(`
        UPDATE ci_pipelines 
        SET status = ?, retry_count = retry_count + 1, start_time = strftime("%s", "now"), updated_at = strftime("%s", "now")
        WHERE id = ?
      `).run(newStatus, pipelineId);
      
      simulatePipeline(pipelineId);
      break;

    case 'approve_continue':
      if (pipeline.status !== 'failed') {
        return res.status(400).json({ error: '当前状态无法审批继续' });
      }
      newStatus = 'success';
      actionResult = '人工审批通过，标记为成功';
      
      db.prepare(`
        UPDATE ci_pipelines 
        SET status = ?, end_time = strftime("%s", "now"), updated_at = strftime("%s", "now")
        WHERE id = ?
      `).run(newStatus, pipelineId);
      break;

    case 'rollback':
      if (!previous_version) {
        return res.status(400).json({ error: '请指定要回滚到的版本' });
      }
      
      const deploymentId = uuidv4();
      
      db.prepare(`
        INSERT INTO deployments (
          id, pipeline_id, repository_id, environment, version, status, previous_version, rollback_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        deploymentId,
        pipelineId,
        pipeline.repository_id,
        environment || 'production',
        previous_version,
        'success',
        version,
        1
      );
      
      createAuditLog(req.user.id, 'ROLLBACK', 'DEPLOYMENT', deploymentId, {
        from_version: version,
        to_version: previous_version,
        environment: environment || 'production'
      });
      
      createStatusHistory('PIPELINE', pipelineId, pipeline.status, 'rolled_back', 'ROLLBACK', 
        `从版本 ${version} 回滚到 ${previous_version}`, req.user.id);
      
      return res.json({
        id: deploymentId,
        message: `已成功回滚到版本 ${previous_version}`
      });

    case 'deploy':
      if (pipeline.status !== 'success') {
        return res.status(400).json({ error: '只有成功的流水线才能部署' });
      }
      if (!environment) {
        return res.status(400).json({ error: '请指定部署环境' });
      }
      if (!version) {
        return res.status(400).json({ error: '请指定版本号' });
      }
      
      const newDeploymentId = uuidv4();
      
      db.prepare(`
        INSERT INTO deployments (
          id, pipeline_id, repository_id, environment, version, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        newDeploymentId,
        pipelineId,
        pipeline.repository_id,
        environment,
        version,
        'success'
      );
      
      createAuditLog(req.user.id, 'DEPLOY', 'DEPLOYMENT', newDeploymentId, {
        version,
        environment,
        pipeline_id: pipelineId
      });
      
      return res.json({
        id: newDeploymentId,
        version,
        environment,
        message: '部署成功'
      });

    default:
      return res.status(400).json({ error: '未知操作' });
  }

  if (newStatus !== pipeline.status) {
    createStatusHistory('PIPELINE', pipelineId, pipeline.status, newStatus, action.toUpperCase(), '', req.user.id);
    createAuditLog(req.user.id, `${action.toUpperCase()}_PIPELINE`, 'PIPELINE', pipelineId, {
      from_status: pipeline.status,
      to_status: newStatus
    });

    if (newStatus === 'failed') {
      const admins = db.prepare("SELECT id FROM users WHERE role IN ('admin', 'devops')").all();
      admins.forEach(admin => {
        createMessage(
          admin.id,
          'PIPELINE',
          pipelineId,
          '流水线构建失败',
          `流水线 ${pipelineId} 构建失败，请及时处理`,
          'alert'
        );
      });
    }
  }

  res.json({
    id: pipelineId,
    status: newStatus,
    message: actionResult
  });
});

const simulatePipeline = (pipelineId) => {
  setTimeout(() => {
    const success = Math.random() > 0.2;
    
    if (success) {
      db.prepare(`
        UPDATE ci_pipelines 
        SET status = 'success', end_time = strftime("%s", "now"), updated_at = strftime("%s", "now")
        WHERE id = ?
      `).run(pipelineId);
    } else {
      db.prepare(`
        UPDATE ci_pipelines 
        SET status = 'failed', end_time = strftime("%s", "now"), exit_code = 1, logs = 'Build failed: compilation error', updated_at = strftime("%s", "now")
        WHERE id = ?
      `).run(pipelineId);
    }
  }, 3000);
};

router.get('/deployments/:id', authenticateToken, (req, res) => {
  const deployment = db.prepare(`
    SELECT d.*,
           p.status as pipeline_status,
           r.name as repository_name
    FROM deployments d
    JOIN ci_pipelines p ON d.pipeline_id = p.id
    JOIN repositories r ON d.repository_id = r.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!deployment) {
    return res.status(404).json({ error: '部署记录不存在' });
  }

  res.json(deployment);
});

module.exports = router;
