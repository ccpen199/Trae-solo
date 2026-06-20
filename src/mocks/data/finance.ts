import type { FinanceProduct, FinanceProductType, RiskLevel } from '@/types/entity';

const now = new Date().toISOString();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const financeProducts: Array<{
  name: string;
  type: FinanceProductType;
  expectedReturn: string;
  riskLevel: RiskLevel;
  minAmount: number;
  term: string;
  description: string;
  isRecommended?: boolean;
  provider: string;
}> = [
  {
    name: '安心养老保险A款',
    type: 'INSURANCE',
    expectedReturn: '3.5%',
    riskLevel: 'LOW',
    minAmount: 1000,
    term: '5年期',
    description: '专为社区居民设计的养老保险产品，保底收益，稳定增值，退休后可按月领取养老金。',
    isRecommended: true,
    provider: '中国人寿',
  },
  {
    name: '健康医疗保险B款',
    type: 'INSURANCE',
    expectedReturn: '2.8%',
    riskLevel: 'LOW',
    minAmount: 500,
    term: '1年期',
    description: '全面的医疗保障，覆盖住院、门诊、重疾等多种医疗费用，为您和家人的健康保驾护航。',
    provider: '平安保险',
  },
  {
    name: '财产保险-家财险',
    type: 'INSURANCE',
    expectedReturn: '2.0%',
    riskLevel: 'LOW',
    minAmount: 200,
    term: '1年期',
    description: '保障家庭财产安全，覆盖火灾、盗窃、水管爆裂等多种风险。',
    provider: '太平洋保险',
  },
  {
    name: '物业费用代扣服务',
    type: 'DEPOSIT',
    expectedReturn: '1.5%',
    riskLevel: 'LOW',
    minAmount: 100,
    term: '灵活',
    description: '便捷的物业费代扣服务，自动扣款，享受活期利息，省心省力。',
    provider: '建设银行',
  },
  {
    name: '稳健理财90天',
    type: 'FUND',
    expectedReturn: '4.2%',
    riskLevel: 'MEDIUM',
    minAmount: 10000,
    term: '90天',
    description: '中低风险理财产品，投资于优质债券和货币市场，收益稳定，流动性好。',
    isRecommended: true,
    provider: '招商银行',
  },
  {
    name: '增值理财180天',
    type: 'FUND',
    expectedReturn: '5.5%',
    riskLevel: 'MEDIUM',
    minAmount: 50000,
    term: '180天',
    description: '中等风险理财产品，配置优质债券和蓝筹股，追求稳健增值。',
    provider: '工商银行',
  },
  {
    name: '成长优选基金',
    type: 'FUND',
    expectedReturn: '8.0%',
    riskLevel: 'HIGH',
    minAmount: 1000,
    term: '灵活',
    description: '较高风险权益类基金，主要投资于成长型股票，适合追求高收益的投资者。',
    provider: '华夏基金',
  },
  {
    name: '社区消费贷款',
    type: 'LOAN',
    expectedReturn: '4.8%',
    riskLevel: 'MEDIUM',
    minAmount: 1000,
    term: '1-3年期',
    description: '为社区业主提供的便捷贷款服务，利率优惠，手续简便，满足消费需求。',
    provider: '农业银行',
  },
];

export const mockFinanceProducts: FinanceProduct[] = financeProducts.map((p, idx) => ({
  id: `fin_${(idx + 1).toString().padStart(3, '0')}`,
  name: p.name,
  type: p.type,
  description: p.description,
  expectedReturn: p.expectedReturn,
  riskLevel: p.riskLevel,
  minAmount: p.minAmount,
  term: p.term,
  imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=finance${idx + 1}`,
  isRecommended: p.isRecommended,
  provider: p.provider,
  createdAt: thirtyDaysAgo,
  updatedAt: now,
}));
