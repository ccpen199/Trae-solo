import { CalculatorResult, CalculatorType } from '@/types';

type CourtCaseType = 'property' | 'divorce' | 'labor' | 'intellectual' | 'other';

export function calculateCourtFee(amount: number, caseType: CourtCaseType): CalculatorResult {
  let fee = 0;
  const breakdown: { label: string; amount: number }[] = [];
  let formula = '';
  const legalBasis = ['《诉讼费用交纳办法》第十三条', '《诉讼费用交纳办法》第十四条'];

  if (caseType === 'property') {
    const brackets = [
      { limit: 10000, rate: 50, base: 0, label: '不超过1万元' },
      { limit: 100000, rate: 0.025, base: 50, label: '超过1万至10万元' },
      { limit: 200000, rate: 0.02, base: 2300, label: '超过10万至20万元' },
      { limit: 500000, rate: 0.015, base: 4300, label: '超过20万至50万元' },
      { limit: 1000000, rate: 0.01, base: 8800, label: '超过50万至100万元' },
      { limit: 2000000, rate: 0.009, base: 13800, label: '超过100万至200万元' },
      { limit: 5000000, rate: 0.008, base: 22800, label: '超过200万至500万元' },
      { limit: 10000000, rate: 0.007, base: 46800, label: '超过500万至1000万元' },
      { limit: 20000000, rate: 0.006, base: 81800, label: '超过1000万至2000万元' },
      { limit: Infinity, rate: 0.005, base: 141800, label: '超过2000万元' },
    ];

    let remaining = amount;
    let prevLimit = 0;

    for (const bracket of brackets) {
      if (remaining <= 0) break;
      
      if (amount <= bracket.limit) {
        const segmentAmount = amount - prevLimit;
        if (bracket.rate === 50 && bracket.base === 0) {
          fee = 50;
          breakdown.push({ label: bracket.label, amount: 50 });
        } else {
          const segmentFee = segmentAmount * bracket.rate;
          fee = bracket.base + segmentFee;
          breakdown.push({ label: bracket.label, amount: Math.round(segmentFee * 100) / 100 });
        }
        break;
      } else {
        const segmentAmount = bracket.limit - prevLimit;
        if (bracket.rate === 50 && bracket.base === 0) {
          breakdown.push({ label: bracket.label, amount: 50 });
        } else {
          const segmentFee = segmentAmount * bracket.rate;
          breakdown.push({ label: bracket.label, amount: Math.round(segmentFee * 100) / 100 });
        }
        remaining = amount - bracket.limit;
        prevLimit = bracket.limit;
      }
    }

    formula = '财产案件受理费 = 分段累计计算';
  } else if (caseType === 'divorce') {
    if (amount <= 200000) {
      fee = 300;
      breakdown.push({ label: '离婚案件受理费', amount: 300 });
      formula = '离婚案件每件交纳50元至300元，财产总额不超过20万元的，不另行交纳';
    } else {
      const propertyFee = (amount - 200000) * 0.005;
      fee = 300 + propertyFee;
      breakdown.push({ label: '基础受理费', amount: 300 });
      breakdown.push({ label: '财产分割费（超过20万元部分）', amount: Math.round(propertyFee * 100) / 100 });
      formula = '离婚案件 = 300元 + (财产总额 - 20万元) × 0.5%';
    }
  } else if (caseType === 'labor') {
    fee = 10;
    breakdown.push({ label: '劳动争议案件受理费', amount: 10 });
    formula = '劳动争议案件每件交纳10元';
  } else if (caseType === 'intellectual') {
    if (amount === 0) {
      fee = 1000;
      breakdown.push({ label: '知识产权案件受理费', amount: 1000 });
      formula = '知识产权民事案件，没有争议金额的，每件交纳500元至1000元';
    } else {
      fee = calculateCourtFee(amount, 'property').result.total;
      breakdown.push({ label: '按财产案件标准计算', amount: Math.round(fee * 100) / 100 });
      formula = '有争议金额的，按照财产案件的标准交纳';
    }
  } else {
    fee = 100;
    breakdown.push({ label: '其他非财产案件受理费', amount: 100 });
    formula = '其他非财产案件每件交纳50元至100元';
  }

  return {
    type: 'court_fee',
    inputs: { amount, caseType },
    result: {
      total: Math.round(fee * 100) / 100,
      breakdown,
      formula,
      legalBasis,
    },
  };
}

