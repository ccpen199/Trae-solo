const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const tagRuleEngine = require('../engines/tagRuleEngine');
const { PermissionRuleEngine, ROLES } = require('../engines/permissionRuleEngine');
const conflictMergeEngine = require('../engines/conflictMergeEngine');
const materialCopyrightVersionEngine = require('../engines/materialCopyrightVersionEngine');

const router = express.Router();

const STATUS_FLOW = {
  pending_creation: '待创建',
  pending_review: '分类审核',
  published: '发布',
  pending_use: '待搜索使用',
  pending_update: '待更新迭代'
};

const STEP_FLOW = {
  create: '创建',
  review: '分类审核',
  publish: '发布',
  use: '搜索使用',
  update: '更新迭代'
};

router.get('/', authenticateToken, (req, res) => {
  const { status, keyword, directory_id, tag } = req.query;
  const filters = {};

  if (status) filters.status = status;
  if (keyword) filters.keyword = keyword;
  if (directory_id) filters.directory_id = parseInt(directory_id);

  let documents = PermissionRuleEngine.getVisibleDocuments(req.user.id, filters);

  if (tag) {
    const tagDocIds = db.prepare(`
      SELECT dt.document_id FROM document_tags dt
      JOIN tags t ON dt.tag_id = t.id
      WHERE t.name LIKE ? OR t.id = ?
    `).all(`%${tag}%`, isNaN(parseInt(tag)) ? 0 : parseInt(tag));
    
    const tagIdSet = new Set(tagDocIds.map(t => t.document_id));
    documents = documents.filter(d => tagIdSet.has(d.id));
  }

  documents = documents.map(doc => ({
    ...doc,
    tags: tagRuleEngine.getDocumentTags(doc.id)
  }));

  res.json({ documents, total: documents.length });
});

router.get('/:id', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  
  const permission = PermissionRuleEngine.checkPermission(req.user.id, 'document', 'view', docId);
  if (!permission.allowed) {
    return res.status(403).json({ error: permission.reason });
  }

  const document = db.prepare(`
    SELECT d.*, u.name as creator_name, r.name as responsible_name, r.id as responsible_id
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    LEFT JOIN users r ON d.responsible_id = r.id
    WHERE d.id = ? AND d.is_deleted = 0
  `).get(docId);

  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  const availableActions = PermissionRuleEngine.getAvailableActions(req.user.id, docId);
  const tags = tagRuleEngine.getDocumentTags(docId);
  const versions = materialCopyrightVersionEngine.getVersionHistory(docId);
  const timeline = materialCopyrightVersionEngine.getTimeline(docId);
  const workflowSteps = db.prepare(`
    SELECT ws.*, u.name as handler_name
    FROM workflow_steps ws
    LEFT JOIN users u ON ws.handler_id = u.id
    WHERE ws.document_id = ?
    ORDER BY ws.step_order
  `).all(docId);

  res.json({
    document,
    availableActions,
    tags,
    versions,
    timeline,
    workflowSteps
  });
});

