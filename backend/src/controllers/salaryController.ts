import type { Request, Response } from 'express';
import { Prisma, type Employee, type Attendance, type RewardPunishment } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getSalaries(req: Request, res: Response) {
  try {
    const { employeeId, year, month, departmentId, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.SalaryWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId as string;
    }
    if (year) {
      where.year = parseInt(year as string, 10);
    }
    if (month) {
      where.month = parseInt(month as string, 10);
    }
    if (departmentId) {
      where.employee = { departmentId: departmentId as string };
    }

    const [total, salaries] = await Promise.all([
      prisma.salary.count({ where }),
      prisma.salary.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
        },
        skip,
        take: sizeNum,
        orderBy: { year: 'desc', month: 'desc' },
      }),
    ]);

    res.json({
      data: salaries,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: '获取工资列表失败' });
  }
}

export async function getSalaryById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const salary = await prisma.salary.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!salary) {
      return res.status(404).json({ error: '工资记录不存在' });
    }

    res.json(salary);
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ error: '获取工资信息失败' });
  }
}

export async function createSalary(req: Request, res: Response) {
  try {
    const data = req.body;

    const existing = await prisma.salary.findUnique({
      where: {
        employeeId_year_month: {
          employeeId: data.employeeId,
          year: data.year,
          month: data.month,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: '该员工本月工资已存在' });
    }

    const salaryData = await calculateSalary(data.employeeId, data.year, data.month, data);

    const salary = await prisma.salary.create({
      data: {
        employeeId: data.employeeId,
        year: data.year,
        month: data.month,
        ...salaryData,
        status: data.status || 'DRAFT',
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.status(201).json(salary);
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ error: '创建工资失败' });
  }
}

export async function updateSalary(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: Prisma.SalaryUpdateInput = {
      status: data.status,
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
    };

    if (data.baseSalary !== undefined) updateData.baseSalary = parseFloat(data.baseSalary) || 0;
    if (data.performanceSalary !== undefined) updateData.performanceSalary = parseFloat(data.performanceSalary) || 0;
    if (data.allowance !== undefined) updateData.allowance = parseFloat(data.allowance) || 0;
    if (data.bonus !== undefined) updateData.bonus = parseFloat(data.bonus) || 0;
    if (data.overtimePay !== undefined) updateData.overtimePay = parseFloat(data.overtimePay) || 0;
    if (data.housingFund !== undefined) updateData.housingFund = parseFloat(data.housingFund) || 0;
    if (data.pension !== undefined) updateData.pension = parseFloat(data.pension) || 0;
    if (data.medicalInsurance !== undefined) updateData.medicalInsurance = parseFloat(data.medicalInsurance) || 0;
    if (data.unemployment !== undefined) updateData.unemployment = parseFloat(data.unemployment) || 0;
    if (data.tax !== undefined) updateData.tax = parseFloat(data.tax) || 0;
    if (data.otherDeduction !== undefined) updateData.otherDeduction = parseFloat(data.otherDeduction) || 0;
    if (data.attendanceDeduction !== undefined) updateData.attendanceDeduction = parseFloat(data.attendanceDeduction) || 0;

    const salary = await prisma.salary.findUnique({ where: { id } });
    if (salary) {
      const baseSalary = data.baseSalary !== undefined ? parseFloat(data.baseSalary) : salary.baseSalary;
      const performanceSalary = data.performanceSalary !== undefined ? parseFloat(data.performanceSalary) : salary.performanceSalary;
      const allowance = data.allowance !== undefined ? parseFloat(data.allowance) : salary.allowance;
      const bonus = data.bonus !== undefined ? parseFloat(data.bonus) : salary.bonus;
      const overtimePay = data.overtimePay !== undefined ? parseFloat(data.overtimePay) : salary.overtimePay;
      const housingFund = data.housingFund !== undefined ? parseFloat(data.housingFund) : salary.housingFund;
      const pension = data.pension !== undefined ? parseFloat(data.pension) : salary.pension;
      const medicalInsurance = data.medicalInsurance !== undefined ? parseFloat(data.medicalInsurance) : salary.medicalInsurance;
      const unemployment = data.unemployment !== undefined ? parseFloat(data.unemployment) : salary.unemployment;
      const tax = data.tax !== undefined ? parseFloat(data.tax) : salary.tax;
      const otherDeduction = data.otherDeduction !== undefined ? parseFloat(data.otherDeduction) : salary.otherDeduction;
      const attendanceDeduction = data.attendanceDeduction !== undefined ? parseFloat(data.attendanceDeduction) : salary.attendanceDeduction;

      const totalIncome = baseSalary + performanceSalary + allowance + bonus + overtimePay;
      const totalDeduction = housingFund + pension + medicalInsurance + unemployment + tax + otherDeduction + attendanceDeduction;
      const netSalary = totalIncome - totalDeduction;

      updateData.totalIncome = totalIncome;
      updateData.totalDeduction = totalDeduction;
      updateData.netSalary = netSalary;
    }

    const updatedSalary = await prisma.salary.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.json(updatedSalary);
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ error: '更新工资失败' });
  }
}

