import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse, generateId, calcInsurance, calcIndividualTax, THRESHOLD } from '../utils';
import { mockEmployees } from '../../shared/mockData';
import type { Employee, SalaryItem, PayrollBatch, CityCode, InsuranceType } from '../../shared/types';

const router = Router();

let employees = [...mockEmployees];
let payrollBatches: PayrollBatch[] = [];

router.get('/employees', (req: Request, res: Response) => {
  const { department, status, cityCode, keyword, page = 1, pageSize = 20 } = req.query;
  let filtered = [...employees];
  if (department && department !== 'ALL') filtered = filtered.filter(e => e.department === department);
  if (status && status !== 'ALL') filtered = filtered.filter(e => e.status === status);
  if (cityCode && cityCode !== 'ALL') filtered = filtered.filter(e => e.cityCode === cityCode);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(kw) ||
      e.employeeNo.toLowerCase().includes(kw) ||
      e.phone.includes(kw)
    );
  }
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
    stats: {
      total: employees.length,
      insured: employees.filter(e => e.status === 'INSURED').length,
      suspended: employees.filter(e => e.status === 'SUSPENDED').length,
      departments: [...new Set(employees.map(e => e.department))],
    },
  }));
});

router.get('/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const emp = employees.find(e => e.id === id || e.employeeNo === id);
  if (!emp) return res.json(sendResponse(null, '员工不存在', 404));
  res.json(sendResponse(emp));
});

router.post('/employees', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.idNumber || !data.cityCode) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const newEmp: Employee = {
    id: generateId('E'),
    employeeNo: 'EMP' + String(employees.length + 1).padStart(3, '0'),
    name: data.name,
    idNumber: data.idNumber,
    phone: data.phone || '138****0000',
    department: data.department || '未分配',
    position: data.position || '员工',
    cityCode: data.cityCode as CityCode,
    insuranceBase: data.insuranceBase || 8000,
    housingFundBase: data.housingFundBase || data.insuranceBase || 8000,
    housingFundPercent: data.housingFundPercent ?? 12,
    selectedItems: data.selectedItems || (['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'] as InsuranceType[]),
    status: data.status || 'ONBOARD',
    entryDate: data.entryDate || new Date().toISOString().slice(0, 10),
    taxDeductions: data.taxDeductions || [],
  };
  employees.unshift(newEmp);
  res.json(sendResponse(newEmp));
});

router.put('/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = employees.findIndex(e => e.id === id);
  if (idx < 0) return res.json(sendResponse(null, '员工不存在', 404));
  employees[idx] = { ...employees[idx], ...req.body };
  res.json(sendResponse(employees[idx]));
});

router.delete('/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = employees.findIndex(e => e.id === id);
  if (idx < 0) return res.json(sendResponse(null, '员工不存在', 404));
  employees.splice(idx, 1);
  res.json(sendResponse({ success: true, deletedId: id }));
});

router.post('/salary/calc', (req: Request, res: Response) => {
  const { employeeId, baseSalary, bonus = 0, allowance = 0 } = req.body;
  if (!employeeId && !baseSalary) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const emp = employeeId ? employees.find(e => e.id === employeeId) : null;
  if (employeeId && !emp) return res.json(sendResponse(null, '员工不存在', 404));
  const cityCode = emp?.cityCode || (req.body.cityCode as CityCode) || 'BJ';
  const insuranceBase = emp?.insuranceBase || baseSalary;
  const hfPercent = emp?.housingFundPercent ?? req.body.housingFundPercent ?? 12;
  const items = emp?.selectedItems || (['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'] as InsuranceType[]);
  const taxDeductions = emp?.taxDeductions || req.body.taxDeductions || [];
  const totalPay = Number((Number(baseSalary) + Number(bonus) + Number(allowance)).toFixed(2));
  const insCalc = calcInsurance(cityCode, insuranceBase, items.filter(i => i !== 'HOUSING_FUND'));
  const hfCalc = items.includes('HOUSING_FUND') ? calcInsurance(cityCode, emp?.housingFundBase || insuranceBase, ['HOUSING_FUND'], hfPercent) : null;
  const personalInsurance = insCalc.personalTotal;
  const personalHousingFund = hfCalc?.personalTotal || 0;
  const taxDeductionTotal = taxDeductions.reduce((s, d) => s + d.monthlyAmount, 0);
  const taxableIncome = Math.max(0, totalPay - personalInsurance - personalHousingFund - THRESHOLD - taxDeductionTotal);
  const individualTax = calcIndividualTax(taxableIncome);
  const netSalary = Number((totalPay - personalInsurance - personalHousingFund - individualTax).toFixed(2));
  const item: SalaryItem = {
    employeeId: emp?.id || 'CALC',
    employeeNo: emp?.employeeNo || 'CALC',
    name: emp?.name || '测算员工',
    department: emp?.department || '-',
    baseSalary: Number(baseSalary),
    bonus: Number(bonus),
    allowance: Number(allowance),
    totalPay,
    personalInsurance: Number(personalInsurance.toFixed(2)),
    personalHousingFund: Number(personalHousingFund.toFixed(2)),
    taxDeductionTotal,
    taxableIncome: Number(taxableIncome.toFixed(2)),
    individualTax,
    netSalary,
  };
  res.json(sendResponse({ item, insuranceBreakdown: insCalc, housingFundBreakdown: hfCalc }));
});

