const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateMainOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MR-${year}${month}${day}-${random}`;
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
  const { status, repository_id, author_id, reviewer_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT mr.*,
           r.name as repository_name,
           sb.name as source_branch_name,
           tb.name as target_branch_name,
           u.username as author_name,
           u2.username as reviewer_name
    FROM merge_requests mr
    JOIN repositories r ON mr.repository_id = r.id
    JOIN branches sb ON mr.source_branch_id = sb.id
    JOIN branches tb ON mr.target_branch_id = tb.id
    LEFT JOIN users u ON mr.author_id = u.id
    LEFT JOIN users u2 ON mr.reviewer_id = u2.id
  `;

  const conditions = [];
  const params = [];

  if (req.user.role !== 'admin') {
    conditions.push(`(mr.author_id = ? OR mr.reviewer_id = ?)`);
    params.push(req.user.id, req.user.id);
  }

  if (status) {
    conditions.push('mr.status = ?');
    params.push(status);
  }

  if (repository_id) {
    conditions.push('mr.repository_id = ?');
    params.push(repository_id);
  }

  if (author_id) {
    conditions.push('mr.author_id = ?');
    params.push(author_id);
  }

  if (reviewer_id) {
    conditions.push('mr.reviewer_id = ?');
    params.push(reviewer_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY mr.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const mergeRequests = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM merge_requests mr';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const countResult = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({
    data: mergeRequests,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countResult.total
    }
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const mr = db.prepare(`
    SELECT mr.*,
           r.name as repository_name,
           sb.name as source_branch_name,
           tb.name as target_branch_name,
           u.username as author_name,
           u2.username as reviewer_name
    FROM merge_requests mr
    JOIN repositories r ON mr.repository_id = r.id
    JOIN branches sb ON mr.source_branch_id = sb.id
    JOIN branches tb ON mr.target_branch_id = tb.id
    LEFT JOIN users u ON mr.author_id = u.id
    LEFT JOIN users u2 ON mr.reviewer_id = u2.id
    WHERE mr.id = ?
  `).get(req.params.id);

  if (!mr) {
    return res.status(404).json({ error: '合并请求不存在' });
  }

  const history = db.prepare(`
    SELECT sh.*, u.username as actor_name
    FROM status_history sh
    LEFT JOIN users u ON sh.actor_id = u.id
    WHERE sh.entity_type = 'MERGE_REQUEST' AND sh.entity_id = ?
    ORDER BY sh.created_at ASC
  `).all(mr.id);

  const commits = db.prepare(`
    SELECT c.*, u.username as author_name
    FROM commits c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.branch_id = ?
    ORDER BY c.created_at DESC
  `).all(mr.source_branch_id);

  const pipelines = db.prepare(`
    SELECT * FROM ci_pipelines WHERE merge_request_id = ?
    ORDER BY created_at DESC
  `).all(mr.id);

  res.json({
    ...mr,
    history,
    commits,
    pipelines,
    available_actions: getMRActions(mr, req.user)
  });
});

const getMRActions = (mr, user) => {
  const actions = [];

  if (mr.is_locked && user.id !== mr.locked_by) {
    return [{ action: 'locked', label: '已被锁定', disabled: true }];
  }

  switch (mr.status) {
    case 'pending_review':
      if (user.id === mr.reviewer_id || user.role === 'admin') {
        actions.push({ action: 'start_review', label: '开始审查' });
        actions.push({ action: 'reassign', label: '转派' });
      }
      if (user.id === mr.author_id) {
        actions.push({ action: 'update', label: '更新' });
        actions.push({ action: 'close', label: '关闭' });
      }
      break;

    case 'in_review':
      if (user.id === mr.reviewer_id || user.role === 'admin') {
        actions.push({ action: 'approve', label: '批准' });
        actions.push({ action: 'request_changes', label: '请求修改' });
        actions.push({ action: 'comment', label: '添加评论' });
      }
      if (user.id === mr.author_id) {
        actions.push({ action: 'push_changes', label: '推送修改' });
      }
      break;

    case 'approved':
      if (['admin', 'devops'].includes(user.role) || user.id === mr.reviewer_id) {
        actions.push({ action: 'merge', label: '合并' });
      }
      break;

    default:
      break;
  }

  return actions;
};