router.post('/', authenticateToken, (req, res) => {
  const permission = PermissionRuleEngine.checkPermission(req.user.id, 'document', 'create');
  if (!permission.allowed) {
    return res.status(403).json({ error: permission.reason });
  }

  const {
    title,
    content,
    summary,
    directory_id,
    responsible_id,
    expected_completion_date,
    tag_ids,
    details
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: '文档标题不能为空' });
  }

  const mainOrderNo = materialCopyrightVersionEngine.generateMainOrderNo();

  const existingDoc = db.prepare('SELECT id FROM documents WHERE title = ? AND is_deleted = 0').get(title);
  if (existingDoc) {
    return res.status(400).json({ error: '已存在同名文档' });
  }

  if (tag_ids && tag_ids.length > 0) {
    const tagValidation = tagRuleEngine.validateTags(tag_ids, 'use');
    if (!tagValidation.valid) {
      return res.status(400).json({ error: tagValidation.error });
    }
  }

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO documents (main_order_no, title, content, summary, directory_id, responsible_id, expected_completion_date, status, current_step, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_creation', 'create', ?)
    `).run(mainOrderNo, title, content, summary, directory_id, responsible_id, expected_completion_date, req.user.id);

    const documentId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO versions (document_id, version_no, title, content, change_log, created_by)
      VALUES (?, 1, ?, ?, '初始版本', ?)
    `).run(documentId, title, content, req.user.id);

    if (details && Array.isArray(details)) {
      const insertDetail = db.prepare(`
        INSERT INTO document_details (document_id, field_name, field_value, version)
        VALUES (?, ?, ?, 1)
      `);
      details.forEach(detail => {
        insertDetail.run(documentId, detail.field_name, detail.field_value);
      });
    }

    const insertWorkflowStep = db.prepare(`
      INSERT INTO workflow_steps (document_id, step_name, step_order, handler_id, status, started_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertWorkflowStep.run(documentId, 'create', 1, req.user.id, 'completed', new Date().toISOString());
    insertWorkflowStep.run(documentId, 'review', 2, responsible_id || req.user.id, 'pending', null);
    insertWorkflowStep.run(documentId, 'publish', 3, null, 'pending', null);
    insertWorkflowStep.run(documentId, 'use', 4, null, 'pending', null);
    insertWorkflowStep.run(documentId, 'update', 5, null, 'pending', null);

    if (responsible_id) {
      db.prepare(`
        INSERT INTO todo_messages (user_id, document_id, message_type, message)
        VALUES (?, ?, 'review', '您有新的文档需要审核')
      `).run(responsible_id, documentId);
    }

    if (tag_ids && tag_ids.length > 0) {
      tagRuleEngine.linkDocumentTags(documentId, tag_ids, req.user.id);
    }

    materialCopyrightVersionEngine.addTimelineEvent(
      documentId,
      'create',
      '创建文档',
      `创建了文档 "${title}"`,
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, new_value)
      VALUES (?, ?, 'document_create', 'document', ?, ?)
    `).run(req.user.id, req.user.name, documentId, JSON.stringify({ title, mainOrderNo }));

    return { documentId, mainOrderNo };
  });

  try {
    const result = transaction();
    res.status(201).json({
      message: '文档创建成功',
      documentId: result.documentId,
      mainOrderNo: result.mainOrderNo
    });
  } catch (error) {
    console.error('创建文档失败:', error);
    res.status(500).json({ error: '创建文档失败' });
  }
});

