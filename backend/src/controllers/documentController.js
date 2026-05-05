const { query } = require('../config/database');
const { notificationQueue } = require('../config/queue');

const generateDocumentNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const result = await query(
    `SELECT COUNT(*) as count FROM documents 
     WHERE document_number LIKE $1`,
    [`FW-${year}${month}%`]
  );
  
  const count = parseInt(result.rows[0].count) + 1;
  const serial = String(count).padStart(4, '0');
  
  return `FW-${year}${month}${serial}`;
};

const createDocument = async (req, res) => {
  try {
    const { title, content, category, security_level, document_type, receiver_ids } = req.body;
    const creatorId = req.user.id;

    if (!title || !content || !category) {
      return res.status(400).json({ error: '公文标题、正文和类别为必填项' });
    }

    const documentNumber = await generateDocumentNumber();

    const result = await query(
      `INSERT INTO documents (
        title, content, category, security_level, document_number,
        document_type, status, creator_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        title,
        content,
        category,
        security_level || '普通',
        documentNumber,
        document_type || '发文',
        '草稿',
        creatorId,
      ]
    );

    const document = result.rows[0];

    await query(
      `INSERT INTO document_permissions (document_id, user_id, permission_type) 
       VALUES ($1, $2, 'creator')`,
      [document.id, creatorId]
    );

    res.status(201).json({
      message: '公文创建成功',
      document,
    });
  } catch (error) {
    console.error('创建公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const submitDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { approver_ids } = req.body;
    const userId = req.user.id;

    const docResult = await query(
      'SELECT * FROM documents WHERE id = $1 AND creator_id = $2',
      [documentId, userId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: '公文不存在或无权限提交' });
    }

    const document = docResult.rows[0];

    if (document.status !== '草稿') {
      return res.status(400).json({ error: '只有草稿状态的公文可以提交' });
    }

    if (!approver_ids || approver_ids.length === 0) {
      return res.status(400).json({ error: '请指定审批人' });
    }

    const validApprovers = await query(
      'SELECT id, name FROM users WHERE id = ANY($1::int[])',
      [approver_ids]
    );

    if (validApprovers.rows.length !== approver_ids.length) {
      return res.status(400).json({ error: '存在无效的审批人' });
    }

    await query('BEGIN');

    try {
      await query(
        `UPDATE documents 
         SET status = $1, current_node = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        ['审批中', '待审批', documentId]
      );

      for (let i = 0; i < validApprovers.rows.length; i++) {
        const approver = validApprovers.rows[i];
        const nodeResult = await query(
          `INSERT INTO process_nodes (
            document_id, node_name, node_order, node_type, 
            handler_id, status
          ) VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [
            documentId,
            `审批-${approver.name}`,
            i + 1,
            i === 0 ? '当前' : '待处理',
            approver.id,
            i === 0 ? '待处理' : '待处理',
          ]
        );

        if (i === 0) {
          await query(
            `INSERT INTO todo_tasks (
              user_id, document_id, node_id, task_type, task_name, priority
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [approver.id, documentId, nodeResult.rows[0].id, '审批', `待审批: ${document.title}`, '普通']
          );

          await notificationQueue.add('sendNotification', {
            userId: approver.id,
            documentId: documentId,
            message: `您有新的公文待审批: ${document.title}`,
          });
        }

        await query(
          `INSERT INTO document_permissions (document_id, user_id, permission_type) 
           VALUES ($1, $2, 'approver') 
           ON CONFLICT (document_id, user_id, permission_type) DO NOTHING`,
          [documentId, approver.id]
        );
      }

      await query('COMMIT');

      const updatedDoc = await query(
        `SELECT d.*, u.name as creator_name 
         FROM documents d 
         JOIN users u ON d.creator_id = u.id 
         WHERE d.id = $1`,
        [documentId]
      );

      res.json({
        message: '公文提交成功，已进入审批流程',
        document: updatedDoc.rows[0],
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('提交公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, document_type, page = 1, pageSize = 10 } = req.query;
    
    let whereClause = 'd.creator_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (document_type) {
      whereClause += ` AND d.document_type = $${paramIndex}`;
      params.push(document_type);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM documents d WHERE ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT d.*, u.name as creator_name 
       FROM documents d 
       JOIN users u ON d.creator_id = u.id 
       WHERE ${whereClause} 
       ORDER BY d.created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );

    res.json({
      documents: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取我的公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getDocumentDetail = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = req.document;

    const creatorResult = await query(
      'SELECT id, name, department FROM users WHERE id = $1',
      [document.creator_id]
    );

    const nodesResult = await query(
      `SELECT pn.*, u.name as handler_name, u.department as handler_department 
       FROM process_nodes pn 
       LEFT JOIN users u ON pn.handler_id = u.id 
       WHERE pn.document_id = $1 
       ORDER BY pn.node_order`,
      [documentId]
    );

    const commentsResult = await query(
      `SELECT ac.*, u.name as user_name 
       FROM approval_comments ac 
       JOIN users u ON ac.user_id = u.id 
       WHERE ac.document_id = $1 
       ORDER BY ac.created_at DESC`,
      [documentId]
    );

    const attachmentsResult = await query(
      'SELECT * FROM attachments WHERE document_id = $1',
      [documentId]
    );

    res.json({
      document: {
        ...document,
        creator: creatorResult.rows[0],
      },
      process_nodes: nodesResult.rows,
      comments: commentsResult.rows,
      attachments: attachmentsResult.rows,
    });
  } catch (error) {
    console.error('获取公文详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const updateDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { title, content, category, security_level } = req.body;
    const userId = req.user.id;

    const result = await query(
      `SELECT * FROM documents 
       WHERE id = $1 AND creator_id = $2 AND status = '草稿'`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '公文不存在或无法修改' });
    }

    const updateFields = [];
    const updateValues = [];
    let index = 1;

    if (title) {
      updateFields.push(`title = $${index}`);
      updateValues.push(title);
      index++;
    }
    if (content) {
      updateFields.push(`content = $${index}`);
      updateValues.push(content);
      index++;
    }
    if (category) {
      updateFields.push(`category = $${index}`);
      updateValues.push(category);
      index++;
    }
    if (security_level) {
      updateFields.push(`security_level = $${index}`);
      updateValues.push(security_level);
      index++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updatedResult = await query(
      `UPDATE documents SET ${updateFields.join(', ')} 
       WHERE id = $${index} RETURNING *`,
      [...updateValues, documentId]
    );

    res.json({
      message: '公文更新成功',
      document: updatedResult.rows[0],
    });
  } catch (error) {
    console.error('更新公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  createDocument,
  submitDocument,
  getMyDocuments,
  getDocumentDetail,
  updateDocument,
};
