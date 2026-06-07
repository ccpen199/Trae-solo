import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';

export function createProject(req: AuthRequest, res: Response) {
  const enterpriseId = req.user!.id;
  const {
    projectName, projectCode, projectType, projectAddress,
    geofenceLat, geofenceLng, geofenceRadius, budget,
    startDate, endDate
  } = req.body;

  if (!projectName || !projectCode || !projectAddress) {
    return res.status(400).json({ message: '请填写必填字段：项目名称、项目编号、项目地址' });
  }

  const existing = db.prepare('SELECT id FROM construction_projects WHERE project_code = ?').get(projectCode) as any;
  if (existing) {
    return res.status(400).json({ message: '项目编号已存在' });
  }

  const insert = db.prepare(`
    INSERT INTO construction_projects 
    (enterprise_id, project_name, project_code, project_type, project_address,
     geofence_lat, geofence_lng, geofence_radius, budget, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning', ?, ?)
  `);

  const result = insert.run(
    enterpriseId,
    projectName,
    projectCode,
    projectType || null,
    projectAddress,
    geofenceLat || null,
    geofenceLng || null,
    geofenceRadius || 200,
    budget || null,
    startDate || null,
    endDate || null
  );

  res.json({
    id: result.lastInsertRowid,
    message: '项目创建成功'
  });
}

export function getProjects(req: AuthRequest, res: Response) {
  const { status, enterpriseId, page, pageSize } = req.query;
  let countSql = 'SELECT COUNT(*) as total FROM construction_projects cp WHERE 1=1';
  let sql = `
    SELECT cp.id, cp.enterprise_id AS "enterpriseId",
           cp.project_name AS "projectName", cp.project_code AS "projectCode",
           cp.project_type AS "projectType", cp.project_address AS "projectAddress",
           cp.geofence_lat AS "geofenceLat", cp.geofence_lng AS "geofenceLng",
           cp.geofence_radius AS "geofenceRadius", cp.budget, cp.status,
           cp.start_date AS "startDate", cp.end_date AS "endDate",
           cp.actual_start_date AS "actualStartDate", cp.actual_end_date AS "actualEndDate",
           cp.created_at AS "createdAt", cp.updated_at AS "updatedAt",
           ep.company_name AS "companyName",
           (SELECT COUNT(*) FROM labor_contracts lc WHERE lc.project_id = cp.id AND lc.status = 'signed') AS "workerCount"
    FROM construction_projects cp
    JOIN enterprise_profiles ep ON cp.enterprise_id = ep.user_id
    WHERE 1=1
  `;
  const params: any[] = [];
  const countParams: any[] = [];

  if (status) {
    sql += ' AND cp.status = ?';
    countSql += ' AND cp.status = ?';
    params.push(status);
    countParams.push(status);
  }
  if (enterpriseId) {
    sql += ' AND cp.enterprise_id = ?';
    countSql += ' AND cp.enterprise_id = ?';
    params.push(enterpriseId);
    countParams.push(enterpriseId);
  }
  if (req.user!.role === 'enterprise') {
    sql += ' AND cp.enterprise_id = ?';
    countSql += ' AND cp.enterprise_id = ?';
    params.push(req.user!.id);
    countParams.push(req.user!.id);
  }

  sql += ' ORDER BY cp.created_at DESC';
  const p = parseInt(page as string) || 1;
  const ps = parseInt(pageSize as string) || 20;
  const offset = (p - 1) * ps;
  sql += ' LIMIT ? OFFSET ?';
  params.push(ps, offset);

  const projects = db.prepare(sql).all(...params) as any[];
  const countResult = db.prepare(countSql).get(...countParams) as any;
  res.json({
    projects,
    total: countResult.total,
    page: p,
    pageSize: ps
  });
}

export function getMyProjects(req: AuthRequest, res: Response) {
  const enterpriseId = req.user!.id;
  
  const projects = db.prepare(`
    SELECT cp.id, cp.enterprise_id AS "enterpriseId",
           cp.project_name AS "projectName", cp.project_code AS "projectCode",
           cp.project_type AS "projectType", cp.project_address AS "projectAddress",
           cp.geofence_lat AS "geofenceLat", cp.geofence_lng AS "geofenceLng",
           cp.geofence_radius AS "geofenceRadius", cp.budget, cp.status,
           cp.start_date AS "startDate", cp.end_date AS "endDate",
           cp.actual_start_date AS "actualStartDate", cp.actual_end_date AS "actualEndDate",
           cp.created_at AS "createdAt", cp.updated_at AS "updatedAt",
           (SELECT COUNT(*) FROM labor_contracts lc WHERE lc.project_id = cp.id AND lc.status = 'signed') AS "workerCount"
    FROM construction_projects cp
    WHERE cp.enterprise_id = ?
    ORDER BY cp.created_at DESC
  `).all(enterpriseId) as any[];

  res.json(projects);
}