router.post('/:id/submit-review', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND is_deleted = 0').get(docId);

  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.status !== 'pending_creation') {
    return res.status(400).json({ error: '当前状态不可提交审核' });
  }

  if (document.created_by !== req.user.id && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: '只能提交自己创建的文档' });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE documents 
      SET status = 'pending_review', current_step = 'review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(docId);

    db.prepare(`
      UPDATE workflow_steps 
      SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
      WHERE document_id = ? AND step_name = 'review'
    `).run(docId);

    materialCopyrightVersionEngine.addTimelineEvent(
      docId,
      'status_change',
      '提交审核',
      '文档已提交审核，等待分类审核',
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, old_value, new_value)
      VALUES (?, ?, 'document_submit_review', 'document', ?, ?, ?)
    `).run(
      req.user.id,
      req.user.name,
      docId,
      JSON.stringify({ status: 'pending_creation' }),
      JSON.stringify({ status: 'pending_review' })
    );

    const responsibleUser = db.prepare('SELECT * FROM users WHERE id = ?').get(document.responsible_id);
    if (responsibleUser && responsibleUser.id !== req.user.id) {
      db.prepare(`
        INSERT INTO todo_messages (user_id, document_id, message_type, message)
        VALUES (?, ?, 'review', '文档已提交审核，请您进行分类审核')
      `).run(responsibleUser.id, docId);
    }
  });

  try {
    transaction();
    res.json({ message: '提交审核成功' });
  } catch (error) {
    console.error('提交审核失败:', error);
    res.status(500).json({ error: '提交审核失败' });
  }
});

router.post('/:id/review', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const { action, comment, new_responsible_id } = req.body;

  const validActions = ['approve', 'reject', 'supplement', 'reassign'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: '无效的审核操作' });
  }

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND is_deleted = 0').get(docId);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.status !== 'pending_review') {
    return res.status(400).json({ error: '当前状态不可审核' });
  }

  const permission = PermissionRuleEngine.checkPermission(req.user.id, 'document', 'review', docId);
  if (!permission.allowed) {
    return res.status(403).json({ error: permission.reason });
  }

  const transaction = db.transaction(() => {
    const stepUpdate = db.prepare(`
      UPDATE workflow_steps 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, comment = ?
      WHERE document_id = ? AND step_name = 'review'
    `);

    docUpdate = db.prepare('UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');

    actionTitle = '';
    newStatus = document.status;
    newStep = document.current_step;

    switch (action) {
      case 'approve':
        newStatus = 'published';
        newStep = 'publish';
        actionTitle = '审核通过';

        docUpdate = db.prepare(`
          UPDATE documents 
          SET status = 'published', current_step = 'publish', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        stepUpdate.run(comment || '审核通过，进入发布状态', docId);

        db.prepare(`
          UPDATE workflow_steps 
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP
          WHERE document_id = ? AND step_name = 'publish'
        `).run(docId);

        const docTags = tagRuleEngine.getDocumentTags(docId);
        if (docTags.length > 0) {
          tagRuleEngine.lockTags(docTags.map(t => t.id), req.user.id);
        }

        materialCopyrightVersionEngine.createVersion(
          docId,
          req.user.id,
          `审核通过，发布版本 v${document.version + 1}`,
          document.content,
          document.title
        );
        break;

      case 'reject':
        newStatus = 'pending_creation';
        newStep = 'create';
        actionTitle = '审核驳回';

        docUpdate = db.prepare(`
          UPDATE documents 
          SET status = 'pending_creation', current_step = 'create', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        stepUpdate.run(comment || '审核驳回', docId);
        break;

      case 'supplement':
        actionTitle = '补充资料';
        stepUpdate.run(comment || '需要补充资料', docId);
        break;

      case 'reassign':
        if (!new_responsible_id) {
          throw new Error('转派需要指定新负责人');
        }
        actionTitle = '转派审核';

        db.prepare(`
          UPDATE workflow_steps 
          SET handler_id = ?, comment = ?
          WHERE document_id = ? AND step_name = 'review'
        `).run(new_responsible_id, comment || '转派给新负责人审核', docId);

        db.prepare(`
          UPDATE documents SET responsible_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(new_responsible_id, docId);

        db.prepare(`
          INSERT INTO todo_messages (user_id, document_id, message_type, message)
          VALUES (?, ?, 'review', '您被指派审核文档审核任务')
        `).run(new_responsible_id, docId);
        break;
    }

    if (action !== 'reassign') {
      docUpdate.run(docId);
    }

    materialCopyrightVersionEngine.addTimelineEvent(
      docId,
      'review',
      actionTitle,
      comment || actionTitle,
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, 'document_review', 'document', ?, ?)
    `).run(
      req.user.id,
      req.user.name,
      docId,
      JSON.stringify({
        action,
        comment,
        fromStatus: document.status,
        toStatus: newStatus
      })
    );

    if (document.created_by && document.created_by !== req.user.id) {
      db.prepare(`
        INSERT INTO todo_messages (user_id, document_id, message_type, message)
        VALUES (?, ?, ?, ?)
      `).run(
        document.created_by,
        docId,
        action === 'approve' ? 'approval' : 'rejection',
        `您的文档已${actionTitle}${comment ? `: ${comment}` : ''}`
      );
    }
  });

  try {
    transaction();
    res.json({ message: '审核操作成功' });
  } catch (error) {
    console.error('审核操作失败:', error);
    res.status(500).json({ error: error.message || '审核操作失败' });
  }
});

router.post('/:id/search-use', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND is_deleted = 0').get(docId);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.status !== 'published') {
    return res.status(400).json({ error: '只有已发布的文档才能标记使用' });
  }

  const permission = PermissionRuleEngine.checkPermission(req.user.id, 'document', 'search', docId);
  if (!permission.allowed) {
    return res.status(403).json({ error: permission.reason });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE documents 
      SET status = 'pending_use', current_step = 'use', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(docId);

    db.prepare(`
      UPDATE workflow_steps 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE document_id = ? AND step_name = 'use'
    `).run(docId);

    materialCopyrightVersionEngine.addTimelineEvent(
      docId,
      'use',
      '标记使用',
      '文档已被标记为使用状态',
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, old_value, new_value)
      VALUES (?, ?, 'document_use', 'document', ?, ?, ?)
    `).run(
      req.user.id,
      req.user.name,
      docId,
      JSON.stringify({ status: 'published' }),
      JSON.stringify({ status: 'pending_use' })
    );
  });

  try {
    transaction();
    res.json({ message: '标记使用成功' });
  } catch (error) {
    console.error('标记使用失败:', error);
    res.status(500).json({ error: '标记使用失败' });
  }
});

