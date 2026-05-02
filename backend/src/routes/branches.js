const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRepositoryPermission } = require('../middleware/auth');

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

router.get('/repository/:repoId', authenticateToken, (req, res) => {
  const branches = db.prepare(`
    SELECT b.*, 
           COUNT(c.id) as commit_count,
           (SELECT COUNT(*) FROM merge_requests mr 
            WHERE mr.source_branch_id = b.id AND mr.status IN ('pending_review', 'in_review')) as open_mr_count
    FROM branches b
    LEFT JOIN commits c ON b.id = c.branch_id
    WHERE b.repository_id = ?
    GROUP BY b.id
    ORDER BY b.is_protected DESC, b.created_at DESC
  `).all(req.params.repoId);

  res.json(branches);
});

router.get('/:id', authenticateToken, (req, res) => {
  const branch = db.prepare(`
    SELECT b.*, r.name as repository_name
    FROM branches b
    JOIN repositories r ON b.repository_id = r.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!branch) {
    return res.status(404).json({ error: '分支不存在' });
  }

  const commits = db.prepare(`
    SELECT c.*, u.username as author_name
    FROM commits c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.branch_id = ?
    ORDER BY c.created_at DESC
    LIMIT 50
  `).all(branch.id);

  res.json({
    ...branch,
    commits,
    available_actions: getBranchActions(branch, req.user)
  });
});

const getBranchActions = (branch, user) => {
  const actions = [];
  
  if (!branch.is_protected) {
    actions.push({ action: 'submit_code', label: '提交代码' });
  }
  
  if (['admin', 'devops'].includes(user.role)) {
    actions.push({ 
      action: branch.is_protected ? 'unprotect' : 'protect', 
      label: branch.is_protected ? '取消保护' : '保护分支' 
    });
  }
  
  return actions;
};

router.post('/', authenticateToken, (req, res) => {
  const { repository_id, name, from_branch_id } = req.body;

  if (!repository_id || !name) {
    return res.status(400).json({ error: '仓库ID和分支名称不能为空' });
  }

  const existingBranch = db.prepare(`
    SELECT id FROM branches WHERE repository_id = ? AND name = ?
  `).get(repository_id, name);

  if (existingBranch) {
    return res.status(409).json({ error: '分支名称已存在' });
  }

  const fromBranch = from_branch_id 
    ? db.prepare('SELECT * FROM branches WHERE id = ?').get(from_branch_id)
    : null;

  const branchId = uuidv4();
  
  db.prepare(`
    INSERT INTO branches (id, repository_id, name, is_protected, latest_commit)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    branchId,
    repository_id,
    name,
    0,
    fromBranch ? fromBranch.latest_commit : null
  );

  createAuditLog(req.user.id, 'CREATE_BRANCH', 'BRANCH', branchId, { 
    name, 
    repository_id,
    from_branch: fromBranch ? fromBranch.name : null
  });

  res.status(201).json({
    id: branchId,
    name,
    repository_id,
    message: '分支创建成功'
  });
});

router.post('/:id/action', authenticateToken, (req, res) => {
  const { action } = req.body;
  const branchId = req.params.id;

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: '分支不存在' });
  }

  switch (action) {
    case 'protect':
      if (!['admin', 'devops'].includes(req.user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }
      db.prepare('UPDATE branches SET is_protected = 1 WHERE id = ?').run(branchId);
      createAuditLog(req.user.id, 'PROTECT_BRANCH', 'BRANCH', branchId, { branch_name: branch.name });
      return res.json({ message: '分支已保护' });

    case 'unprotect':
      if (!['admin', 'devops'].includes(req.user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }
      db.prepare('UPDATE branches SET is_protected = 0 WHERE id = ?').run(branchId);
      createAuditLog(req.user.id, 'UNPROTECT_BRANCH', 'BRANCH', branchId, { branch_name: branch.name });
      return res.json({ message: '分支已取消保护' });

    default:
      return res.status(400).json({ error: '未知操作' });
  }
});

router.get('/:branchId/commits', authenticateToken, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const commits = db.prepare(`
    SELECT c.*, u.username as author_name
    FROM commits c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.branch_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.branchId, Number(limit), offset);

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM commits WHERE branch_id = ?
  `).get(req.params.branchId);

  res.json({
    data: commits,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countResult.total
    }
  });
});

router.post('/:branchId/commits', authenticateToken, (req, res) => {
  const { message, parent_hash, files } = req.body;
  const branchId = req.params.branchId;

  if (!message) {
    return res.status(400).json({ error: '提交信息不能为空' });
  }

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: '分支不存在' });
  }

  const validation = validateCommit(branch, req.user);
  
  if (!validation.passed) {
    return res.status(400).json({
      error: '提交校验失败',
      validation_errors: validation.errors,
      available_actions: [
        { action: 'fix', label: '修复问题' },
        { action: 'request_supplement', label: '申请补充资料' },
        { action: 'reassign', label: '转派' }
      ]
    });
  }

  const commitHash = generateCommitHash();
  const commitId = uuidv4();
  const initialStatus = 'pending_submit';

  db.prepare(`
    INSERT INTO commits (id, branch_id, message, author_id, commit_hash, parent_hash, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    commitId,
    branchId,
    message,
    req.user.id,
    commitHash,
    parent_hash || branch.latest_commit,
    initialStatus
  );

  db.prepare(`
    UPDATE branches SET latest_commit = ?, updated_at = strftime("%s", "now") WHERE id = ?
  `).run(commitHash, branchId);

  createStatusHistory('COMMIT', commitId, null, initialStatus, 'SUBMIT', message, req.user.id);
  createAuditLog(req.user.id, 'CREATE_COMMIT', 'COMMIT', commitId, { 
    commit_hash: commitHash,
    branch_name: branch.name,
    message: message.substring(0, 100)
  });

  res.status(201).json({
    id: commitId,
    commit_hash: commitHash,
    status: initialStatus,
    message: '代码提交成功，等待发起合并',
    next_action: {
      action: 'create_merge_request',
      label: '发起合并请求'
    }
  });
});

const validateCommit = (branch, user) => {
  const errors = [];
  
  if (branch.is_protected && !['admin', 'devops'].includes(user.role)) {
    errors.push('受保护分支需要管理员权限才能提交');
  }

  return {
    passed: errors.length === 0,
    errors
  };
};

const generateCommitHash = () => {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

module.exports = router;
