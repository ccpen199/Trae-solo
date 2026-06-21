import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse, generateId, calcInsurance } from '../utils';
import { mockTransactions, hospitals } from '../../shared/mockData';
import type { Transaction, TransactionType, TransactionStatus, CityCode, InsuranceType } from '../../shared/types';

const router = Router();

let transactions = [...mockTransactions];

router.get('/', (req: Request, res: Response) => {
  const { userId, type, status, page = 1, pageSize = 10 } = req.query;
  let filtered = [...transactions];
  if (userId) filtered = filtered.filter(t => t.userId === userId);
  if (type) filtered = filtered.filter(t => t.type === type);
  if (status) filtered = filtered.filter(t => t.status === status);
  filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tx = transactions.find(t => t.id === id);
  if (!tx) return res.json(sendResponse(null, '事务不存在', 404));
  res.json(sendResponse(tx));
});

router.post('/', (req: Request, res: Response) => {
  const { userId, type, title, cityCode, requestData } = req.body;
  if (!userId || !type || !cityCode) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const now = new Date().toISOString();
  const newTx: Transaction = {
    id: generateId('T'),
    userId,
    type: type as TransactionType,
    title: title || `新的事务申请`,
    status: 'SUBMITTED',
    cityCode: cityCode as CityCode,
    requestData,
    ipAddress: req.ip || '127.0.0.1',
    submittedAt: now,
    updatedAt: now,
    timeline: [{ status: 'SUBMITTED' as TransactionStatus, time: now, operator: '用户本人', comment: '申请已提交' }],
  };
  transactions.unshift(newTx);
  setTimeout(() => {
    const idx = transactions.findIndex(t => t.id === newTx.id);
    if (idx >= 0) {
      transactions[idx].status = 'AI_REVIEWING';
      transactions[idx].updatedAt = new Date().toISOString();
      transactions[idx].timeline.push({
        status: 'AI_REVIEWING',
        time: new Date().toISOString(),
        operator: '系统AI',
        comment: '自动审核中',
      });
    }
  }, 1500);
  res.json(sendResponse(newTx));
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = transactions.findIndex(t => t.id === id);
  if (idx < 0) return res.json(sendResponse(null, '事务不存在', 404));
  const { title, requestData } = req.body;
  if (title) transactions[idx].title = title;
  if (requestData) transactions[idx].requestData = requestData;
  transactions[idx].updatedAt = new Date().toISOString();
  res.json(sendResponse(transactions[idx]));
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = transactions.findIndex(t => t.id === id);
  if (idx < 0) return res.json(sendResponse(null, '事务不存在', 404));
  transactions.splice(idx, 1);
  res.json(sendResponse({ success: true, deletedId: id }));
});

router.post('/supplementary-pay', (req: Request, res: Response) => {
  const { userId, cityCode, months, baseAmount, selectedItems } = req.body;
  if (!userId || !cityCode || !months?.length || !baseAmount) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const calc = calcInsurance(cityCode as CityCode, baseAmount, selectedItems || [
    'PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY'
  ] as InsuranceType[]);
  const principal = Number((calc.grandTotal * months.length).toFixed(2));
  const lateFee = Number((principal * 0.0005 * (months.length * 30)).toFixed(2));
  const total = Number((principal + lateFee).toFixed(2));
  const now = new Date().toISOString();
  const newTx: Transaction = {
    id: generateId('T'),
    userId,
    type: 'SUPPLEMENTARY_PAY',
    title: `${months[0]}至${months[months.length - 1]}社保补缴`,
    status: 'SUBMITTED',
    cityCode: cityCode as CityCode,
    requestData: { months, baseAmount, selectedItems },
    resultData: { principal, lateFee, total, monthlyBreakdown: calc },
    ipAddress: req.ip || '127.0.0.1',
    submittedAt: now,
    updatedAt: now,
    timeline: [{ status: 'SUBMITTED' as TransactionStatus, time: now, operator: '用户本人', comment: '补缴申请已提交' }],
  };
  transactions.unshift(newTx);
  res.json(sendResponse(newTx));
});

