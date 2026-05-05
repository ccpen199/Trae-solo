const { query } = require('../config/database');

const searchDocuments = async (req, res) => {
  try {
    const {
      document_type,
      status,
      category,
      keyword,
      exact_match = false,
      document_number,
      title,
      start_date,
      end_date,
      is_archived = false,
      page = 1,
      pageSize = 10,
    } = req.query;

    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let baseQuery = `
      FROM documents d
      JOIN users u ON d.creator_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (!isAdmin) {
      baseQuery += `
        AND (
          d.creator_id = $${paramIndex}
          OR EXISTS (
            SELECT 1 FROM document_permissions dp 
            WHERE dp.document_id = d.id AND dp.user_id = $${paramIndex}
          )
          OR EXISTS (
            SELECT 1 FROM process_nodes pn 
            WHERE pn.document_id = d.id AND pn.handler_id = $${paramIndex}
          )
        )
      `;
      params.push(userId);
      paramIndex++;
    }

    if (document_type) {
      baseQuery += ` AND d.document_type = $${paramIndex}`;
      params.push(document_type);
      paramIndex++;
    }

    if (status) {
      baseQuery += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      baseQuery += ` AND d.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_archived === true || is_archived === 'true') {
      baseQuery += ` AND d.is_archived = true`;
    } else {
      baseQuery += ` AND (d.is_archived = false OR d.is_archived IS NULL)`;
    }

    if (exact_match === true || exact_match === 'true') {
      if (document_number) {
        baseQuery += ` AND d.document_number = $${paramIndex}`;
        params.push(document_number);
        paramIndex++;
      }
      if (title) {
        baseQuery += ` AND d.title = $${paramIndex}`;
        params.push(title);
        paramIndex++;
      }
    } else {
      if (keyword) {
        baseQuery += ` AND (
          d.title ILIKE $${paramIndex} 
          OR d.content ILIKE $${paramIndex}
          OR d.document_number ILIKE $${paramIndex}
          OR u.name ILIKE $${paramIndex}
        )`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
    }

    if (start_date) {
      baseQuery += ` AND d.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      baseQuery += ` AND d.created_at <= $${paramIndex}`;
      params.push(`${end_date} 23:59:59`);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await query(countQuery, params);

    const dataQuery = `
      SELECT d.*, u.name as creator_name, u.department as creator_department
      ${baseQuery}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataParams = [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)];
    const dataResult = await query(dataQuery, dataParams);

    res.json({
      documents: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('查询公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getDocumentTracking = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let accessQuery = `
      SELECT d.*, u.name as creator_name, u.department as creator_department
      FROM documents d
      JOIN users u ON d.creator_id = u.id
      WHERE d.id = $1
    `;
    const accessParams = [documentId];

    if (!isAdmin) {
      accessQuery += `
        AND (
          d.creator_id = $2
          OR EXISTS (
            SELECT 1 FROM document_permissions dp 
            WHERE dp.document_id = d.id AND dp.user_id = $2
          )
          OR EXISTS (
            SELECT 1 FROM process_nodes pn 
            WHERE pn.document_id = d.id AND pn.handler_id = $2
          )
        )
      `;
      accessParams.push(userId);
    }

    const docResult = await query(accessQuery, accessParams);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: '公文不存在或无权限查看' });
    }

    const document = docResult.rows[0];

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
       ORDER BY ac.created_at`,
      [documentId]
    );

    const todoResult = await query(
      `SELECT tt.*, u.name as user_name
       FROM todo_tasks tt
       JOIN users u ON tt.user_id = u.id
       WHERE tt.document_id = $1
       ORDER BY tt.created_at`,
      [documentId]
    );

    let currentStatus = '未知';
    let currentHandler = null;

    if (nodesResult.rows.length > 0) {
      const currentNode = nodesResult.rows.find(n => n.status === '待处理');
      if (currentNode) {
        currentStatus = `待处理: ${currentNode.node_name}`;
        currentHandler = {
          id: currentNode.handler_id,
          name: currentNode.handler_name,
          department: currentNode.handler_department,
        };
      } else if (document.status === '已签发') {
        currentStatus = '已签发完成';
      } else if (document.status === '已退回') {
        currentStatus = '已退回';
      }
    } else {
      if (document.status === '草稿') {
        currentStatus = '草稿，未提交';
      }
    }

    res.json({
      document,
      current_status: currentStatus,
      current_handler: currentHandler,
      process_nodes: nodesResult.rows,
      comments: commentsResult.rows,
      todos: todoResult.rows,
    });
  } catch (error) {
    console.error('获取公文跟踪信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const archiveDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let accessQuery = `
      SELECT * FROM documents 
      WHERE id = $1 AND status IN ('已签发', '已退回')
    `;
    const accessParams = [documentId];

    if (!isAdmin) {
      accessQuery += ` AND creator_id = $2`;
      accessParams.push(userId);
    }

    const docResult = await query(accessQuery, accessParams);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: '公文不存在或无法归档' });
    }

    if (docResult.rows[0].is_archived) {
      return res.status(400).json({ error: '公文已归档' });
    }

    await query(
      `UPDATE documents 
       SET is_archived = true, archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [documentId]
    );

    res.json({
      message: '公文归档成功',
      document_id: documentId,
    });
  } catch (error) {
    console.error('归档公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getArchivedDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { keyword, document_type, page = 1, pageSize = 10 } = req.query;

    let whereClause = `d.is_archived = true`;
    const params = [];
    let paramIndex = 1;

    if (!isAdmin) {
      whereClause += `
        AND (
          d.creator_id = $${paramIndex}
          OR EXISTS (
            SELECT 1 FROM document_permissions dp 
            WHERE dp.document_id = d.id AND dp.user_id = $${paramIndex}
          )
        )
      `;
      params.push(userId);
      paramIndex++;
    }

    if (keyword) {
      whereClause += ` AND (d.title ILIKE $${paramIndex} OR d.document_number ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (document_type) {
      whereClause += ` AND d.document_type = $${paramIndex}`;
      params.push(document_type);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total FROM documents d
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, params);

    const dataQuery = `
      SELECT d.*, u.name as creator_name
      FROM documents d
      JOIN users u ON d.creator_id = u.id
      WHERE ${whereClause}
      ORDER BY d.archived_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataParams = [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)];
    const dataResult = await query(dataQuery, dataParams);

    res.json({
      documents: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取归档公文错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  searchDocuments,
  getDocumentTracking,
  archiveDocument,
  getArchivedDocuments,
};
