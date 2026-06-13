import type {
  InsuranceType,
  AccountBalance,
  PaymentDetail,
  BenefitRecord,
  CompareChartData,
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
    benefitItems: ['失业保险金'],
  },
  INJURY: {
    personalRate: 0,
    companyRate: 0.02,
    baseRange: [3863, 19317],
    benefitItems: ['一次性伤残补助金', '伤残津贴'],
  },
  MATERNITY: {
    personalRate: 0,
    companyRate: 0.008,
    baseRange: [3863, 19317],
    benefitItems: ['生育津贴', '产前检查费'],
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
): PaymentDetail[] {
  const config = insuranceConfigs[type];
  const base = userBaseMap[userId] || 5500;
  const details: PaymentDetail[] = [];

  for (let i = 0; i < 12; i++) {
    const date = dayjs().subtract(11 - i, 'month');
    const period = date.format('YYYY-MM');
    const fluctuation = 1 + (seededRandom(i * 7 + base % 100) - 0.5) * 0.06;
    const paymentBase = Math.round(base * fluctuation);
    const personalAmount = Math.round(paymentBase * config.personalRate * 100) / 100;
    const companyAmount = Math.round(paymentBase * config.companyRate * 100) / 100;
    const totalAmount = Math.round((personalAmount + companyAmount) * 100) / 100;

    let status: PaymentDetail['status'] = 'PAID';
    if (i === 8 && seededRandom(i * 3 + 1) > 0.7) status = 'ARREARS';
    if (i === 10 && type === 'UNEMPLOYMENT' && seededRandom(i * 5) > 0.8) status = 'UNPAID';

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

  return {
    insuranceType: type,
    personalAccount,
    pooledAccount,
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
}

function generateBenefits(
  userId: string,
  type: InsuranceType,
): BenefitRecord[] {
  const config = insuranceConfigs[type];
  const records: BenefitRecord[] = [];
  const base = userBaseMap[userId] || 5500;

  if (type === 'PENSION') {
    for (let i = 0; i < 12; i++) {
      const date = dayjs().subtract(11 - i, 'month');
      config.benefitItems.forEach((item, idx) => {
        let amount: number;
        if (idx === 0) amount = Math.round((base * 0.45 + 1200) * 100) / 100;
        else if (idx === 1) amount = Math.round((base * 0.12) * 100) / 100;
        else amount = Math.round((base * 0.08 * 12) * 100) / 100;

        records.push({
          issueDate: date.format('YYYY-MM-DD'),
          itemName: item,
          amount,
          bankAccountMasked: '6228 **** **** 5678',
          status: i < 11 ? 'ISSUED' : 'PENDING',
        });
      });
    }
  } else if (type === 'UNEMPLOYMENT') {
    for (let i = 0; i < 6; i++) {
      const date = dayjs().subtract(5 - i, 'month');
      records.push({
        issueDate: date.format('YYYY-MM-DD'),
        itemName: '失业保险金',
        amount: Math.round(1890 * 100) / 100,
        bankAccountMasked: '6228 **** **** 5678',
        status: i < 5 ? 'ISSUED' : 'PENDING',
      });
    }
  } else if (type === 'INJURY') {
    records.push({
      issueDate: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
      itemName: '一次性伤残补助金',
      amount: Math.round(base * 7 * 100) / 100,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
  } else if (type === 'MATERNITY') {
    records.push({
      issueDate: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      itemName: '生育津贴',
      amount: Math.round(base * 5.3 * 100) / 100,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
    records.push({
      issueDate: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      itemName: '产前检查费',
      amount: 1500,
      bankAccountMasked: '6228 **** **** 5678',
      status: 'ISSUED',
    });
  }

  return records;
}

function generateCompareData(
  userId: string,
  type: InsuranceType,
): CompareChartData[] {
  const config = insuranceConfigs[type];
  const base = userBaseMap[userId] || 5500;
  const data: CompareChartData[] = [];

  for (let i = 0; i < 12; i++) {
    const date = dayjs().subtract(11 - i, 'month');
    const period = date.format('YYYY-MM');
    const currentValue = Math.round(base * (config.personalRate + config.companyRate) * 100) / 100;
    const yoyValue = Math.round(currentValue * (1 + (seededRandom(i * 13 + 7) - 0.4) * 0.1) * 100) / 100;
    const momValue = Math.round(currentValue * (1 + (seededRandom(i * 17 + 3) - 0.5) * 0.06) * 100) / 100;
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
  page: number = 1,
  size: number = 10,
): { list: PaymentDetail[]; total: number } {
  const all = generatePayments(userId, type);
  const start = (page - 1) * size;
  return {
    list: all.slice(start, start + size),
    total: all.length,
  };
}

export function getBenefitRecords(userId: string, type: InsuranceType): BenefitRecord[] {
  return generateBenefits(userId, type);
}

export function getCompareData(userId: string, type: InsuranceType): CompareChartData[] {
  return generateCompareData(userId, type);
}
