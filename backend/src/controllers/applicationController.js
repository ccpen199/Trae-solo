import { run, get, all } from '../database.js';

const generateApplicationNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `EXP-${year}${month}${day}-${random}`;
};

export const createApplication = async (req, res) => {
  try {
    const { 
      project_id, 
      expense_type_id, 
      amount, 
      description, 
      approver_id, 
      cc_user_ids,
      status = 'draft'
    } = req.body;

    const applicant_id = req.userId;
    const application_no = generateApplicationNo();

    if (status === 'submitted') {
      if (!approver_id) {
        return res.status(400).json({ success: false, message: '请指定审批人' });
      }
    }

    const result = await run(`
      INSERT INTO expense_applications 
      (application_no, applicant_id, project_id, expense_type_id, amount, description, status, approver_id, submit_at, current_step)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      application_no,
      applicant_id,
      project_id || null,
      expense_type_id || null,
      amount || 0,
      description || '',
      status,
      approver_id || null,
      status === 'submitted' ? new Date().toISOString() : null,
      status === 'submitted' ? 'approver' : 'submit'
    ]);

    const application_id = result.lastID;

    if (cc_user_ids && cc_user_ids.length > 0) {
      for (const user_id of cc_user_ids) {
        await run(`
          INSERT INTO cc_records (application_id, user_id)
          VALUES (?, ?)
        `, [application_id, user_id]);
      }
    }

    res.json({
      success: true,
      data: {
        id: application_id,
        application_no,
        message: status === 'submitted' ? '提交成功' : '保存草稿成功'
      }
    });
  } catch (error) {
    console.error('创建申请错误:', error);
    res.status(500).json({ success: false, message: '创建申请失败' });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      project_id, 
      expense_type_id, 
      amount, 
      description, 
      approver_id, 
      cc_user_ids,
      status
    } = req.body;

    const application = await get(`
      SELECT * FROM expense_applications WHERE id = ?
    `, [id]);

    if (!application) {
      return res.status(404).json({ success: false, message: '申请不存在' });
    }

    if (application.applicant_id !== req.userId && application.status !== 'approver_rejected' && application.status !== 'finance_rejected') {
      return res.status(403).json({ success: false, message: '无权修改此申请' });
    }

    if (application.status !== 'draft' && application.status !== 'approver_rejected' && application.status !== 'finance_rejected') {
      return res.status(400).json({ success: false, message: '当前状态不可修改' });
    }

    const updateFields = [];
    const updateValues = [];

    if (project_id !== undefined) {
      updateFields.push('project_id = ?');
      updateValues.push(project_id);
    }
    if (expense_type_id !== undefined) {
      updateFields.push('expense_type_id = ?');
      updateValues.push(expense_type_id);
    }
    if (amount !== undefined) {
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (approver_id !== undefined) {
      updateFields.push('approver_id = ?');
      updateValues.push(approver_id);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
      if (status === 'submitted') {
        updateFields.push('submit_at = ?');
        updateValues.push(new Date().toISOString());
        updateFields.push('current_step = ?');
        updateValues.push('approver');
      }
    }

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(id);

    await run(`
      UPDATE expense_applications 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    if (cc_user_ids !== undefined) {
      await run(`DELETE FROM cc_records WHERE application_id = ?`, [id]);
      for (const user_id of cc_user_ids) {
        await run(`
          INSERT INTO cc_records (application_id, user_id)
          VALUES (?, ?)
        `, [id, user_id]);
      }
    }

    res.json({
      success: true,
      message: status === 'submitted' ? '提交成功' : '更新成功'
    });
  } catch (error) {
    console.error('更新申请错误:', error);
    res.status(500).json({ success: false, message: '更新申请失败' });
  }
};

export const getApplications = async (req, res) => {
  try {
    const user_id = req.userId;
    const { status, type, search, page = 1, pageSize = 10 } = req.query;
    
    let countSql = `
      SELECT COUNT(*) as total
      FROM expense_applications ea
      LEFT JOIN users ua ON ea.applicant_id = ua.id
      LEFT JOIN projects p ON ea.project_id = p.id
      LEFT JOIN expense_types et ON ea.expense_type_id = et.id
      WHERE 1=1
    `;

    let sql = `
      SELECT 
        ea.*,
        ua.name as applicant_name,
        ua.department as applicant_department,
        p.name as project_name,
        p.code as project_code,
        et.name as expense_type_name,
        approver.name as approver_name,
        reviewer.name as reviewer_name
      FROM expense_applications ea
      LEFT JOIN users ua ON ea.applicant_id = ua.id
      LEFT JOIN projects p ON ea.project_id = p.id
      LEFT JOIN expense_types et ON ea.expense_type_id = et.id
      LEFT JOIN users approver ON ea.approver_id = approver.id
      LEFT JOIN users reviewer ON ea.reviewer_id = reviewer.id
      WHERE 1=1
    `;

    let params = [];
    let countParams = [];

    if (type === 'my') {
      sql += ' AND ea.applicant_id = ?';
      countSql += ' AND ea.applicant_id = ?';
      params.push(user_id);
      countParams.push(user_id);
    } else if (type === 'approver') {
      sql += ' AND ea.approver_id = ? AND ea.status = "approving"';
      countSql += ' AND ea.approver_id = ? AND ea.status = "approving"';
      params.push(user_id);
      countParams.push(user_id);
    } else if (type === 'finance') {
      sql += ' AND ea.status = "reviewing"';
      countSql += ' AND ea.status = "reviewing"';
    } else if (type === 'cc') {
      sql += ' AND EXISTS (SELECT 1 FROM cc_records cc WHERE cc.application_id = ea.id AND cc.user_id = ?)';
      countSql += ' AND EXISTS (SELECT 1 FROM cc_records cc WHERE cc.application_id = ea.id AND cc.user_id = ?)';
      params.push(user_id);
      countParams.push(user_id);
    } else if (type === 'archive') {
      sql += ' AND ea.status = "archived"';
      countSql += ' AND ea.status = "archived"';
    } else if (type === 'approved') {
      sql += ' AND (ea.status = "approved" OR ea.status = "archived")';
      countSql += ' AND (ea.status = "approved" OR ea.status = "archived")';
    }

    if (status) {
      if (status === 'approving') {
        sql += ' AND (ea.status = "approving" OR ea.status = "reviewing")';
        countSql += ' AND (ea.status = "approving" OR ea.status = "reviewing")';
      } else {
        sql += ' AND ea.status = ?';
        countSql += ' AND ea.status = ?';
        params.push(status);
        countParams.push(status);
      }
    }

    if (search) {
      const searchParam = `%${search}%`;
      sql += ' AND (ea.application_no LIKE ? OR ua.name LIKE ? OR p.name LIKE ?)';
      countSql += ' AND (ea.application_no LIKE ? OR ua.name LIKE ? OR p.name LIKE ?)';
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    sql += ' ORDER BY ea.created_at DESC';

    const offset = (page - 1) * pageSize;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const countResult = await get(countSql, countParams);
    const applications = await all(sql, params);

    res.json({
      success: true,
      data: {
        list: applications,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取申请列表错误:', error);
    res.status(500).json({ success: false, message: '获取申请列表失败' });
  }
};

export const getApplicationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await get(`
      SELECT 
        ea.*,
        ua.name as applicant_name,
        ua.department as applicant_department,
        p.name as project_name,
        p.code as project_code,
        et.name as expense_type_name,
        approver.name as approver_name,
        reviewer.name as reviewer_name
      FROM expense_applications ea
      LEFT JOIN users ua ON ea.applicant_id = ua.id
      LEFT JOIN projects p ON ea.project_id = p.id
      LEFT JOIN expense_types et ON ea.expense_type_id = et.id
      LEFT JOIN users approver ON ea.approver_id = approver.id
      LEFT JOIN users reviewer ON ea.reviewer_id = reviewer.id
      WHERE ea.id = ?
    `, [id]);

    if (!application) {
      return res.status(404).json({ success: false, message: '申请不存在' });
    }

    const approvalRecords = await all(`
      SELECT 
        ar.*,
        u.name as approver_name
      FROM approval_records ar
      LEFT JOIN users u ON ar.approver_id = u.id
      WHERE ar.application_id = ?
      ORDER BY ar.created_at ASC
    `, [id]);

    const ccRecords = await all(`
      SELECT 
        cc.*,
        u.name as user_name,
        u.department as user_department
      FROM cc_records cc
      LEFT JOIN users u ON cc.user_id = u.id
      WHERE cc.application_id = ?
    `, [id]);

    const attachments = await all(`
      SELECT * FROM attachments WHERE application_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...application,
        approval_records: approvalRecords,
        cc_records: ccRecords,
        attachments: attachments
      }
    });
  } catch (error) {
    console.error('获取申请详情错误:', error);
    res.status(500).json({ success: false, message: '获取申请详情失败' });
  }
};

export const approverApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, submit_finance = true } = req.body;
    const approver_id = req.userId;

    const application = await get(`
      SELECT * FROM expense_applications WHERE id = ?
    `, [id]);

    if (!application) {
      return res.status(404).json({ success: false, message: '申请不存在' });
    }

    if (application.approver_id !== approver_id) {
      return res.status(403).json({ success: false, message: '您不是该申请的审批人' });
    }

    if (application.status !== 'approving' && application.status !== 'submitted') {
      return res.status(400).json({ success: false, message: '当前状态不可审批' });
    }

    let newStatus = application.status;
    let currentStep = application.current_step;

    if (action === 'approve') {
      if (submit_finance) {
        newStatus = 'reviewing';
        currentStep = 'finance';
      } else {
        newStatus = 'approved';
        currentStep = 'complete';
      }
    } else if (action === 'reject') {
      newStatus = 'approver_rejected';
      currentStep = 'rejected';
    }

    await run(`
      UPDATE expense_applications 
      SET status = ?, current_step = ?, updated_at = ?
      WHERE id = ?
    `, [newStatus, currentStep, new Date().toISOString(), id]);

    await run(`
      INSERT INTO approval_records (application_id, approver_id, step, action, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [id, approver_id, 'approver', action, comment || '']);

    res.json({
      success: true,
      message: action === 'approve' ? '审批通过' : '已驳回'
    });
  } catch (error) {
    console.error('审批错误:', error);
    res.status(500).json({ success: false, message: '审批失败' });
  }
};

export const financeApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const reviewer_id = req.userId;

    const application = await get(`
      SELECT * FROM expense_applications WHERE id = ?
    `, [id]);

    if (!application) {
      return res.status(404).json({ success: false, message: '申请不存在' });
    }

    if (application.status !== 'reviewing') {
      return res.status(400).json({ success: false, message: '当前状态不可审批' });
    }

    let newStatus = application.status;
    let currentStep = application.current_step;

    if (action === 'approve') {
      newStatus = 'approved';
      currentStep = 'complete';
    } else if (action === 'reject') {
      newStatus = 'finance_rejected';
      currentStep = 'rejected';
    }

    await run(`
      UPDATE expense_applications 
      SET status = ?, current_step = ?, reviewer_id = ?, updated_at = ?
      WHERE id = ?
    `, [newStatus, currentStep, reviewer_id, new Date().toISOString(), id]);

    await run(`
      INSERT INTO approval_records (application_id, approver_id, step, action, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [id, reviewer_id, 'finance', action, comment || '']);

    res.json({
      success: true,
      message: action === 'approve' ? '复核通过' : '已驳回'
    });
  } catch (error) {
    console.error('财务审批错误:', error);
    res.status(500).json({ success: false, message: '财务审批失败' });
  }
};

export const batchFinanceApprove = async (req, res) => {
  try {
    const { application_ids, action, comment } = req.body;
    const reviewer_id = req.userId;

    if (!application_ids || application_ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要审批的申请' });
    }

    for (const application_id of application_ids) {
      const application = await get(`
        SELECT * FROM expense_applications WHERE id = ?
      `, [application_id]);

      if (application && application.status === 'reviewing') {
        let newStatus = action === 'approve' ? 'approved' : 'finance_rejected';
        let currentStep = action === 'approve' ? 'complete' : 'rejected';

        await run(`
          UPDATE expense_applications 
          SET status = ?, current_step = ?, reviewer_id = ?, updated_at = ?
          WHERE id = ?
        `, [newStatus, currentStep, reviewer_id, new Date().toISOString(), application_id]);

        await run(`
          INSERT INTO approval_records (application_id, approver_id, step, action, comment)
          VALUES (?, ?, ?, ?, ?)
        `, [application_id, reviewer_id, 'finance', action, comment || '']);
      }
    }

    res.json({
      success: true,
      message: `批量${action === 'approve' ? '通过' : '驳回'}成功`
    });
  } catch (error) {
    console.error('批量审批错误:', error);
    res.status(500).json({ success: false, message: '批量审批失败' });
  }
};

export const archiveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const archiver_id = req.userId;

    const application = await get(`
      SELECT * FROM expense_applications WHERE id = ?
    `, [id]);

    if (!application) {
      return res.status(404).json({ success: false, message: '申请不存在' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ success: false, message: '只能归档已通过的申请' });
    }

    const archive_no = `ARC-${Date.now()}`;

    await run(`
      UPDATE expense_applications 
      SET status = ?, archived_at = ?, updated_at = ?
      WHERE id = ?
    `, ['archived', new Date().toISOString(), new Date().toISOString(), id]);

    await run(`
      INSERT INTO archive_records (application_id, archiver_id, archive_no)
      VALUES (?, ?, ?)
    `, [id, archiver_id, archive_no]);

    res.json({
      success: true,
      message: '归档成功'
    });
  } catch (error) {
    console.error('归档错误:', error);
    res.status(500).json({ success: false, message: '归档失败' });
  }
};