export async function deleteSalary(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.salary.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ error: '删除工资失败' });
  }
}

async function calculateSalary(
  employeeId: string,
  year: number,
  month: number,
  inputData: Record<string, any>
): Promise<Omit<Prisma.SalaryCreateInput, 'employeeId' | 'year' | 'month' | 'status'>> {
  const [employee, attendance, rewardsPunishments] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.attendance.findUnique({
      where: { employeeId_year_month: { employeeId, year, month } },
    }),
    prisma.rewardPunishment.findMany({
      where: {
        employeeId,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
      },
    }),
  ]);

  const baseSalary = parseFloat(inputData.baseSalary) ?? employee?.baseSalary ?? 0;
  const performanceSalary = parseFloat(inputData.performanceSalary) ?? 0;
  const allowance = parseFloat(inputData.allowance) ?? 0;

  let bonus = parseFloat(inputData.bonus) ?? 0;
  for (const rp of rewardsPunishments) {
    if (rp.type === 'REWARD') {
      bonus += rp.amount;
    }
  }

  const overtimePay = calculateOvertimePay(baseSalary, attendance);

  const totalIncome = baseSalary + performanceSalary + allowance + bonus + overtimePay;

  const socialBase = Math.min(baseSalary, 30000);

  const housingFund = parseFloat(inputData.housingFund) ?? (socialBase * 0.12);
  const pension = parseFloat(inputData.pension) ?? (socialBase * 0.08);
  const medicalInsurance = parseFloat(inputData.medicalInsurance) ?? (socialBase * 0.02);
  const unemployment = parseFloat(inputData.unemployment) ?? (socialBase * 0.005);

  const attendanceDeduction = calculateAttendanceDeduction(baseSalary, attendance);

  let otherDeduction = parseFloat(inputData.otherDeduction) ?? 0;
  for (const rp of rewardsPunishments) {
    if (rp.type === 'PUNISHMENT') {
      otherDeduction += rp.amount;
    }
  }

  const totalDeductionBeforeTax = housingFund + pension + medicalInsurance + unemployment + attendanceDeduction + otherDeduction;
  const taxableIncome = totalIncome - totalDeductionBeforeTax - 5000;
  const tax = parseFloat(inputData.tax) ?? calculateTax(taxableIncome);

  const totalDeduction = totalDeductionBeforeTax + tax;
  const netSalary = totalIncome - totalDeduction;

  return {
    baseSalary,
    performanceSalary,
    allowance,
    bonus,
    overtimePay,
    housingFund,
    pension,
    medicalInsurance,
    unemployment,
    tax,
    otherDeduction,
    attendanceDeduction,
    totalIncome,
    totalDeduction,
    netSalary,
  };
}

function calculateOvertimePay(baseSalary: number, attendance: Attendance | null): number {
  if (!attendance) return 0;

  const dailyRate = baseSalary / 21.75;
  const hourlyRate = dailyRate / 8;

  const holidayOvertimePay = hourlyRate * attendance.overtimeHoliday * 3;
  const normalOvertimePay = hourlyRate * attendance.overtimeNormal * 1.5;

  return holidayOvertimePay + normalOvertimePay;
}

