import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';

interface SalaryBreakdown {
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  deductions: number;
  social_security: number;
  net_salary: number;
}

function calculateSalary(contract: any, attendanceRecords: any[], year: number, month: number): SalaryBreakdown {
  const salaryAmount = contract.salary_amount || 0;
  const salaryType = contract.salary_type;
  
  const totalWorkHours = attendanceRecords.reduce((sum: number, r: any) => sum + (r.work_hours || 0), 0);
  const normalDays = attendanceRecords.filter((r: any) => r.status === 'normal').length;
  const overtimeHours = attendanceRecords.reduce((sum: number, r: any) => {
    if (r.status === 'overtime' && r.work_hours > 8) {
      return sum + (r.work_hours - 8);
    }
    return sum;
  }, 0);
  const lateDays = attendanceRecords.filter((r: any) => r.status === 'late').length;
  const earlyLeaveDays = attendanceRecords.filter((r: any) => r.status === 'early_leave').length;
  
  let baseSalary = 0;
  
  if (salaryType === 'monthly') {
    baseSalary = salaryAmount;
  } else if (salaryType === 'daily') {
    baseSalary = salaryAmount * normalDays;
  } else if (salaryType === 'piece') {
    baseSalary = salaryAmount * normalDays;
  }
  
  const overtimeHourlyRate = (salaryType === 'monthly' ? salaryAmount / 22 / 8 : salaryAmount / 8);
  const overtimePay = Math.round(overtimeHours * overtimeHourlyRate * 1.5 * 100) / 100;
  
  const bonus = 0;
  
  const lateDeduction = lateDays * 50;
  const earlyLeaveDeduction = earlyLeaveDays * 50;
  const deductions = Math.round((lateDeduction + earlyLeaveDeduction) * 100) / 100;
  
  const socialSecurity = Math.round(baseSalary * 0.08 * 100) / 100;
  
  const netSalary = Math.round((baseSalary + overtimePay + bonus - deductions - socialSecurity) * 100) / 100;
  
  return {
    base_salary: baseSalary,
    overtime_pay: overtimePay,
    bonus,
    deductions,
    social_security: socialSecurity,
    net_salary: netSalary
  };
}

