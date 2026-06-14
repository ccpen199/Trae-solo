import type {
  InsuranceType,
  QueryRange,
  AccountBalance,
  PaymentDetail,
  BenefitRecord,
  CompareChartData,
  PaginatedResponse,
} from '@gx-rs/shared';
import dayjs from 'dayjs';

const insuranceConfigs: Record<InsuranceType, {
  personalRate: number;
  companyRate: number;
  baseRange: [number, number];
  benefitItems: string[];
}> = {
  PENSION: {
    personalRate: 0.08,
    companyRate: 0.16,
    baseRange: [3863, 19317],
    benefitItems: ['基本养老金', '过渡性养老金', '个人账户养老金'],
  },
  UNEMPLOYMENT: {
    personalRate: 0.005,
    companyRate: 0.005,
    baseRange: [3863, 19317],
    benefitItems: ['失业保险金', '职业技能提升补贴'],
  },
  INJURY: {
    personalRate: 0,
    companyRate: 0.02,
    baseRange: [3863, 19317],
    benefitItems: ['一次性伤残补助金', '伤残津贴', '工伤医疗待遇'],
  },
  MATERNITY: {
    personalRate: 0,
    companyRate: 0.008,
    baseRange: [3863, 19317],
    benefitItems: ['生育津贴', '产前检查费', '生育医疗费用'],
  },
};