router.post('/:id/request-update', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const { reason } = req.body;

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND is_deleted = 0').get(docId);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.status !== 'published' && document.status !== 'pending_use') {
    return res.status(400).json({ error: '当前状态不可申请更新' });
  }

  const permission = PermissionRuleEngine.checkPermission(req.user.id, 'document', 'edit', docId);
  if (!permission.allowed) {
    return res.status(403).json({ error: permission.reason });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE documents 
      SET status = 'pending_update', current_step = 'update', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(docId);

    db.prepare(`
      UPDATE workflow_steps 
      SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
      WHERE document_id = ? AND step_name = 'update'
    `).run(docId);

    materialCopyrightVersionEngine.addTimelineEvent(
      docId,
      'update_request',
      '申请更新',
      reason || '申请更新文档内容',
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, 'document_request_update', 'document', ?, ?)
    `).run(
      req.user.id,
      req.user.name,
      docId,
      JSON.stringify({ reason, fromStatus: document.status })
    );

    if (document.responsible_id && document.responsible_id !== req.user.id) {
      db.prepare(`
        INSERT INTO todo_messages (user_id, document_id, message_type, message)
        VALUES (?, ?, 'update', '文档已申请更新，请审核')
      `).run(document.responsible_id, docId);
    }
  });

  try {
    transaction();
    res.json({ message: '申请更新成功' });
  } catch (error) {
    console.error('申请更新失败:', error);
    res.status(500).json({ error: '申请更新失败' });
  }
});

router.post('/:id/update', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const { action, comment, content, title, tag_ids } = req.body;

  const validActions = ['approve', 'reject', 'supplement', 'reassign'];
  if (action && !validActions.includes(action)) {
    return res.status(400).json({ error: '无效的更新操作' });
  }

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND is_deleted = 0').get(docId);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.status !== 'pending_update') {
    return res.status(400).json({ error: '当前状态不可更新' });
  }

  const transaction = db.transaction(() => {
    if (content || title) {
      const conflict = conflictMergeEngine.detectConflict(
        docId,
        req.user.id,
        content || document.content,
        document.version
      );

      if (conflict.hasConflict) {
        conflictMergeEngine.recordConflict(conflict);
        throw new Error('检测到编辑冲突，请刷新后重试');
      }

      if (tag_ids) {
        tagRuleEngine.linkDocumentTags(docId, tag_ids, req.user.id);
      }

      db.prepare(`
        UPDATE documents 
        SET content = ?, title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(content || document.content, title || document.title, docId);

      materialCopyrightVersionEngine.addTimelineEvent(
        docId,
        'edit',
        '编辑更新',
        '更新了文档内容',
        req.user.id
      );
    }

    if (action) {
      let newStatus = document.status;
      const actionTitle = {
        approve: '更新通过',
        reject: '更新驳回',
        supplement: '补充更新资料',
        reassign: '转派更新'
      }[action];

      switch (action) {
        case 'approve':
          newStatus = 'published';
          db.prepare(`
            UPDATE documents 
            SET status = 'published', current_step = 'publish', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(docId);

          db.prepare(`
            UPDATE workflow_steps 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, comment = ?
            WHERE document_id = ? AND step_name = 'update'
          `).run(comment || '更新通过', docId);

          materialCopyrightVersionEngine.createVersion(
            docId,
            req.user.id,
            `更新通过，版本 v${document.version + 1}`,
            content,
            title
          );
          break;

        case 'reject':
          newStatus = 'published';
          db.prepare(`
            UPDATE documents 
            SET status = 'published', current_step = 'publish', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(docId);

          db.prepare(`
            UPDATE workflow_steps 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, comment = ?
            WHERE document_id = ? AND step_name = 'update'
          `).run(comment || '更新驳回', docId);
          break;

        case 'supplement':
          db.prepare(`
            UPDATE workflow_steps 
            SET comment = ?
            WHERE document_id = ? AND step_name = 'update'
          `).run(comment || '需要补充更新资料', docId);
          break;
      }

      materialCopyrightVersionEngine.addTimelineEvent(
        docId,
        'update_review',
        actionTitle,
        comment || actionTitle,
        req.user.id
      );

      db.prepare(`
        INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
        VALUES (?, ?, 'document_update_review', 'document', ?, ?)
      `).run(
        req.user.id,
        req.user.name,
        docId,
        JSON.stringify({ action, comment, fromStatus: document.status, toStatus: newStatus })
      );
    }
  });

  try {
    transaction();
    res.json({ message: action ? '更新审核操作成功' : '更新内容成功' });
  } catch (error) {
    console.error('更新操作失败:', error);
    res.status(500).json({ error: error.message || '更新操作失败' });
  }
});

