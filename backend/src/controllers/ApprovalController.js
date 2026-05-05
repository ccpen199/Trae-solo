const db = require('../database/index');

class ApprovalController {
  static async submitApproval(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { teacher_id, approval_type, expect_regular_date, reason } = req.body;

      if (!teacher_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '请指定教师ID'
        });
      }

      const teacherCheck = await client.query(
        'SELECT id, name, status, entry_date FROM teachers WHERE id = $1',
        [teacher_id]
      );

      if (teacherCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '教师不存在'
        });
      }

      const teacher = teacherCheck.rows[0];

      if (teacher.status === 'regular') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '该教师已转正，无需再次提交审批'
        });
      }

      const existingApproval = await client.query(
        `SELECT id, status FROM approvals 
         WHERE teacher_id = $1 AND status IN ('pending', 'approved') 
         LIMIT 1`,
        [teacher_id]
      );

      if (existingApproval.rows.length > 0) {
        await client.query('ROLLBACK');
        const approvalStatus = {
          'pending': '进行中',
          'approved': '已通过'
        }[existingApproval.rows[0].status];
        
        return res.status(400).json({
          success: false,
          message: `该教师已有${approvalStatus}的转正审批，请勿重复提交`
        });
      }

      const finalType = approval_type || 'regularization';
      const totalSteps = 3;

      const approvalResult = await client.query(
        `INSERT INTO approvals 
         (teacher_id, approval_type, status, expect_regular_date, reason, current_step, total_steps)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, teacher_id, status, current_step, total_steps, created_at`,
        [
          teacher_id,
          finalType,
          'pending',
          expect_regular_date || null,
          reason || null,
          1,
          totalSteps
        ]
      );

      const approval = approvalResult.rows[0];

      await client.query(
        `INSERT INTO approval_history 
         (approval_id, step, approver, department, action, comment)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          approval.id,
          1,
          '系统',
          '自动提交',
          'submit',
          '转正审批申请已提交，等待部门审批'
        ]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: '转正审批已提交',
        data: {
          approval_id: approval.id,
          teacher_id: approval.teacher_id,
          teacher_name: teacher.name,
          status: approval.status,
          current_step: approval.current_step,
          total_steps: approval.total_steps,
          next_step: '等待第一步审批（部门审批）'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('提交审批错误:', error);
      return res.status(500).json({
        success: false,
        message: '提交审批失败'
      });
    } finally {
      client.release();
    }
  }

  static async processApproval(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { approval_id } = req.params;
      const { action, approver, department, comment } = req.body;

      if (!approval_id || !action) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '审批ID和操作类型为必填项'
        });
      }

      const approvalCheck = await client.query(
        `SELECT a.id, a.teacher_id, a.status, a.current_step, a.total_steps, a.approval_type,
                t.name as teacher_name
         FROM approvals a
         JOIN teachers t ON a.teacher_id = t.id
         WHERE a.id = $1`,
        [approval_id]
      );

      if (approvalCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '审批记录不存在'
        });
      }

      const approval = approvalCheck.rows[0];

      if (approval.status !== 'pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `当前审批状态为 ${approval.status}，无法进行操作`
        });
      }

      const currentStep = approval.current_step;
      const totalSteps = approval.total_steps;

      await client.query(
        `INSERT INTO approval_history 
         (approval_id, step, approver, department, action, comment)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          approval_id,
          currentStep,
          approver || '未知审批人',
          department || '未知部门',
          action,
          comment || ''
        ]
      );

      if (action === 'reject') {
        await client.query(
          `UPDATE approvals 
           SET status = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          ['rejected', approval_id]
        );

        await client.query('COMMIT');

        return res.json({
          success: true,
          message: '审批已驳回',
          data: {
            approval_id: approval_id,
            teacher_id: approval.teacher_id,
            teacher_name: approval.teacher_name,
            status: 'rejected',
            step: currentStep
          }
        });
      } else if (action === 'approve') {
        if (currentStep < totalSteps) {
          const newStep = currentStep + 1;
          await client.query(
            `UPDATE approvals 
             SET current_step = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [newStep, approval_id]
          );

          const stepNames = {
            1: '部门审批',
            2: '人事部审批',
            3: '校长审批'
          };

          await client.query('COMMIT');

          return res.json({
            success: true,
            message: `第${currentStep}步审批通过，等待第${newStep}步审批（${stepNames[newStep] || '下一步'}）`,
            data: {
              approval_id: approval_id,
              teacher_id: approval.teacher_id,
              teacher_name: approval.teacher_name,
              status: 'pending',
              current_step: newStep,
              total_steps: totalSteps
            }
          });
        } else {
          await client.query(
            `UPDATE approvals 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            ['approved', approval_id]
          );

          await client.query(
            `UPDATE teachers 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            ['regular', approval.teacher_id]
          );

          await client.query(
            `INSERT INTO approval_history 
             (approval_id, step, approver, department, action, comment)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              approval_id,
              totalSteps + 1,
              '系统',
              '自动处理',
              'complete',
              '转正审批流程完成，教师状态已更新为"已转正"'
            ]
          );

          await client.query('COMMIT');

          return res.json({
            success: true,
            message: '转正审批流程完成，教师已正式转正',
            data: {
              approval_id: approval_id,
              teacher_id: approval.teacher_id,
              teacher_name: approval.teacher_name,
              status: 'approved',
              teacher_status: 'regular'
            }
          });
        }
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '无效的操作类型，仅支持 approve 或 reject'
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('处理审批错误:', error);
      return res.status(500).json({
        success: false,
        message: '处理审批失败'
      });
    } finally {
      client.release();
    }
  }

  static async getApprovalList(req, res) {
    try {
      const { teacher_id, status, approval_type, page = 1, page_size = 20 } = req.query;

      let conditions = [];
      let params = [];
      let paramIndex = 1;

      if (teacher_id) {
        conditions.push(`a.teacher_id = $${paramIndex}`);
        params.push(teacher_id);
        paramIndex++;
      }

      if (status) {
        conditions.push(`a.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (approval_type) {
        conditions.push(`a.approval_type = $${paramIndex}`);
        params.push(approval_type);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ') 
        : '';

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM approvals a
        ${whereClause}
      `;

      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      const offset = (parseInt(page) - 1) * parseInt(page_size);
      const limit = parseInt(page_size);

      const dataQuery = `
        SELECT 
          a.id,
          a.teacher_id,
          t.name as teacher_name,
          d.name as department_name,
          a.approval_type,
          a.status,
          a.current_step,
          a.total_steps,
          a.expect_regular_date,
          a.reason,
          a.submit_date,
          a.created_at,
          a.updated_at
        FROM approvals a
        JOIN teachers t ON a.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataParams = [...params, limit, offset];
      const dataResult = await db.query(dataQuery, dataParams);

      const approvalList = dataResult.rows.map(item => ({
        ...item,
        status_label: {
          'pending': '审批中',
          'approved': '已通过',
          'rejected': '已驳回'
        }[item.status] || item.status,
        type_label: {
          'regularization': '转正审批'
        }[item.approval_type] || item.approval_type,
        progress: `${item.current_step}/${item.total_steps}`
      }));

      return res.json({
        success: true,
        data: {
          list: approvalList,
          pagination: {
            page: parseInt(page),
            page_size: parseInt(page_size),
            total: total,
            total_pages: Math.ceil(total / parseInt(page_size))
          }
        }
      });

    } catch (error) {
      console.error('查询审批列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '查询审批列表失败'
      });
    }
  }

  static async getApprovalDetail(req, res) {
    try {
      const { id } = req.params;

      const approvalResult = await db.query(
        `SELECT 
          a.id,
          a.teacher_id,
          t.name as teacher_name,
          t.gender,
          t.position,
          t.entry_date,
          t.status as teacher_status,
          d.name as department_name,
          a.approval_type,
          a.status,
          a.current_step,
          a.total_steps,
          a.expect_regular_date,
          a.reason,
          a.submit_date,
          a.created_at,
          a.updated_at
        FROM approvals a
        JOIN teachers t ON a.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE a.id = $1`,
        [id]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '审批记录不存在'
        });
      }

      const approval = approvalResult.rows[0];

      const historyResult = await db.query(
        `SELECT 
          id,
          approval_id,
          step,
          approver,
          department,
          action,
          comment,
          action_time
        FROM approval_history
        WHERE approval_id = $1
        ORDER BY step ASC, action_time ASC`,
        [id]
      );

      const statusMap = {
        'pending': '审批中',
        'approved': '已通过',
        'rejected': '已驳回'
      };

      const actionMap = {
        'submit': '提交',
        'approve': '通过',
        'reject': '驳回',
        'complete': '完成'
      };

      return res.json({
        success: true,
        data: {
          ...approval,
          status_label: statusMap[approval.status] || approval.status,
          teacher_status_label: {
            'probation': '试用期',
            'regular': '已转正'
          }[approval.teacher_status] || approval.teacher_status,
          progress: `${approval.current_step}/${approval.total_steps}`,
          history: historyResult.rows.map(h => ({
            ...h,
            action_label: actionMap[h.action] || h.action
          }))
        }
      });

    } catch (error) {
      console.error('获取审批详情错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取审批详情失败'
      });
    }
  }

  static async getTeacherApprovals(req, res) {
    try {
      const { teacher_id } = req.params;

      const result = await db.query(
        `SELECT 
          a.id,
          a.teacher_id,
          a.approval_type,
          a.status,
          a.current_step,
          a.total_steps,
          a.expect_regular_date,
          a.reason,
          a.submit_date,
          a.created_at,
          a.updated_at
        FROM approvals a
        WHERE a.teacher_id = $1
        ORDER BY a.created_at DESC`,
        [teacher_id]
      );

      const statusMap = {
        'pending': '审批中',
        'approved': '已通过',
        'rejected': '已驳回'
      };

      const approvals = result.rows.map(item => ({
        ...item,
        status_label: statusMap[item.status] || item.status,
        progress: `${item.current_step}/${item.total_steps}`
      }));

      return res.json({
        success: true,
        data: approvals
      });

    } catch (error) {
      console.error('获取教师审批记录错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取教师审批记录失败'
      });
    }
  }
}

module.exports = ApprovalController;
