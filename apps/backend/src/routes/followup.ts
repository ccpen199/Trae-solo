import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRoles('admin', 'customer_service'), async (req: Request, res: Response) => {
  try {
    const { status, assignedTo, page = 1, limit = 20 } = req.query;

    let queryText = `
      SELECT fut.*, p.name as patient_name, p.phone as patient_phone,
             u.name as assigned_name, er.report_no
      FROM follow_up_tasks fut
      LEFT JOIN patients p ON fut.patient_id = p.id
      LEFT JOIN users u ON fut.assigned_to = u.id
      LEFT JOIN examination_reports er ON fut.report_id = er.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND fut.status = $${paramIndex++}`;
      params.push(status);
    }

    if (assignedTo) {
      queryText += ` AND fut.assigned_to = $${paramIndex++}`;
      params.push(assignedTo);
    }

    queryText += ` ORDER BY 
      CASE fut.status 
        WHEN 'pending' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'scheduled' THEN 3 
        WHEN 'completed' THEN 4 
      END,
      fut.created_at DESC`;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    const tasks = result.rows.map((row: any) => ({
      id: row.id,
      taskNo: row.task_no,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      reportId: row.report_id,
      reportNo: row.report_no,
      abnormalItems: row.abnormal_items,
      riskLevel: row.risk_level,
      assignedTo: row.assigned_to,
      assignedName: row.assigned_name,
      status: row.status,
      scheduledDate: row.scheduled_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    let countQuery = `SELECT COUNT(*) as count FROM follow_up_tasks WHERE 1=1`;
    const countParams: unknown[] = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countIndex++}`;
      countParams.push(status);
    }

    if (assignedTo) {
      countQuery += ` AND assigned_to = $${countIndex++}`;
      countParams.push(assignedTo);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      tasks,
      total: parseInt(countResult.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Get follow-up tasks error:', error);
    res.status(500).json({ message: '获取随访任务列表失败' });
  }
});

router.get('/:id', authenticateToken, requireRoles('admin', 'customer_service'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT fut.*, p.name as patient_name, p.phone as patient_phone, p.birth_date,
              p.gender, p.id_card, u.name as assigned_name,
              er.summary, er.conclusions, er.risk_level
       FROM follow_up_tasks fut
       LEFT JOIN patients p ON fut.patient_id = p.id
       LEFT JOIN users u ON fut.assigned_to = u.id
       LEFT JOIN examination_reports er ON fut.report_id = er.id
       WHERE fut.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '随访任务不存在' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      taskNo: row.task_no,
      patient: {
        id: row.patient_id,
        name: row.patient_name,
        phone: row.patient_phone,
        birthDate: row.birth_date,
        gender: row.gender,
        idCard: row.id_card,
      },
      reportId: row.report_id,
      reportSummary: row.summary,
      reportConclusions: row.conclusions,
      reportRiskLevel: row.risk_level,
      abnormalItems: row.abnormal_items,
      riskLevel: row.risk_level,
      assignedTo: row.assigned_to,
      assignedName: row.assigned_name,
      status: row.status,
      scheduledDate: row.scheduled_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get follow-up task error:', error);
    res.status(500).json({ message: '获取随访任务详情失败' });
  }
});

router.put('/:id', authenticateToken, requireRoles('admin', 'customer_service'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, notes } = req.body;

    const existingTask = await query(
      `SELECT * FROM follow_up_tasks WHERE id = $1`,
      [id]
    );

    if (existingTask.rows.length === 0) {
      return res.status(404).json({ message: '随访任务不存在' });
    }

    const result = await query(
      `UPDATE follow_up_tasks 
       SET status = COALESCE($1, status),
           scheduled_date = COALESCE($2, scheduled_date),
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, scheduledDate ? new Date(scheduledDate) : null, notes, id]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      status: row.status,
      message: '随访任务更新成功',
    });
  } catch (error) {
    console.error('Update follow-up task error:', error);
    res.status(500).json({ message: '更新随访任务失败' });
  }
});

router.post('/:id/complete', authenticateToken, requireRoles('admin', 'customer_service'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await query(
      `UPDATE follow_up_tasks 
       SET status = 'completed', notes = COALESCE($1, notes), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '随访任务不存在' });
    }

    res.json({
      message: '随访任务已完成',
      taskId: id,
    });
  } catch (error) {
    console.error('Complete follow-up task error:', error);
    res.status(500).json({ message: '完成随访任务失败' });
  }
});

export default router;