router.post('/:id/rollback', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const { version_no, reason } = req.body;

  if (!version_no) {
    return res.status(400).json({ error: '请指定回退版本' });
  }

  const permission = PermissionRuleEngine.checkPermission(req.user.id, 'document', 'rollback', docId);
  if (!permission.allowed) {
    return res.status(403).json({ error: permission.reason });
  }

  const result = materialCopyrightVersionEngine.rollbackVersion(
    docId,
    version_no,
    req.user.id,
    reason || '版本回退'
  );

  if (result.success) {
    res.json({ message: '版本回退成功', ...result });
  } else {
    res.status(400).json({ error: result.error });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);

  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.created_by !== req.user.id && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: '只能删除自己创建的文档' });
  }

  if (document.status !== 'pending_creation') {
    return res.status(400).json({ error: '只能删除待创建状态的文档' });
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE documents SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(docId);

    materialCopyrightVersionEngine.addTimelineEvent(
      docId,
      'delete',
      '删除文档',
      `删除了文档 "${document.title}"`,
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, 'document_delete', 'document', ?, ?)
    `).run(
      req.user.id,
      req.user.name,
      docId,
      JSON.stringify({ title: document.title, mainOrderNo: document.main_order_no })
    );
  });

  try {
    transaction();
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

router.put('/:id/edit', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const { title, content, summary, directory_id, responsible_id, expected_completion_date, tag_ids } = req.body;

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND is_deleted = 0').get(docId);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }

  if (document.status !== 'pending_creation' && document.status !== 'pending_update') {
    return res.status(400).json({ error: '当前状态不可编辑' });
  }

  if (document.created_by !== req.user.id && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: '只能编辑自己创建的文档' });
  }

  const conflict = conflictMergeEngine.detectConflict(
    docId,
    req.user.id,
    content || document.content,
    document.version
  );

  if (conflict.hasConflict) {
    conflictMergeEngine.recordConflict(conflict);
    return res.status(409).json({
      error: '检测到编辑冲突',
      conflict: true,
      conflictInfo: conflict
    });
  }

  if (tag_ids) {
    const tagValidation = tagRuleEngine.validateTags(tag_ids, 'use');
    if (!tagValidation.valid) {
      return res.status(400).json({ error: tagValidation.error });
    }
  }

  const transaction = db.transaction(() => {
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (summary !== undefined) {
      updateFields.push('summary = ?');
      updateValues.push(summary);
    }
    if (directory_id !== undefined) {
      updateFields.push('directory_id = ?');
      updateValues.push(directory_id);
    }
    if (responsible_id !== undefined) {
      updateFields.push('responsible_id = ?');
      updateValues.push(responsible_id);
    }
    if (expected_completion_date !== undefined) {
      updateFields.push('expected_completion_date = ?');
      updateValues.push(expected_completion_date);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(docId);

      db.prepare(`UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
    }

    if (tag_ids) {
      tagRuleEngine.linkDocumentTags(docId, tag_ids, req.user.id);
    }

    materialCopyrightVersionEngine.addTimelineEvent(
      docId,
      'edit',
      '编辑文档',
      '更新了文档信息',
      req.user.id
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id)
      VALUES (?, ?, 'document_edit', 'document', ?)
    `).run(req.user.id, req.user.name, docId);
  });

  try {
    transaction();
    res.json({ message: '编辑成功' });
  } catch (error) {
    console.error('编辑失败:', error);
    res.status(500).json({ error: '编辑失败' });
  }
});

router.get('/:id/conflicts', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const conflicts = conflictMergeEngine.getActiveConflicts(docId);
  res.json({ conflicts });
});

router.post('/:id/resolve-conflict', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  const { conflict_id, strategy, resolved_content } = req.body;

  if (!conflict_id || !strategy) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const result = conflictMergeEngine.resolveConflict(
    conflict_id,
    strategy,
    resolved_content,
    req.user.id
  );

  if (result.success) {
    res.json({ message: '冲突解决成功', result });
  } else {
    res.status(400).json({ error: result.error });
  }
});

module.exports = router;