const userBaseMap: Record<string, number> = {
  USR001: 6500,
  USR002: 5800,
  USR003: 7200,
  USR004: 4500,
  USR005: 8200,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generatePayments(
  userId: string,
  type: InsuranceType,
  range: QueryRange = 'MONTHLY',
): PaymentDetail[] {
  const config = insuranceConfigs[type];
  const base = userBaseMap[userId] || 5500;
  const details: PaymentDetail[] = [];
  const count = range === 'MONTHLY' ? 24 : range === 'QUARTERLY' ? 12 : 5;
  const step = range === 'MONTHLY' ? 1 : range === 'QUARTERLY' ? 3 : 12;
  const unit = range === 'YEARLY' ? 'year' : 'month';

  for (let i = 0; i < count; i++) {
    const date = dayjs().subtract((count - 1 - i) * step, unit);
    const period = range === 'YEARLY'
      ? date.format('YYYY') + '年度'
      : range === 'QUARTERLY'
        ? `${date.format('YYYY')}Q${Math.ceil((date.month() + 1) / 3)}`
        : date.format('YYYY-MM');
    const fluctuation = 1 + (seededRandom(i * 7 + base % 100 + type.length) - 0.5) * 0.08;
    const paymentBase = Math.round(base * fluctuation);
    const personalAmount = Math.round(paymentBase * config.personalRate * 100) / 100;
    const companyAmount = Math.round(paymentBase * config.companyRate * 100) / 100;
    const totalAmount = Math.round((personalAmount + companyAmount) * 100) / 100;

    let status: PaymentDetail['status'] = 'PAID';
    if (i === Math.floor(count * 0.7) && seededRandom(i * 3 + 1) > 0.75) status = 'ARREARS';
    if (i === Math.floor(count * 0.9) && type === 'UNEMPLOYMENT' && seededRandom(i * 5) > 0.85) status = 'UNPAID';

    details.push({
      period,
      paymentBase,
      personalAmount,
      companyAmount,
      totalAmount,
      status,
    });
  }

  return details;
}

function generateBalance(
  userId: string,
  type: InsuranceType,
): AccountBalance {
  const config = insuranceConfigs[type];
  const base = userBaseMap[userId] || 5500;
  const months = type === 'PENSION' ? 180 : 60;
  const personalAccount = Math.round(base * config.personalRate * months * 100) / 100;
  const pooledAccount = Math.round(base * config.companyRate * months * 1.2 * 100) / 100;
  const cumulativeMonths = type === 'PENSION' ? 180 : type === 'UNEMPLOYMENT' ? 84 : 36;

  return {
    insuranceType: type,
    personalAccount,
    pooledAccount,
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    cumulativeMonths,
  };
}

function generateBenefits(
  userId: string,
  type: InsuranceType,
): BenefitRecord[] {
  const records: BenefitRecord[] = [];
  const base = userBaseMap[userId] || 5500;

  if (type === 'PENSION') {
    for (let i = 0; i < 12; i++) {
      const date = dayjs().subtract(11 - i, 'month').date(15);
      const items = ['基本养老金', '过渡性调节金', '个人账户养老金'];
      items.forEach((item, idx) => {
        let amount: number;
        if (idx === 0) amount = Math.round((base * 0.45 + 1200) * 100) / 100;
        else if (idx === 1) amount = Math.round((base * 0.12) * 100) / 100;
        else amount = Math.round((base * 0.08 * 12) * 100) / 100;

        records.push({
          issueDate: date.format('YYYY-MM-DD'),
          itemName: item,
          amount,
          bankAccountMasked: '6228 **** **** 5678',
          status: i < 11 ? 'ISSUED' : (i === 11 ? 'ISSUED' : 'PENDING'),
          period: date.format('YYYY-MM'),
        });
      });
    }
  } else if (type === 'UNEMPLOYMENT') {
    for (let i = 0; i < 6; i++) {
      const date = dayjs().subtract(5 - i, 'month').date(20);
      records.push({
        issueDate: date.format('YYYY-MM-DD'),
        itemName: '失业保险金',
        amount: Math.round(1890 * 100) / 100,
        bankAccountMasked: '6228 **** **** 5678',
        status: i < 5 ? 'ISSUED' : 'PENDING',
        period: date.format('YYYY-MM'),
      });
    }
    records.push({
      issueDate: dayjs().subtract(2, 'month').date(10).format('YYYY-MM-DD'),
      itemName: '职业技能提升补贴',
      amount: 1500,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
  } else if (type === 'INJURY') {
    records.push({
      issueDate: dayjs().subtract(3, 'month').date(5).format('YYYY-MM-DD'),
      itemName: '一次性伤残补助金',
      amount: Math.round(base * 7 * 100) / 100,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
    records.push({
      issueDate: dayjs().subtract(2, 'month').date(15).format('YYYY-MM-DD'),
      itemName: '伤残津贴（按月）',
      amount: Math.round(base * 0.6 * 100) / 100,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
  } else if (type === 'MATERNITY') {
    records.push({
      issueDate: dayjs().subtract(2, 'month').date(8).format('YYYY-MM-DD'),
      itemName: '生育津贴',
      amount: Math.round(base * 5.3 * 100) / 100,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
    records.push({
      issueDate: dayjs().subtract(2, 'month').date(8).format('YYYY-MM-DD'),
      itemName: '产前检查费报销',
      amount: 1500,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
    records.push({
      issueDate: dayjs().subtract(1, 'month').date(12).format('YYYY-MM-DD'),
      itemName: '生育医疗费用报销',
      amount: 3800,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
  }

  return records;
}

function generateCompareData(
  userId: string,
  type: InsuranceType,
  year: number,
): CompareChartData[] {
  const config = insuranceConfigs[type];
  const base = userBaseMap[userId] || 5500;
  const data: CompareChartData[] = [];
  const baseYear = year;

  for (let i = 0; i < 12; i++) {
    const month = i + 1;
    const period = `${baseYear}-${month.toString().padStart(2, '0')}`;
    const baseMultiplier = 1 + (i - 6) * 0.008;
    const currentValue = Math.round(base * baseMultiplier * (config.personalRate + config.companyRate) * 100) / 100;
    const yoyValue = Math.round(currentValue * (1 + (seededRandom(i * 13 + 7 + base) - 0.42) * 0.12) * 100) / 100;
    const momValue = i === 0
      ? Math.round(currentValue * 0.98 * 100) / 100
      : data[i - 1].currentValue;
    const yoyChange = Math.round(((currentValue - yoyValue) / yoyValue) * 1000) / 10;
    const momChange = Math.round(((currentValue - momValue) / momValue) * 1000) / 10;

    data.push({
      period,
      currentValue,
      yoyValue,
      momValue,
      yoyChange,
      momChange,
    });
  }

  return data;
}

export function getAccountBalance(userId: string, type: InsuranceType): AccountBalance {
  return generateBalance(userId, type);
}

export function getPaymentDetails(
  userId: string,
  type: InsuranceType,
  range: QueryRange = 'MONTHLY',
  page: number = 1,
  size: number = 10,
): PaginatedResponse<PaymentDetail> {
  const all = generatePayments(userId, type, range);
  const start = (page - 1) * size;
  const list = all.slice(start, start + size);
  const paidCount = list.filter((p) => p.status === 'PAID').length;
  const arrearsCount = list.filter((p) => p.status === 'ARREARS').length;
  const totalPersonal = list.reduce((s, p) => s + p.personalAmount, 0);
  const totalCompany = list.reduce((s, p) => s + p.companyAmount, 0);

  return {
    list,
    total: all.length,
    page,
    pageSize: size,
    summary: {
      paidCount,
      arrearsCount,
      unpaidCount: list.length - paidCount - arrearsCount,
      totalPersonal: Math.round(totalPersonal * 100) / 100,
      totalCompany: Math.round(totalCompany * 100) / 100,
      grandTotal: Math.round((totalPersonal + totalCompany) * 100) / 100,
    },
  };
}

export function getBenefitRecords(
  userId: string,
  type: InsuranceType,
  page: number = 1,
  size: number = 10,
): PaginatedResponse<BenefitRecord> {
  const all = generateBenefits(userId, type);
  const start = (page - 1) * size;
  const list = all.slice(start, start + size);
  const totalAmount = list.reduce((s, b) => s + b.amount, 0);

  return {
    list,
    total: all.length,
    page,
    pageSize: size,
    summary: {
      issuedCount: list.filter((b) => b.status === 'ISSUED').length,
      pendingCount: list.filter((b) => b.status === 'PENDING').length,
      failedCount: list.filter((b) => b.status === 'FAILED').length,
      totalAmount: Math.round(totalAmount * 100) / 100,
    },
  };
}

export function getCompareData(
  userId: string,
  type: InsuranceType,
  year: number,
): CompareChartData[] {
  return generateCompareData(userId, type, year);
}