function calculateAttendanceDeduction(baseSalary: number, attendance: Attendance | null): number {
  if (!attendance) return 0;

  const dailyRate = baseSalary / 21.75;

  const absentDeduction = dailyRate * attendance.absentDays * 2;
  const personalLeaveDeduction = dailyRate * attendance.personalLeave;

  return absentDeduction + personalLeaveDeduction;
}

function calculateTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  if (taxableIncome <= 3000) return taxableIncome * 0.03;
  if (taxableIncome <= 12000) return taxableIncome * 0.1 - 210;
  if (taxableIncome <= 25000) return taxableIncome * 0.2 - 1410;
  if (taxableIncome <= 35000) return taxableIncome * 0.25 - 2660;
  if (taxableIncome <= 55000) return taxableIncome * 0.3 - 4410;
  if (taxableIncome <= 80000) return taxableIncome * 0.35 - 7160;
  return taxableIncome * 0.45 - 15160;
}

export async function batchCalculateSalary(req: Request, res: Response) {
  try {
    const { year, month } = req.body;

    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
    });

    const results: { employeeId: string; success: boolean; error?: string }[] = [];

    for (const emp of activeEmployees) {
      try {
        const existing = await prisma.salary.findUnique({
          where: {
            employeeId_year_month: {
              employeeId: emp.id,
              year,
              month,
            },
          },
        });

        if (existing) {
          results.push({ employeeId: emp.id, success: false, error: '工资已存在' });
          continue;
        }

        const salaryData = await calculateSalary(emp.id, year, month, {});

        await prisma.salary.create({
          data: {
            employeeId: emp.id,
            year,
            month,
            ...salaryData,
            status: 'DRAFT',
          },
        });

        results.push({ employeeId: emp.id, success: true });
      } catch (err) {
        results.push({ employeeId: emp.id, success: false, error: String(err) });
      }
    }

    res.json({
      total: activeEmployees.length,
      successCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch calculate salary error:', error);
    res.status(500).json({ error: '批量计算工资失败' });
  }
}

export async function getSalaryReport(req: Request, res: Response) {
  try {
    const { year, month, departmentId } = req.query;

    const where: Prisma.SalaryWhereInput = {
      year: parseInt(year as string, 10),
      month: parseInt(month as string, 10),
    };

    if (departmentId) {
      where.employee = { departmentId: departmentId as string };
    }

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    const stats = salaries.reduce(
      (acc, s) => ({
        count: acc.count + 1,
        totalBaseSalary: acc.totalBaseSalary + s.baseSalary,
        totalPerformanceSalary: acc.totalPerformanceSalary + s.performanceSalary,
        totalAllowance: acc.totalAllowance + s.allowance,
        totalBonus: acc.totalBonus + s.bonus,
        totalOvertimePay: acc.totalOvertimePay + s.overtimePay,
        totalIncome: acc.totalIncome + s.totalIncome,
        totalDeduction: acc.totalDeduction + s.totalDeduction,
        totalNetSalary: acc.totalNetSalary + s.netSalary,
      }),
      {
        count: 0,
        totalBaseSalary: 0,
        totalPerformanceSalary: 0,
        totalAllowance: 0,
        totalBonus: 0,
        totalOvertimePay: 0,
        totalIncome: 0,
        totalDeduction: 0,
        totalNetSalary: 0,
      }
    );

    res.json({
      year: parseInt(year as string, 10),
      month: parseInt(month as string, 10),
      departmentId: departmentId as string | undefined,
      data: salaries,
      summary: {
        totalEmployees: stats.count,
        totalBaseSalary: stats.totalBaseSalary,
        totalPerformanceSalary: stats.totalPerformanceSalary,
        totalAllowance: stats.totalAllowance,
        totalBonus: stats.totalBonus,
        totalOvertimePay: stats.totalOvertimePay,
        totalIncome: stats.totalIncome,
        totalDeduction: stats.totalDeduction,
        totalNetSalary: stats.totalNetSalary,
        avgNetSalary: stats.count > 0 ? stats.totalNetSalary / stats.count : 0,
      },
    });
  } catch (error) {
    console.error('Get salary report error:', error);
    res.status(500).json({ error: '获取工资报表失败' });
  }
}