export function getProjectDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  
  const project = db.prepare(`
    SELECT cp.id, cp.enterprise_id AS "enterpriseId",
           cp.project_name AS "projectName", cp.project_code AS "projectCode",
           cp.project_type AS "projectType", cp.project_address AS "projectAddress",
           cp.geofence_lat AS "geofenceLat", cp.geofence_lng AS "geofenceLng",
           cp.geofence_radius AS "geofenceRadius", cp.budget, cp.status,
           cp.start_date AS "startDate", cp.end_date AS "endDate",
           cp.actual_start_date AS "actualStartDate", cp.actual_end_date AS "actualEndDate",
           cp.created_at AS "createdAt", cp.updated_at AS "updatedAt",
           ep.company_name AS "companyName"
    FROM construction_projects cp
    JOIN enterprise_profiles ep ON cp.enterprise_id = ep.user_id
    WHERE cp.id = ?
  `).get(id);

  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  const workers = db.prepare(`
    SELECT lc.id AS "contractId", u.id AS "workerId", u.real_name AS "realName",
           wp.skill_level AS "skillLevel", t.gb_name AS "gbName", jp.title
    FROM labor_contracts lc
    JOIN users u ON lc.worker_id = u.id
    JOIN worker_profiles wp ON u.id = wp.user_id
    JOIN job_postings jp ON lc.job_posting_id = jp.id
    JOIN trades t ON jp.trade_id = t.id
    WHERE lc.project_id = ? AND lc.status = 'signed'
  `).all(id) as any[];

  const socialSecurityWarnings = db.prepare(`
    SELECT ssr.id, ssr.worker_id AS "workerId", ssr.enterprise_id AS "enterpriseId",
           ssr.project_id AS "projectId", ssr.insurance_type AS "insuranceType",
           ssr.insurance_month AS "insuranceMonth", ssr.payment_amount AS "paymentAmount",
           ssr.payment_status AS "paymentStatus", ssr.warning_sent AS "warningSent",
           ssr.created_at AS "createdAt", u.real_name AS "realName"
    FROM social_security_records ssr
    JOIN users u ON ssr.worker_id = u.id
    WHERE ssr.project_id = ? AND ssr.payment_status IN ('unpaid', 'overdue')
  `).all(id) as any[];

  res.json({
    ...project,
    workers,
    socialSecurityWarnings
  });
}

export function updateProjectStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['planning', 'approved', 'started', 'under_construction', 'completed', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: '无效的项目状态' });
  }

  const project = db.prepare('SELECT * FROM construction_projects WHERE id = ?').get(id) as any;
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  if (req.user!.role === 'enterprise' && project.enterprise_id !== req.user!.id) {
    return res.status(403).json({ message: '无权修改此项目' });
  }

  const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [status];

  if (status === 'started' && !project.actual_start_date) {
    updates.push('actual_start_date = CURRENT_DATE');
  }
  if (status === 'completed' && !project.actual_end_date) {
    updates.push('actual_end_date = CURRENT_DATE');
  }

  params.push(id);

  db.prepare(`UPDATE construction_projects SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  res.json({ message: '项目状态更新成功', status });
}

export function updateProject(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const updates = req.body;

  const project = db.prepare('SELECT * FROM construction_projects WHERE id = ?').get(id) as any;
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  if (req.user!.role === 'enterprise' && project.enterprise_id !== req.user!.id) {
    return res.status(403).json({ message: '无权修改此项目' });
  }

  const allowedFields = [
    'project_name', 'project_type', 'project_address',
    'geofence_lat', 'geofence_lng', 'geofence_radius',
    'budget', 'start_date', 'end_date'
  ];

  const setClauses: string[] = [];
  const params: any[] = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ message: '没有需要更新的字段' });
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  db.prepare(`UPDATE construction_projects SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  res.json({ message: '项目更新成功' });
}