router.post('/', authenticateToken, (req, res) => {
  const { repository_id, source_branch_id, target_branch_id, title, description, reviewer_id } = req.body;

  if (!repository_id || !source_branch_id || !target_branch_id || !title) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  if (source_branch_id === target_branch_id) {
    return res.status(400).json({ error: '源分支和目标分支不能相同' });
  }

  const sourceBranch = db.prepare('SELECT * FROM branches WHERE id = ?').get(source_branch_id);
  const targetBranch = db.prepare('SELECT * FROM branches WHERE id = ?').get(target_branch_id);

  if (!sourceBranch || !targetBranch) {
    return res.status(404).json({ error: '分支不存在' });
  }

  const existingMR = db.prepare(`
    SELECT id FROM merge_requests 
    WHERE source_branch_id = ? AND target_branch_id = ? AND status IN ('pending_review', 'in_review', 'approved')
  `).get(source_branch_id, target_branch_id);

  if (existingMR) {
    return res.status(409).json({ error: '该分支组合已有打开的合并请求' });
  }

  const mainOrderNo = generateMainOrderNo();
  const mrId = uuidv4();
  const initialStatus = 'pending_review';

  db.prepare(`
    INSERT INTO merge_requests (
      id, main_order_no, repository_id, source_branch_id, target_branch_id,
      title, description, author_id, reviewer_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    mrId,
    mainOrderNo,
    repository_id,
    source_branch_id,
    target_branch_id,
    title,
    description,
    req.user.id,
    reviewer_id,
    initialStatus
  );

  createStatusHistory('MERGE_REQUEST', mrId, null, initialStatus, 'CREATE', title, req.user.id);
  createAuditLog(req.user.id, 'CREATE_MERGE_REQUEST', 'MERGE_REQUEST', mrId, {
    main_order_no: mainOrderNo,
    source_branch: sourceBranch.name,
    target_branch: targetBranch.name,
    title
  });

  if (reviewer_id) {
    createMessage(
      reviewer_id,
      'MERGE_REQUEST',
      mrId,
      '新的合并请求待审查',
      `用户 ${req.user.username} 发起了合并请求 "${title}"，请及时审查`,
      'todo'
    );
  }

  res.status(201).json({
    id: mrId,
    main_order_no: mainOrderNo,
    status: initialStatus,
    message: '合并请求已创建'
  });
});

router.post('/:id/action', authenticateToken, (req, res) => {
  const { action, comment, new_reviewer_id } = req.body;
  const mrId = req.params.id;

  const mr = db.prepare('SELECT * FROM merge_requests WHERE id = ?').get(mrId);
  if (!mr) {
    return res.status(404).json({ error: '合并请求不存在' });
  }

  if (mr.is_locked && mr.locked_by !== req.user.id) {
    return res.status(409).json({ error: '合并请求已被锁定，当前由其他用户处理' });
  }

  let newStatus = mr.status;
  let actionResult = '';

  switch (action) {
    case 'start_review':
      if (mr.status !== 'pending_review') {
        return res.status(400).json({ error: '当前状态无法开始审查' });
      }
      if (mr.reviewer_id && mr.reviewer_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '您不是指定的审查人' });
      }
      
      db.prepare(`
        UPDATE merge_requests 
        SET is_locked = 1, locked_by = ?, locked_at = strftime("%s", "now")
        WHERE id = ?
      `).run(req.user.id, mrId);
      
      newStatus = 'in_review';
      actionResult = '开始审查';
      break;

    case 'approve':
      if (mr.status !== 'in_review') {
        return res.status(400).json({ error: '当前状态无法批准' });
      }
      if (mr.reviewer_id && mr.reviewer_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '您不是指定的审查人' });
      }
      newStatus = 'approved';
      actionResult = '审查通过';
      break;

    case 'request_changes':
      if (mr.status !== 'in_review') {
        return res.status(400).json({ error: '当前状态无法请求修改' });
      }
      if (mr.reviewer_id && mr.reviewer_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '您不是指定的审查人' });
      }
      if (!comment) {
        return res.status(400).json({ error: '请求修改时必须填写修改意见' });
      }
      newStatus = 'changes_requested';
      actionResult = '请求修改';
      
      createMessage(
        mr.author_id,
        'MERGE_REQUEST',
        mrId,
        '合并请求需要修改',
        `审查人 ${req.user.username} 请求修改: ${comment}`,
        'todo'
      );
      break;

    case 'comment':
      if (!comment) {
        return res.status(400).json({ error: '评论内容不能为空' });
      }
      createStatusHistory('MERGE_REQUEST', mrId, mr.status, mr.status, 'COMMENT', comment, req.user.id);
      return res.json({ message: '评论已添加' });

    case 'reassign':
      if (!new_reviewer_id) {
        return res.status(400).json({ error: '请指定新的审查人' });
      }
      const newReviewer = db.prepare('SELECT * FROM users WHERE id = ?').get(new_reviewer_id);
      if (!newReviewer) {
        return res.status(404).json({ error: '指定的用户不存在' });
      }
      
      db.prepare('UPDATE merge_requests SET reviewer_id = ? WHERE id = ?').run(new_reviewer_id, mrId);
      
      createMessage(
        new_reviewer_id,
        'MERGE_REQUEST',
        mrId,
        '您被指派为合并请求审查人',
        `用户 ${req.user.username} 将合并请求 "${mr.title}" 指派给您审查`,
        'todo'
      );
      
      createAuditLog(req.user.id, 'REASSIGN_MR', 'MERGE_REQUEST', mrId, {
        old_reviewer: mr.reviewer_id,
        new_reviewer: new_reviewer_id
      });
      
      return res.json({ message: '已转派给新的审查人' });

    case 'push_changes':
      if (mr.status !== 'changes_requested') {
        return res.status(400).json({ error: '当前状态无法推送修改' });
      }
      if (mr.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '您不是该合并请求的作者' });
      }
      newStatus = 'in_review';
      actionResult = '提交修改，等待重新审查';
      break;

    case 'close':
      if (!['pending_review', 'in_review', 'changes_requested'].includes(mr.status)) {
        return res.status(400).json({ error: '当前状态无法关闭' });
      }
      if (mr.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '权限不足' });
      }
      newStatus = 'closed';
      actionResult = '合并请求已关闭';
      break;

    case 'merge':
      if (mr.status !== 'approved') {
        return res.status(400).json({ error: '合并请求未通过审查' });
      }
      if (!['admin', 'devops'].includes(req.user.role) && mr.reviewer_id !== req.user.id) {
        return res.status(403).json({ error: '权限不足' });
      }
      
      newStatus = 'merged';
      actionResult = '合并完成';
      
      db.prepare(`
        UPDATE branches 
        SET latest_commit = (SELECT latest_commit FROM branches WHERE id = ?)
        WHERE id = ?
      `).run(mr.source_branch_id, mr.target_branch_id);
      break;

    default:
      return res.status(400).json({ error: '未知操作' });
  }

  if (newStatus !== mr.status) {
    db.prepare(`
      UPDATE merge_requests 
      SET status = ?, is_locked = 0, locked_by = NULL, locked_at = NULL, updated_at = strftime("%s", "now")
      WHERE id = ?
    `).run(newStatus, mrId);

    createStatusHistory('MERGE_REQUEST', mrId, mr.status, newStatus, action.toUpperCase(), comment || '', req.user.id);
    createAuditLog(req.user.id, `${action.toUpperCase()}_MR`, 'MERGE_REQUEST', mrId, {
      from_status: mr.status,
      to_status: newStatus,
      comment: comment || ''
    });

    if (action === 'approve' || action === 'request_changes' || action === 'merge') {
      createMessage(
        mr.author_id,
        'MERGE_REQUEST',
        mrId,
        `合并请求${actionResult}`,
        comment || `您的合并请求 "${mr.title}" 已被 ${req.user.username} ${actionResult}`,
        'notification'
      );
    }
  }

  res.json({
    id: mrId,
    status: newStatus,
    message: actionResult
  });
});

module.exports = router;
