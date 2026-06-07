import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';

export function createJobPosting(req: AuthRequest, res: Response) {
  const enterpriseId = req.user!.id;
  const {
    tradeId, projectId, title, description, salaryType, salaryMin, salaryMax,
    salaryDetails, includesBoard, includesLodging, safetyTrainingRequired,
    workLocation, requirementDescription, peopleNeeded
  } = req.body;

  if (!tradeId || !title || !salaryType || !salaryMin || !workLocation) {
    return res.status(400).json({ message: '请填写必填字段：工种、岗位名称、薪资类型、最低薪资、工作地点' });
  }

  const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);
  if (!trade) {
    return res.status(400).json({ message: '选择的工种不存在' });
  }

  if (!['daily', 'piece', 'monthly'].includes(salaryType)) {
    return res.status(400).json({ message: '薪资类型必须是 daily(日薪)、piece(计件) 或 monthly(月薪)' });
  }

  const insert = db.prepare(`
    INSERT INTO job_postings 
    (enterprise_id, trade_id, project_id, title, description, salary_type, 
     salary_min, salary_max, salary_details, includes_board, includes_lodging,
     safety_training_required, work_location, requirement_description, people_needed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    enterpriseId,
    tradeId,
    projectId || null,
    title,
    description || null,
    salaryType,
    salaryMin,
    salaryMax || null,
    salaryDetails ? JSON.stringify(salaryDetails) : null,
    includesBoard ? 1 : 0,
    includesLodging ? 1 : 0,
    safetyTrainingRequired || null,
    workLocation,
    requirementDescription || null,
    peopleNeeded || 1
  );

  res.json({
    id: result.lastInsertRowid,
    message: '岗位发布成功'
  });
}

export function getJobPostings(req: AuthRequest, res: Response) {
  const { tradeId, salaryType, workLocation, enterpriseId } = req.query;
  let sql = `
    SELECT jp.*, t.gb_code, t.gb_name, t.category, ep.company_name, cp.project_name
    FROM job_postings jp
    JOIN trades t ON jp.trade_id = t.id
    JOIN enterprise_profiles ep ON jp.enterprise_id = ep.user_id
    LEFT JOIN construction_projects cp ON jp.project_id = cp.id
    WHERE jp.status = 'active'
  `;
  const params: any[] = [];

  if (tradeId) {
    sql += ' AND jp.trade_id = ?';
    params.push(tradeId);
  }
  if (salaryType) {
    sql += ' AND jp.salary_type = ?';
    params.push(salaryType);
  }
  if (workLocation) {
    sql += ' AND jp.work_location LIKE ?';
    params.push(`%${workLocation}%`);
  }
  if (enterpriseId) {
    sql += ' AND jp.enterprise_id = ?';
    params.push(enterpriseId);
  }

  sql += ' ORDER BY jp.created_at DESC';

  const jobs = db.prepare(sql).all(...params) as any[];
  res.json(jobs);
}

export function getMyJobPostings(req: AuthRequest, res: Response) {
  const enterpriseId = req.user!.id;
  
  const jobs = db.prepare(`
    SELECT jp.*, t.gb_code, t.gb_name, t.category, cp.project_name
    FROM job_postings jp
    JOIN trades t ON jp.trade_id = t.id
    LEFT JOIN construction_projects cp ON jp.project_id = cp.id
    WHERE jp.enterprise_id = ?
    ORDER BY jp.created_at DESC
  `).all(enterpriseId) as any[];

  res.json(jobs);
}

export function getJobDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  
  const job = db.prepare(`
    SELECT jp.*, t.gb_code, t.gb_name, t.category, ep.company_name, 
           ep.company_address, cp.project_name, cp.project_address, cp.status as project_status
    FROM job_postings jp
    JOIN trades t ON jp.trade_id = t.id
    JOIN enterprise_profiles ep ON jp.enterprise_id = ep.user_id
    LEFT JOIN construction_projects cp ON jp.project_id = cp.id
    WHERE jp.id = ?
  `).get(id) as any;

  if (!job) {
    return res.status(404).json({ message: '岗位不存在' });
  }

  res.json({
    ...job,
    salary_details: job.salary_details ? JSON.parse(job.salary_details) : null
  });
}

export function updateJobPosting(req: AuthRequest, res: Response) {
  const enterpriseId = req.user!.id;
  const { id } = req.params;
  const updates = req.body;

  const job = db.prepare('SELECT * FROM job_postings WHERE id = ? AND enterprise_id = ?').get(id, enterpriseId) as any;
  if (!job) {
    return res.status(404).json({ message: '岗位不存在或无权修改' });
  }

  const allowedFields = [
    'title', 'description', 'salary_min', 'salary_max', 'salary_details',
    'includes_board', 'includes_lodging', 'safety_training_required',
    'work_location', 'requirement_description', 'people_needed', 'status'
  ];

  const setClauses: string[] = [];
  const params: any[] = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'salary_details') {
        setClauses.push(`${field} = ?`);
        params.push(JSON.stringify(updates[field]));
      } else if (field === 'includes_board' || field === 'includes_lodging') {
        setClauses.push(`${field} = ?`);
        params.push(updates[field] ? 1 : 0);
      } else {
        setClauses.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ message: '没有需要更新的字段' });
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  db.prepare(`UPDATE job_postings SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  res.json({ message: '岗位更新成功' });
}