router.get('/payroll-batches', (req: Request, res: Response) => {
  const { status, month, page = 1, pageSize = 10 } = req.query;
  let filtered = [...payrollBatches];
  if (status) filtered = filtered.filter(b => b.status === status);
  if (month) filtered = filtered.filter(b => b.month === month);
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.get('/payroll-batches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const batch = payrollBatches.find(b => b.id === id || b.batchNo === id);
  if (!batch) return res.json(sendResponse(null, '批次不存在', 404));
  res.json(sendResponse(batch));
});

router.post('/payroll-batches', (req: Request, res: Response) => {
  const { month, employeeIds, bonusMap = {}, allowanceMap = {} } = req.body;
  if (!month) return res.json(sendResponse(null, '月份不能为空', 400));
  const targetEmps = employeeIds?.length
    ? employees.filter(e => employeeIds.includes(e.id))
    : employees.filter(e => e.status === 'INSURED' || e.status === 'ONBOARD');
  const items: SalaryItem[] = targetEmps.map(emp => {
    const baseSalary = emp.insuranceBase;
    const bonus = bonusMap[emp.id] || 0;
    const allowance = allowanceMap[emp.id] || 0;
    const totalPay = Number((baseSalary + bonus + allowance).toFixed(2));
    const items = emp.selectedItems;
    const hfItems = items.filter(i => i !== 'HOUSING_FUND');
    const insCalc = calcInsurance(emp.cityCode, emp.insuranceBase, hfItems);
    const hfCalc = items.includes('HOUSING_FUND')
      ? calcInsurance(emp.cityCode, emp.housingFundBase, ['HOUSING_FUND'], emp.housingFundPercent)
      : null;
    const personalInsurance = insCalc.personalTotal;
    const personalHousingFund = hfCalc?.personalTotal || 0;
    const taxDeductionTotal = emp.taxDeductions.reduce((s, d) => s + d.monthlyAmount, 0);
    const taxableIncome = Math.max(0, totalPay - personalInsurance - personalHousingFund - THRESHOLD - taxDeductionTotal);
    const individualTax = calcIndividualTax(taxableIncome);
    return {
      employeeId: emp.id,
      employeeNo: emp.employeeNo,
      name: emp.name,
      department: emp.department,
      baseSalary,
      bonus,
      allowance,
      totalPay,
      personalInsurance: Number(personalInsurance.toFixed(2)),
      personalHousingFund: Number(personalHousingFund.toFixed(2)),
      taxDeductionTotal,
      taxableIncome: Number(taxableIncome.toFixed(2)),
      individualTax,
      netSalary: Number((totalPay - personalInsurance - personalHousingFund - individualTax).toFixed(2)),
    };
  });
  const totalAmount = Number(items.reduce((s, i) => s + i.totalPay, 0).toFixed(2));
  const now = new Date().toISOString();
  const batch: PayrollBatch = {
    id: generateId('PB'),
    batchNo: `PAY${month.replace(/-/g, '')}${String(payrollBatches.length + 1).padStart(3, '0')}`,
    month,
    items,
    totalCount: items.length,
    totalAmount,
    status: 'DRAFT',
    createdAt: now,
  };
  payrollBatches.unshift(batch);
  res.json(sendResponse(batch));
});

router.put('/payroll-batches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = payrollBatches.findIndex(b => b.id === id);
  if (idx < 0) return res.json(sendResponse(null, '批次不存在', 404));
  const { status } = req.body;
  if (status) {
    payrollBatches[idx].status = status as PayrollBatch['status'];
    if (status === 'SUBMITTED') {
      payrollBatches[idx].submittedAt = new Date().toISOString();
    }
  }
  payrollBatches[idx] = { ...payrollBatches[idx], ...req.body, status: status || payrollBatches[idx].status };
  res.json(sendResponse(payrollBatches[idx]));
});

router.post('/tax-file/generate', (req: Request, res: Response) => {
  const { batchId } = req.body;
  const batch = batchId ? payrollBatches.find(b => b.id === batchId) : payrollBatches[0];
  if (!batch) return res.json(sendResponse(null, '批次不存在', 404));
  const lines: string[] = [];
  lines.push('姓名,证件号码,收入额,基本养老保险费,基本医疗保险费,失业保险费,住房公积金,累计专项附加扣除,应纳税所得额,应纳税额');
  for (const item of batch.items) {
    const emp = employees.find(e => e.id === item.employeeId);
    lines.push([
      item.name,
      emp?.idNumber || '000000000000000000',
      item.totalPay,
      (item.personalInsurance * 0.62).toFixed(2),
      (item.personalInsurance * 0.35).toFixed(2),
      (item.personalInsurance * 0.03).toFixed(2),
      item.personalHousingFund,
      item.taxDeductionTotal,
      item.taxableIncome,
      item.individualTax,
    ].join(','));
  }
  const csv = lines.join('\n');
  res.json(sendResponse({
    fileName: `个税申报_${batch.month}_${batch.batchNo}.csv`,
    fileSize: csv.length,
    downloadUrl: '#',
    preview: lines.slice(0, 6).join('\n'),
    summary: {
      totalPeople: batch.totalCount,
      totalTax: Number(batch.items.reduce((s, i) => s + i.individualTax, 0).toFixed(2)),
      totalTaxableIncome: Number(batch.items.reduce((s, i) => s + i.taxableIncome, 0).toFixed(2)),
    },
    csvContent: csv,
  }));
});

export default router;