export function calculateInjuryCompensation(
  level: number,
  salary: number,
  medicalExpenses: number,
  hospitalDays: number,
  region: string
): CalculatorResult {
  const breakdown: { label: string; amount: number }[] = [];
  const monthlyRatio = [27, 25, 23, 21, 18, 16, 13, 11, 9, 7];
  const ratio = monthlyRatio[level - 1] || 0;
  const lumpSum = salary * ratio;
  let medicalSubsidy = 0;
  let employmentSubsidy = 0;

  if (level >= 1 && level <= 4) {
    medicalSubsidy = 0;
    employmentSubsidy = 0;
  } else if (level >= 5 && level <= 6) {
    medicalSubsidy = salary * (level === 5 ? 10 : 8);
    employmentSubsidy = salary * (level === 5 ? 50 : 40);
  } else {
    medicalSubsidy = salary * (level === 7 ? 6 : level === 8 ? 4 : level === 9 ? 2 : 1);
    employmentSubsidy = salary * (level === 7 ? 25 : level === 8 ? 15 : level === 9 ? 8 : 4);
  }

  const dailyFoodAllowance = 30;
  const foodAllowance = hospitalDays * dailyFoodAllowance;
  const nursingFee = hospitalDays * 100;

  breakdown.push({ label: `一次性伤残补助金（${ratio}个月）`, amount: lumpSum });
  breakdown.push({ label: '医疗费', amount: medicalExpenses });
  breakdown.push({ label: '住院伙食补助费', amount: foodAllowance });
  breakdown.push({ label: '护理费', amount: nursingFee });
  if (medicalSubsidy > 0) {
    breakdown.push({ label: '一次性工伤医疗补助金', amount: medicalSubsidy });
  }
  if (employmentSubsidy > 0) {
    breakdown.push({ label: '一次性伤残就业补助金', amount: employmentSubsidy });
  }

  const total = lumpSum + medicalExpenses + foodAllowance + nursingFee + medicalSubsidy + employmentSubsidy;

  return {
    type: 'injury',
    inputs: { level, salary, medicalExpenses, hospitalDays, region },
    result: {
      total: Math.round(total * 100) / 100,
      breakdown,
      formula: `工伤赔偿 = 一次性伤残补助金(${ratio}个月×本人工资) + 医疗费 + 住院伙食补助费 + 护理费 + 医疗补助金 + 就业补助金`,
      legalBasis: ['《工伤保险条例》第三十五条', '《工伤保险条例》第三十六条', '《工伤保险条例》第三十七条'],
    },
  };
}

export function calculateInterest(
  principal: number,
  annualRate: number,
  days: number,
  type: 'simple' | 'compound'
): CalculatorResult {
  const dailyRate = annualRate / 100 / 365;
  let interest = 0;
  let formula = '';

  if (type === 'simple') {
    interest = principal * dailyRate * days;
    formula = `单利利息 = 本金 × 年利率 × 天数 ÷ 365`;
  } else {
    interest = principal * Math.pow(1 + dailyRate, days) - principal;
    formula = `复利利息 = 本金 × (1 + 日利率)^天数 - 本金`;
  }

  return {
    type: 'interest',
    inputs: { principal, annualRate, days, type },
    result: {
      total: Math.round(interest * 100) / 100,
      breakdown: [
        { label: '本金', amount: principal },
        { label: '利息', amount: Math.round(interest * 100) / 100 },
        { label: '本息合计', amount: Math.round((principal + interest) * 100) / 100 },
      ],
      formula,
      legalBasis: ['《民法典》第六百八十条', '最高人民法院关于审理民间借贷案件适用法律若干问题的规定'],
    },
  };
}

