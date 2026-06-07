import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';

function generateContractNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  
  const result = db.prepare('SELECT COUNT(*) as count FROM labor_contracts WHERE contract_no LIKE ?').get(`CONTRACT_${dateStr}_%`) as any;
  const seq = (result.count + 1).toString().padStart(4, '0');
  return `CONTRACT_${dateStr}_${seq}`;
}

export function createContract(req: AuthRequest, res: Response) {
  const enterpriseId = req.user!.id;
  const { workerId, jobPostingId, startDate, endDate, salaryAmount, salaryType, contractContent, contractType } = req.body;

  if (!workerId || !jobPostingId || !startDate || !endDate || !salaryAmount || !salaryType) {
    return res.status(400).json({ message: '请填写必填字段：工人ID、岗位ID、开始日期、结束日期、薪资金额、薪资类型' });
  }

  const worker = db.prepare('SELECT id, role FROM users WHERE id = ? AND role = ?').get(workerId, 'worker') as any;
  if (!worker) {
    return res.status(400).json({ message: '工人不存在或角色无效' });
  }

  const jobPosting = db.prepare('SELECT * FROM job_postings WHERE id = ? AND enterprise_id = ?').get(jobPostingId, enterpriseId) as any;
  if (!jobPosting) {
    return res.status(400).json({ message: '岗位不存在或无权创建合同' });
  }

  if (!['daily', 'piece', 'monthly'].includes(salaryType)) {
    return res.status(400).json({ message: '薪资类型必须是 daily(日薪)、piece(计件) 或 monthly(月薪)' });
  }

  const contractNo = generateContractNo();

  const insert = db.prepare(`
    INSERT INTO labor_contracts 
    (worker_id, enterprise_id, job_posting_id, project_id, contract_no, contract_type, 
     start_date, end_date, salary_amount, salary_type, contract_content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    workerId,
    enterpriseId,
    jobPostingId,
    jobPosting.project_id || null,
    contractNo,
    contractType || null,
    startDate,
    endDate,
    salaryAmount,
    salaryType,
    contractContent || null,
    'draft'
  );

  res.json({
    id: result.lastInsertRowid,
    contractNo,
    message: '合同创建成功'
  });
}

export function getMyContracts(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const role = req.user!.role;
  const { status } = req.query;

  let sql = `
    SELECT lc.*, 
           u1.username as worker_username, u1.real_name as worker_name,
           u2.username as enterprise_username, ep.company_name,
           jp.title as job_title, cp.project_name
    FROM labor_contracts lc
    JOIN users u1 ON lc.worker_id = u1.id
    JOIN users u2 ON lc.enterprise_id = u2.id
    JOIN enterprise_profiles ep ON lc.enterprise_id = ep.user_id
    JOIN job_postings jp ON lc.job_posting_id = jp.id
    LEFT JOIN construction_projects cp ON lc.project_id = cp.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role === 'worker') {
    sql += ' AND lc.worker_id = ?';
    params.push(userId);
  } else if (role === 'enterprise') {
    sql += ' AND lc.enterprise_id = ?';
    params.push(userId);
  }

  if (status) {
    sql += ' AND lc.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY lc.created_at DESC';

  const contracts = db.prepare(sql).all(...params) as any[];
  res.json(contracts);
}

export function getContractDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  let sql = `
    SELECT lc.*, 
           u1.username as worker_username, u1.real_name as worker_name, u1.phone as worker_phone, u1.id_card as worker_id_card,
           u2.username as enterprise_username, ep.company_name, ep.unified_credit_code, ep.contact_phone as enterprise_phone,
           jp.title as job_title, jp.description as job_description, jp.work_location,
           cp.project_name, cp.project_address
    FROM labor_contracts lc
    JOIN users u1 ON lc.worker_id = u1.id
    JOIN users u2 ON lc.enterprise_id = u2.id
    JOIN enterprise_profiles ep ON lc.enterprise_id = ep.user_id
    JOIN job_postings jp ON lc.job_posting_id = jp.id
    LEFT JOIN construction_projects cp ON lc.project_id = cp.id
    WHERE lc.id = ?
  `;

  const contract = db.prepare(sql).get(id) as any;

  if (!contract) {
    return res.status(404).json({ message: '合同不存在' });
  }

  if (role !== 'admin' && contract.worker_id !== userId && contract.enterprise_id !== userId) {
    return res.status(403).json({ message: '无权查看此合同' });
  }

  res.json(contract);
}

export function signContractByWorker(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const workerId = req.user!.id;

  const contract = db.prepare('SELECT * FROM labor_contracts WHERE id = ? AND worker_id = ?').get(id, workerId) as any;
  if (!contract) {
    return res.status(404).json({ message: '合同不存在或无权签署' });
  }

  if (contract.worker_signed) {
    return res.status(400).json({ message: '您已签署此合同' });
  }

  db.prepare(`
    UPDATE labor_contracts 
    SET worker_signed = 1, worker_signed_at = CURRENT_TIMESTAMP,
        status = CASE WHEN enterprise_signed = 1 THEN 'signed' ELSE status END
    WHERE id = ?
  `).run(id);

  const updated = db.prepare('SELECT * FROM labor_contracts WHERE id = ?').get(id) as any;

  res.json({
    message: '合同签署成功',
    contract: updated
  });
}

export function signContractByEnterprise(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const enterpriseId = req.user!.id;

  const contract = db.prepare('SELECT * FROM labor_contracts WHERE id = ? AND enterprise_id = ?').get(id, enterpriseId) as any;
  if (!contract) {
    return res.status(404).json({ message: '合同不存在或无权签署' });
  }

  if (contract.enterprise_signed) {
    return res.status(400).json({ message: '企业已签署此合同' });
  }

  db.prepare(`
    UPDATE labor_contracts 
    SET enterprise_signed = 1, enterprise_signed_at = CURRENT_TIMESTAMP,
        status = CASE WHEN worker_signed = 1 THEN 'signed' ELSE status END
    WHERE id = ?
  `).run(id);

  const updated = db.prepare('SELECT * FROM labor_contracts WHERE id = ?').get(id) as any;

  res.json({
    message: '企业合同签署成功',
    contract: updated
  });
}
