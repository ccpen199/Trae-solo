const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRepositoryPermission } = require('../middleware/auth');

const router = express.Router();

const generateMainOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REPO-${year}${month}${day}-${random}`;
};

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
  const { status, owner_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT r.*, 
           u.username as owner_name,
           u2.username as responsible_name,
           (SELECT COUNT(*) FROM branches WHERE repository_id = r.id) as branch_count,
           (SELECT COUNT(*) FROM merge_requests WHERE repository_id = r.id AND status IN ('pending_review', 'in_review')) as pending_mr_count
    FROM repositories r
    LEFT JOIN users u ON r.owner_id = u.id
    LEFT JOIN users u2 ON r.responsible_id = u2.id
  `;
  
  const conditions = [];
  const params = [];

  if (req.user.role !== 'admin') {
    conditions.push(`(r.owner_id = ? OR r.responsible_id = ? OR EXISTS (
      SELECT 1 FROM permissions p WHERE p.repository_id = r.id AND p.user_id = ?
    ))`);
    params.push(req.user.id, req.user.id, req.user.id);
  }

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (owner_id) {
    conditions.push('r.owner_id = ?');
    params.push(owner_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const repositories = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM repositories r';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const countResult = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({
    data: repositories,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const repository = db.prepare(`
    SELECT r.*, 
           u.username as owner_name,
           u2.username as responsible_name
    FROM repositories r
    LEFT JOIN users u ON r.owner_id = u.id
    LEFT JOIN users u2 ON r.responsible_id = u2.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!repository) {
    return res.status(404).json({ error: '仓库不存在' });
  }

  const history = db.prepare(`
    SELECT sh.*, u.username as actor_name
    FROM status_history sh
    LEFT JOIN users u ON sh.actor_id = u.id
    WHERE sh.entity_type = 'REPOSITORY' AND sh.entity_id = ?
    ORDER BY sh.created_at DESC
  `).all(repository.id);

  const attachments = db.prepare(`
    SELECT * FROM attachments 
    WHERE entity_type = 'REPOSITORY' AND entity_id = ?
    ORDER BY created_at DESC
  `).all(repository.id);

  const branches = db.prepare(`
    SELECT * FROM branches WHERE repository_id = ?
    ORDER BY created_at DESC
  `).all(repository.id);

  res.json({
    ...repository,
    history,
    attachments,
    branches,
    available_actions: getAvailableActions(repository.status, req.user)
  });
});

const getAvailableActions = (status, user) => {
  const actions = [];
  
  switch (status) {
    case 'pending_create':
      if (['admin', 'devops'].includes(user.role)) {
        actions.push({ action: 'approve', label: '审批创建' });
        actions.push({ action: 'reject', label: '驳回' });
      }
      break;
    case 'active':
      actions.push({ action: 'archive', label: '归档' });
      if (user.role === 'admin') {
        actions.push({ action: 'delete', label: '删除' });
      }
      break;
    case 'archived':
      if (user.role === 'admin') {
        actions.push({ action: 'restore', label: '恢复' });
      }
      break;
  }
  
  return actions;
};

router.post('/', authenticateToken, (req, res) => {
  const { name, description, responsible_id, expected_finish_time, is_public } = req.body;

  if (!name) {
    return res.status(400).json({ error: '仓库名称不能为空' });
  }

  const existingRepo = db.prepare('SELECT id FROM repositories WHERE name = ?').get(name);
  if (existingRepo) {
    return res.status(409).json({ error: '仓库名称已存在' });
  }

  const mainOrderNo = generateMainOrderNo();
  const repoId = uuidv4();
  const initialStatus = 'pending_create';

  db.prepare(`
    INSERT INTO repositories (
      id, main_order_no, name, description, owner_id, 
      responsible_id, expected_finish_time, status, is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    repoId,
    mainOrderNo,
    name,
    description,
    req.user.id,
    responsible_id || req.user.id,
    expected_finish_time ? Math.floor(new Date(expected_finish_time).getTime() / 1000) : null,
    initialStatus,
    is_public ? 1 : 0
  );

  db.prepare(`
    INSERT INTO permissions (id, user_id, repository_id, permission_level)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), req.user.id, repoId, 'admin');

  createStatusHistory('REPOSITORY', repoId, null, initialStatus, 'CREATE', '创建仓库申请', req.user.id);
  createAuditLog(req.user.id, 'CREATE_REPOSITORY', 'REPOSITORY', repoId, { name, mainOrderNo });

  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  admins.forEach(admin => {
    createMessage(
      admin.id,
      'REPOSITORY',
      repoId,
      '新仓库创建待审批',
      `用户 ${req.user.username} 申请创建仓库 ${name}，请及时审批`,
      'todo'
    );
  });

  res.status(201).json({
    id: repoId,
    main_order_no: mainOrderNo,
    name,
    status: initialStatus,
    message: '仓库创建申请已提交，等待审批'
  });
});

router.post('/:id/action', authenticateToken, (req, res) => {
  const { action, comment } = req.body;
  const repoId = req.params.id;

  const repository = db.prepare('SELECT * FROM repositories WHERE id = ?').get(repoId);
  if (!repository) {
    return res.status(404).json({ error: '仓库不存在' });
  }

  let newStatus = null;
  let actionResult = null;

  switch (action) {
    case 'approve':
      if (repository.status !== 'pending_create') {
        return res.status(400).json({ error: '当前状态无法审批' });
      }
      if (!['admin', 'devops'].includes(req.user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }
      newStatus = 'active';
      actionResult = '仓库创建已批准';
      
      db.prepare(`
        INSERT INTO branches (id, repository_id, name, is_protected)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), repoId, 'main', 1);
      
      break;

    case 'reject':
      if (repository.status !== 'pending_create') {
        return res.status(400).json({ error: '当前状态无法驳回' });
      }
      if (!['admin', 'devops'].includes(req.user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }
      newStatus = 'rejected';
      actionResult = '仓库创建已驳回';
      break;

    case 'archive':
      if (repository.status !== 'active') {
        return res.status(400).json({ error: '当前状态无法归档' });
      }
      newStatus = 'archived';
      actionResult = '仓库已归档';
      break;

    case 'restore':
      if (repository.status !== 'archived') {
        return res.status(400).json({ error: '当前状态无法恢复' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '权限不足' });
      }
      newStatus = 'active';
      actionResult = '仓库已恢复';
      break;

    default:
      return res.status(400).json({ error: '未知操作' });
  }

  if (newStatus) {
    db.prepare('UPDATE repositories SET status = ?, updated_at = strftime("%s", "now") WHERE id = ?')
      .run(newStatus, repoId);

    createStatusHistory('REPOSITORY', repoId, repository.status, newStatus, action.toUpperCase(), comment || '', req.user.id);
    createAuditLog(req.user.id, `${action.toUpperCase()}_REPOSITORY`, 'REPOSITORY', repoId, { 
      fromStatus: repository.status, 
      toStatus: newStatus,
      comment 
    });

    createMessage(
      repository.owner_id,
      'REPOSITORY',
      repoId,
      `仓库状态变更: ${actionResult}`,
      comment || `您的仓库 ${repository.name} 已被 ${req.user.username} ${actionResult}`,
      'notification'
    );
  }

  res.json({
    id: repoId,
    status: newStatus || repository.status,
    message: actionResult
  });
});

router.get('/:id/stats', authenticateToken, (req, res) => {
  const repoId = req.params.id;

  const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches WHERE repository_id = ?').get(repoId);
  const mrCount = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'merged' THEN 1 ELSE 0 END) as merged,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
    FROM merge_requests WHERE repository_id = ?
  `).get(repoId);

  const commitCount = db.prepare(`
    SELECT COUNT(*) as count FROM commits c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.repository_id = ?
  `).get(repoId);

  const pipelineStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
    FROM ci_pipelines WHERE repository_id = ?
  `).get(repoId);

  res.json({
    branches: branchCount.count,
    merge_requests: mrCount,
    commits: commitCount.count,
    pipelines: pipelineStats
  });
});

module.exports = router;