router.post('/base-adjustment', (req: Request, res: Response) => {
  const { userId, cityCode, effectiveMonth, newBase, oldBase, reason, selectedItems, housingFundPercent } = req.body;
  if (!userId || !cityCode || !effectiveMonth || !newBase || !oldBase) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const items = selectedItems || ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'] as InsuranceType[];
  const oldCalc = calcInsurance(cityCode as CityCode, oldBase, items, housingFundPercent);
  const newCalc = calcInsurance(cityCode as CityCode, newBase, items, housingFundPercent);
  const personalDifference = Number((newCalc.personalTotal - oldCalc.personalTotal).toFixed(2));
  const companyDifference = Number((newCalc.companyTotal - oldCalc.companyTotal).toFixed(2));
  const now = new Date().toISOString();
  const needManual = Math.abs(newBase - oldBase) / oldBase > 0.5;
  const newTx: Transaction = {
    id: generateId('T'),
    userId,
    type: 'BASE_ADJUSTMENT',
    title: `缴费基数由${oldBase}调整至${newBase}`,
    status: needManual ? 'MANUAL_REVIEWING' : 'AI_REVIEWING',
    cityCode: cityCode as CityCode,
    requestData: { effectiveMonth, newBase, oldBase, reason },
    resultData: { personalDifference, companyDifference, oldCalc, newCalc },
    ipAddress: req.ip || '127.0.0.1',
    submittedAt: now,
    updatedAt: now,
    timeline: [{
      status: needManual ? 'MANUAL_REVIEWING' : 'AI_REVIEWING' as TransactionStatus,
      time: now,
      operator: needManual ? '审核专员·系统' : '系统AI',
      comment: needManual ? '调整幅度超50%需人工复核' : '自动审核中',
    }],
  };
  transactions.unshift(newTx);
  res.json(sendResponse(newTx));
});

router.post('/hospital-change', (req: Request, res: Response) => {
  const { userId, cityCode, addHospitalIds, removeHospitalIds } = req.body;
  if (!userId || !cityCode) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const cityHospitals = hospitals[cityCode as CityCode] || [];
  const added = cityHospitals.filter(h => addHospitalIds?.includes(h.id));
  const removed = cityHospitals.filter(h => removeHospitalIds?.includes(h.id));
  const now = new Date().toISOString();
  const newTx: Transaction = {
    id: generateId('T'),
    userId,
    type: 'HOSPITAL_CHANGE',
    title: `定点医院变更${added.length ? '：新增' + added.map(h => h.name).join('、') : ''}`,
    status: 'AI_REVIEWING',
    cityCode: cityCode as CityCode,
    requestData: { addHospitalIds, removeHospitalIds, added, removed },
    ipAddress: req.ip || '127.0.0.1',
    submittedAt: now,
    updatedAt: now,
    timeline: [{ status: 'AI_REVIEWING' as TransactionStatus, time: now, operator: '系统AI' }],
  };
  transactions.unshift(newTx);
  res.json(sendResponse(newTx));
});

router.post('/transfer', (req: Request, res: Response) => {
  const { userId, fromCity, toCity, transferTypes } = req.body;
  if (!userId || !fromCity || !toCity) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const now = new Date().toISOString();
  const newTx: Transaction = {
    id: generateId('T'),
    userId,
    type: 'TRANSFER',
    title: `社保转移接续（${fromCity}→${toCity}）`,
    status: 'MANUAL_REVIEWING',
    cityCode: toCity as CityCode,
    requestData: { fromCity, toCity, transferTypes: transferTypes || ['PENSION', 'MEDICAL'] },
    ipAddress: req.ip || '127.0.0.1',
    submittedAt: now,
    updatedAt: now,
    timeline: [{ status: 'MANUAL_REVIEWING' as TransactionStatus, time: now, operator: '审核专员·系统', comment: '转移材料初审中' }],
  };
  transactions.unshift(newTx);
  res.json(sendResponse(newTx));
});

router.get('/hospitals/:cityCode', (req: Request, res: Response) => {
  const { cityCode } = req.params;
  const { keyword, level } = req.query;
  const list = hospitals[cityCode as CityCode] || [];
  let filtered = list;
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    filtered = filtered.filter(h => h.name.toLowerCase().includes(kw) || h.address.toLowerCase().includes(kw));
  }
  if (level) filtered = filtered.filter(h => h.level === level);
  res.json(sendResponse(filtered));
});

export default router;