export function generatePayroll(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const role = req.user!.role;
  const { year, month, workerId, projectId } = req.body;

  if (!year || !month) {
    return res.status(400).json({ message: '请指定年份和月份' });
  }

  if (role !== 'admin' && role !== 'enterprise') {
    return res.status(403).json({ message: '只有企业和管理员可以生成工资条' });
  }

  let contractSql = `
    SELECT DISTINCT lc.* FROM labor_contracts lc
    WHERE lc.status = 'signed'
  `;
  const contractParams: any[] = [];

  if (role === 'enterprise') {
    contractSql += ' AND lc.enterprise_id = ?';
    contractParams.push(userId);
  }

  if (workerId) {
    contractSql += ' AND lc.worker_id = ?';
    contractParams.push(workerId);
  }

  if (projectId) {
    contractSql += ' AND lc.project_id = ?';
    contractParams.push(projectId);
  }

  const contracts = db.prepare(contractSql).all(...contractParams);
  
  if (contracts.length === 0) {
    return res.status(404).json({ message: '未找到有效的合同' });
  }

  const yearStr = String(year);
  const monthStr = String(month).padStart(2, '0');
  
  const generatedPayrolls: any[] = [];
  
  const transaction = db.transaction(() => {
    for (const contract of contracts as any[]) {
      const existingPayroll = db.prepare(`
        SELECT id FROM payrolls 
        WHERE worker_id = ? AND contract_id = ? AND period_year = ? AND period_month = ?
      `).get(contract.worker_id, contract.id, year, month) as any;
      
      if (existingPayroll) {
        continue;
      }
      
      const attendanceRecords = db.prepare(`
        SELECT * FROM attendance_records
        WHERE worker_id = ? AND project_id = ?
          AND strftime('%Y', check_in_time) = ?
          AND strftime('%m', check_in_time) = ?
          AND check_out_time IS NOT NULL
      `).all(contract.worker_id, contract.project_id, yearStr, monthStr) as any[];
      
      const salary = calculateSalary(contract, attendanceRecords, year, month);
      
      const insertPayroll = db.prepare(`
        INSERT INTO payrolls 
        (worker_id, enterprise_id, contract_id, project_id, period_year, period_month,
         base_salary, overtime_pay, bonus, deductions, social_security, net_salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertPayroll.run(
        contract.worker_id,
        contract.enterprise_id,
        contract.id,
        contract.project_id,
        year,
        month,
        salary.base_salary,
        salary.overtime_pay,
        salary.bonus,
        salary.deductions,
        salary.social_security,
        salary.net_salary
      );
      
      generatedPayrolls.push({
        id: result.lastInsertRowid,
        workerId: contract.worker_id,
        ...salary
      });
    }
  });
  
  transaction();

  res.json({
    message: `成功生成 ${generatedPayrolls.length} 条工资条`,
    generatedPayrolls
  });
}

export function getMyPayrolls(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { year, month } = req.query;

  let sql = `
    SELECT p.*, u.real_name as worker_name,
           ep.company_name, cp.project_name
    FROM payrolls p
    JOIN users u ON p.worker_id = u.id
    JOIN enterprise_profiles ep ON p.enterprise_id = ep.user_id
    LEFT JOIN construction_projects cp ON p.project_id = cp.id
    WHERE p.worker_id = ?
  `;
  const params: any[] = [workerId];

  if (year) {
    sql += ' AND p.period_year = ?';
    params.push(year);
  }
  if (month) {
    sql += ' AND p.period_month = ?';
    params.push(month);
  }

  sql += ' ORDER BY p.period_year DESC, p.period_month DESC, p.created_at DESC';

  const payrolls = db.prepare(sql).all(...params) as any[];

  res.json(payrolls);
}

export function getPayrollDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  const sql = `
    SELECT p.*, 
           u1.username as worker_username, u1.real_name as worker_name, u1.phone as worker_phone,
           u2.username as enterprise_username, ep.company_name, ep.unified_credit_code,
           cp.project_name, cp.project_address,
           lc.contract_no, lc.salary_type, lc.salary_amount, lc.start_date as contract_start, lc.end_date as contract_end
    FROM payrolls p
    JOIN users u1 ON p.worker_id = u1.id
    JOIN users u2 ON p.enterprise_id = u2.id
    JOIN enterprise_profiles ep ON p.enterprise_id = ep.user_id
    LEFT JOIN construction_projects cp ON p.project_id = cp.id
    LEFT JOIN labor_contracts lc ON p.contract_id = lc.id
    WHERE p.id = ?
  `;

  const payroll = db.prepare(sql).get(id) as any;

  if (!payroll) {
    return res.status(404).json({ message: '工资条不存在' });
  }

  if (role !== 'admin' && payroll.worker_id !== userId && payroll.enterprise_id !== userId) {
    return res.status(403).json({ message: '无权查看此工资条' });
  }

  res.json(payroll);
}

export function markAsViewed(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const workerId = req.user!.id;

  const payroll = db.prepare('SELECT * FROM payrolls WHERE id = ? AND worker_id = ?').get(id, workerId) as any;
  if (!payroll) {
    return res.status(404).json({ message: '工资条不存在或无权操作' });
  }

  db.prepare('UPDATE payrolls SET worker_viewed = 1 WHERE id = ?').run(id);

  res.json({ message: '已标记为已查看' });
}

export function updateBankTransferStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;
  const { status, bankTransferId } = req.body;

  if (role !== 'admin' && role !== 'enterprise') {
    return res.status(403).json({ message: '只有企业和管理员可以更新代发状态' });
  }

  const payroll = db.prepare('SELECT * FROM payrolls WHERE id = ?').get(id) as any;
  if (!payroll) {
    return res.status(404).json({ message: '工资条不存在' });
  }

  if (role === 'enterprise' && payroll.enterprise_id !== userId) {
    return res.status(403).json({ message: '无权更新此工资条的代发状态' });
  }

  if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
    return res.status(400).json({ message: '无效的代发状态，必须是 pending、processing、completed 或 failed' });
  }

  db.prepare(`
    UPDATE payrolls 
    SET bank_transfer_status = ?, bank_transfer_id = ?
    WHERE id = ?
  `).run(status, bankTransferId || null, id);

  res.json({ message: '代发状态更新成功' });
}