export function calculatePenalty(
  contractAmount: number,
  penaltyRate: number,
  delayDays: number,
  actualLoss: number = 0
): CalculatorResult {
  let penalty = contractAmount * (penaltyRate / 100) * (delayDays / 365);
  let adjustedPenalty = penalty;
  const breakdown: { label: string; amount: number }[] = [];

  breakdown.push({ label: '合同约定违约金', amount: Math.round(penalty * 100) / 100 });

  if (penalty > actualLoss * 1.3 && actualLoss > 0) {
    adjustedPenalty = actualLoss * 1.3;
    breakdown.push({ label: '损失的130%', amount: Math.round(adjustedPenalty * 100) / 100 });
    breakdown.push({ label: '调整后违约金（酌减）', amount: Math.round(adjustedPenalty * 100) / 100 });
  } else if (penalty < actualLoss && actualLoss > 0) {
    adjustedPenalty = actualLoss;
    breakdown.push({ label: '实际损失', amount: actualLoss });
    breakdown.push({ label: '调整后违约金（增加）', amount: Math.round(adjustedPenalty * 100) / 100 });
  }

  return {
    type: 'penalty',
    inputs: { contractAmount, penaltyRate, delayDays, actualLoss },
    result: {
      total: Math.round(adjustedPenalty * 100) / 100,
      breakdown,
      formula: '违约金 = 合同金额 × 约定日利率 × 逾期天数；约定违约金过高或过低的可请求法院调整',
      legalBasis: ['《民法典》第五百八十五条'],
    },
  };
}

export function calculateDelayInterest(
  judgmentAmount: number,
  delayDays: number,
  generalInterestRate: number = 0
): CalculatorResult {
  const dailyRate = 1.75 / 10000;
  const doubledInterest = judgmentAmount * dailyRate * delayDays;
  const generalInterest = generalInterestRate > 0 
    ? judgmentAmount * (generalInterestRate / 100) * (delayDays / 365) 
    : 0;
  const total = doubledInterest + generalInterest;

  return {
    type: 'delay',
    inputs: { judgmentAmount, delayDays, generalInterestRate },
    result: {
      total: Math.round(total * 100) / 100,
      breakdown: [
        { label: '一般债务利息', amount: Math.round(generalInterest * 100) / 100 },
        { label: '加倍部分债务利息（日万分之1.75）', amount: Math.round(doubledInterest * 100) / 100 },
      ],
      formula: '迟延履行利息 = 一般债务利息 + 加倍部分债务利息 = 一般债务利息 + 尚未清偿的生效法律文书确定的金钱债务 × 日万分之1.75 × 迟延履行期间',
      legalBasis: ['《民事诉讼法》第二百六十条', '最高人民法院关于执行程序中计算迟延履行期间的债务利息适用法律若干问题的解释'],
    },
  };
}

export function calculateLawyerFee(
  amount: number,
  region: string,
  caseType: string
): CalculatorResult {
  let fee = 0;
  const breakdown: { label: string; amount: number }[] = [];

  const brackets = [
    { limit: 100000, rate: 0.06, label: '10万元以下' },
    { limit: 500000, rate: 0.05, label: '10万-50万元' },
    { limit: 1000000, rate: 0.04, label: '50万-100万元' },
    { limit: 5000000, rate: 0.03, label: '100万-500万元' },
    { limit: 10000000, rate: 0.02, label: '500万-1000万元' },
    { limit: Infinity, rate: 0.01, label: '1000万元以上' },
  ];

  let remaining = amount;
  let prevLimit = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    
    if (amount <= bracket.limit) {
      const segmentAmount = amount - prevLimit;
      const segmentFee = segmentAmount * bracket.rate;
      fee += segmentFee;
      breakdown.push({ label: bracket.label, amount: Math.round(segmentFee * 100) / 100 });
      break;
    } else {
      const segmentAmount = bracket.limit - prevLimit;
      const segmentFee = segmentAmount * bracket.rate;
      fee += segmentFee;
      breakdown.push({ label: bracket.label, amount: Math.round(segmentFee * 100) / 100 });
      remaining = amount - bracket.limit;
      prevLimit = bracket.limit;
    }
  }

  return {
    type: 'lawyer_fee',
    inputs: { amount, region, caseType },
    result: {
      total: Math.round(fee * 100) / 100,
      breakdown,
      formula: '律师费 = 分段累计计算（参考各地律师服务收费指导标准）',
      legalBasis: ['律师服务收费管理办法', '各地律师服务收费指导标准'],
    },
  };
}

