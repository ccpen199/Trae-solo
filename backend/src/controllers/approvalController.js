const { query } = require('../config/database');
const { notificationQueue } = require('../config/queue');

const getTodoList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, pageSize = 10 } = req.query;

    let whereClause = 'tt.user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND tt.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      whereClause += ` AND tt.status = '待处理'`;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM todo_tasks tt 
       WHERE ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT tt.*, 
              d.title as document_title,
              d.document_number,
              d.status as document_status,
              d.category,
              u.name as creator_name
       FROM todo_tasks tt
       JOIN documents d ON tt.document_id = d.id
       JOIN users u ON d.creator_id = u.id
       WHERE ${whereClause}
       ORDER BY tt.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );

    res.json({
      todos: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取待办列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getTodoDetail = async (req, res) => {
  try {
    const todoId = req.params.id;
    const userId = req.user.id;

    const todoResult = await query(
      `SELECT tt.*,
              d.*,
              u.name as creator_name,
              u.department as creator_department
       FROM todo_tasks tt
       JOIN documents d ON tt.document_id = d.id
       JOIN users u ON d.creator_id = u.id
       WHERE tt.id = $1 AND tt.user_id = $2`,
      [todoId, userId]
    );

    if (todoResult.rows.length === 0) {
      return res.status(404).json({ error: '待办任务不存在' });
    }

    const todo = todoResult.rows[0];

    const nodesResult = await query(
      `SELECT pn.*, u.name as handler_name 
       FROM process_nodes pn
       LEFT JOIN users u ON pn.handler_id = u.id
       WHERE pn.document_id = $1
       ORDER BY pn.node_order`,
      [todo.document_id]
    );

    const commentsResult = await query(
      `SELECT ac.*, u.name as user_name 
       FROM approval_comments ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.document_id = $1
       ORDER BY ac.created_at DESC`,
      [todo.document_id]
    );

    res.json({
      todo,
      process_nodes: nodesResult.rows,
      comments: commentsResult.rows,
    });
  } catch (error) {
    console.error('获取待办详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const handleApproval = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { action, comment } = req.body;
    const userId = req.user.id;

    if (!action || !['通过', '退回', '补充意见'].includes(action)) {
      return res.status(400).json({ error: '无效的审批操作' });
    }

    const todoResult = await query(
      `SELECT tt.*, d.*, pn.node_order, pn.id as node_id
       FROM todo_tasks tt
       JOIN documents d ON tt.document_id = d.id
       JOIN process_nodes pn ON tt.node_id = pn.id
       WHERE tt.id = $1 AND tt.user_id = $2 AND tt.status = '待处理'`,
      [todoId, userId]
    );

    if (todoResult.rows.length === 0) {
      return res.status(404).json({ error: '待办任务不存在或已处理' });
    }

    const todo = todoResult.rows[0];

    await query('BEGIN');

    try {
      await query(
        `INSERT INTO approval_comments (document_id, node_id, user_id, comment, action) 
         VALUES ($1, $2, $3, $4, $5)`,
        [todo.document_id, todo.node_id, userId, comment || '', action]
      );

      if (action === '通过') {
        await query(
          `UPDATE process_nodes 
           SET status = '已完成', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [todo.node_id]
        );

        const nextNodeResult = await query(
          `SELECT * FROM process_nodes 
           WHERE document_id = $1 AND node_order = $2`,
          [todo.document_id, todo.node_order + 1]
        );

        if (nextNodeResult.rows.length > 0) {
          const nextNode = nextNodeResult.rows[0];

          await query(
            `UPDATE process_nodes 
             SET status = '待处理', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [nextNode.id]
          );

          await query(
            `INSERT INTO todo_tasks (
              user_id, document_id, node_id, task_type, task_name, priority
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [nextNode.handler_id, todo.document_id, nextNode.id, '审批', `待审批: ${todo.title}`, '普通']
          );

          await query(
            `UPDATE documents 
             SET current_node = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [`待审批 (${nextNode.handler_name || nextNode.handler_id})`, todo.document_id]
          );

          await notificationQueue.add('sendNotification', {
            userId: nextNode.handler_id,
            documentId: todo.document_id,
            message: `您有新的公文待审批: ${todo.title}`,
          });
        } else {
          await query(
            `UPDATE documents 
             SET status = '已签发', current_node = '已完成', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [todo.document_id]
          );
        }

        await query(
          `UPDATE todo_tasks 
           SET status = '已完成', completed_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [todoId]
        );

        await notificationQueue.add('sendNotification', {
          userId: todo.creator_id,
          documentId: todo.document_id,
          message: `您的公文"${todo.title}"已通过审批`,
        });
      } else if (action === '退回') {
        await query(
          `UPDATE process_nodes 
           SET status = '已退回', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [todo.node_id]
        );

        await query(
          `UPDATE documents 
           SET status = '已退回', current_node = '已退回', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [todo.document_id]
        );

        await query(
          `UPDATE todo_tasks 
           SET status = '已完成', completed_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [todoId]
        );

        await notificationQueue.add('sendNotification', {
          userId: todo.creator_id,
          documentId: todo.document_id,
          message: `您的公文"${todo.title}"已被退回`,
        });
      } else if (action === '补充意见') {
        await query(
          `UPDATE process_nodes 
           SET status = '待处理', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [todo.node_id]
        );
      }

      await query('COMMIT');

      res.json({
        message: `操作成功：${action}`,
        action,
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('处理审批错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  getTodoList,
  getTodoDetail,
  handleApproval,
};