export function calculateTax(income: number, type: 'individual' | 'vat'): CalculatorResult {
  let tax = 0;
  const breakdown: { label: string; amount: number }[] = [];

  if (type === 'individual') {
    const taxable = income - 60000;
    
    if (taxable <= 0) {
      tax = 0;
      breakdown.push({ label: '应纳税所得额（不足6万）', amount: 0 });
    } else {
      const brackets = [
        { limit: 36000, rate: 0.03, deduction: 0 },
        { limit: 144000, rate: 0.1, deduction: 2520 },
        { limit: 300000, rate: 0.2, deduction: 16920 },
        { limit: 420000, rate: 0.25, deduction: 31920 },
        { limit: 660000, rate: 0.3, deduction: 52920 },
        { limit: 960000, rate: 0.35, deduction: 85920 },
        { limit: Infinity, rate: 0.45, deduction: 181920 },
      ];

      for (const bracket of brackets) {
        if (taxable <= bracket.limit) {
          tax = taxable * bracket.rate - bracket.deduction;
          break;
        }
      }
      breakdown.push({ label: '应纳税所得额', amount: taxable });
      breakdown.push({ label: '个人所得税', amount: Math.round(tax * 100) / 100 });
    }
  } else {
    const rate = 0.13;
    const taxIncluded = income / (1 + rate);
    tax = income - taxIncluded;
    breakdown.push({ label: '不含税金额', amount: Math.round(taxIncluded * 100) / 100 });
    breakdown.push({ label: '增值税（13%）', amount: Math.round(tax * 100) / 100 });
  }

  return {
    type: 'tax',
    inputs: { income, type },
    result: {
      total: Math.round(tax * 100) / 100,
      breakdown,
      formula: type === 'individual' 
        ? '个人所得税 = 应纳税所得额 × 适用税率 - 速算扣除数' 
        : '增值税 = 含税金额 ÷ (1 + 税率) × 税率',
      legalBasis: type === 'individual' 
        ? ['《中华人民共和国个人所得税法》第三条'] 
        : ['《中华人民共和国增值税暂行条例》'],
    },
  };
}

export function calculateRiskScore(company: any): { score: number; level: string } {
  let score = 100;
  
  const lawsuitPenalty = company.lawsuits?.length * 3 + 
    (company.lawsuits?.filter((l: any) => l.status === 'enforcement').length || 0) * 5;
  score -= Math.min(lawsuitPenalty, 30);
  
  const executionPenalty = (company.executions?.length || 0) * 5;
  score -= Math.min(executionPenalty, 25);
  
  if (company.status === 'cancelled' || company.status === 'revoked') {
    score -= 20;
  }
  
  const level = score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';
  
  return { score: Math.max(0, Math.round(score)), level };
}

export function calculateCreditScore(user: any, history: any[]): number {
  let score = 60;
  
  if (user.licenseInfo?.verifiedAt) {
    const years = Math.floor((Date.now() - new Date(user.licenseInfo.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
    score += Math.min(years, 10);
  }
  
  const winRate = history.filter((h: any) => h.result === 'win').length / Math.max(history.length, 1);
  score += Math.floor(winRate * 15);
  
  const avgRating = history.reduce((sum: number, h: any) => sum + (h.rating || 0), 0) / Math.max(history.length, 1);
  score += Math.floor((avgRating / 5) * 10);
  
  const badRecords = history.filter((h: any) => h.breach).length;
  score -= badRecords * 5;
  
  return Math.min(Math.max(score, 0), 100);
}
