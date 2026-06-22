import type {
  CityCode,
  InsuranceType,
  CityRatePlan,
  CalculatorRequest,
  CalculatorResult,
  CalculatorResultItem,
  CompareRequest,
  CompareResult,
} from 'shared/types';

const DEFAULT_EMPTY_LEGAL_BASIS = {
  title: '',
  docNo: '',
  effectiveDate: '',
  article: '',
  url: '',
};

const CITY_RATE_PLANS: Record<CityCode, CityRatePlan> = {
  BJ: {
    cityCode: 'BJ',
    cityName: '北京',
    effectiveDate: '2024-07-01',
    items: [
      { type: 'PENSION', name: '养老保险', personalRate: 0.08, companyRate: 0.16, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MEDICAL', name: '医疗保险', personalRate: 0.02, companyRate: 0.098, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'UNEMPLOYMENT', name: '失业保险', personalRate: 0.005, companyRate: 0.005, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'INJURY', name: '工伤保险', personalRate: 0, companyRate: 0.002, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MATERNITY', name: '生育保险', personalRate: 0, companyRate: 0, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'HOUSING_FUND', name: '住房公积金', personalRate: 0.12, companyRate: 0.12, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
    ],
  },
  SH: {
    cityCode: 'SH',
    cityName: '上海',
    effectiveDate: '2024-07-01',
    items: [
      { type: 'PENSION', name: '养老保险', personalRate: 0.08, companyRate: 0.16, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MEDICAL', name: '医疗保险', personalRate: 0.02, companyRate: 0.095, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'UNEMPLOYMENT', name: '失业保险', personalRate: 0.005, companyRate: 0.005, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'INJURY', name: '工伤保险', personalRate: 0, companyRate: 0.0016, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MATERNITY', name: '生育保险', personalRate: 0, companyRate: 0, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'HOUSING_FUND', name: '住房公积金', personalRate: 0.07, companyRate: 0.07, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
    ],
  },
  GZ: {
    cityCode: 'GZ',
    cityName: '广州',
    effectiveDate: '2024-07-01',
    items: [
      { type: 'PENSION', name: '养老保险', personalRate: 0.08, companyRate: 0.14, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MEDICAL', name: '医疗保险', personalRate: 0.02, companyRate: 0.0545, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'UNEMPLOYMENT', name: '失业保险', personalRate: 0.002, companyRate: 0.008, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'INJURY', name: '工伤保险', personalRate: 0, companyRate: 0.001, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MATERNITY', name: '生育保险', personalRate: 0, companyRate: 0, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'HOUSING_FUND', name: '住房公积金', personalRate: 0.05, companyRate: 0.05, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
    ],
  },
  SZ: {
    cityCode: 'SZ',
    cityName: '深圳',
    effectiveDate: '2024-07-01',
    items: [
      { type: 'PENSION', name: '养老保险', personalRate: 0.08, companyRate: 0.14, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MEDICAL', name: '医疗保险', personalRate: 0.02, companyRate: 0.052, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'UNEMPLOYMENT', name: '失业保险', personalRate: 0.003, companyRate: 0.007, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'INJURY', name: '工伤保险', personalRate: 0, companyRate: 0.002, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MATERNITY', name: '生育保险', personalRate: 0, companyRate: 0, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'HOUSING_FUND', name: '住房公积金', personalRate: 0.05, companyRate: 0.05, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
    ],
  },
  HZ: {
    cityCode: 'HZ',
    cityName: '杭州',
    effectiveDate: '2024-07-01',
    items: [
      { type: 'PENSION', name: '养老保险', personalRate: 0.08, companyRate: 0.14, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MEDICAL', name: '医疗保险', personalRate: 0.02, companyRate: 0.095, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'UNEMPLOYMENT', name: '失业保险', personalRate: 0.005, companyRate: 0.005, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'INJURY', name: '工伤保险', personalRate: 0, companyRate: 0.002, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MATERNITY', name: '生育保险', personalRate: 0, companyRate: 0, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'HOUSING_FUND', name: '住房公积金', personalRate: 0.12, companyRate: 0.12, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
    ],
  },
  TJ: {
    cityCode: 'TJ',
    cityName: '天津',
    effectiveDate: '2024-07-01',
    items: [
      { type: 'PENSION', name: '养老保险', personalRate: 0.08, companyRate: 0.16, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MEDICAL', name: '医疗保险', personalRate: 0.02, companyRate: 0.08, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'UNEMPLOYMENT', name: '失业保险', personalRate: 0.005, companyRate: 0.005, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'INJURY', name: '工伤保险', personalRate: 0, companyRate: 0.002, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'MATERNITY', name: '生育保险', personalRate: 0, companyRate: 0, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
      { type: 'HOUSING_FUND', name: '住房公积金', personalRate: 0.11, companyRate: 0.11, legalBasis: DEFAULT_EMPTY_LEGAL_BASIS },
    ],
  },
};

function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function getCityRatePlan(cityCode: CityCode): CityRatePlan {
  return CITY_RATE_PLANS[cityCode];
}

export function calculateInsurance(req: CalculatorRequest): CalculatorResult {
  const { cityCode, baseAmount, selectedItems, housingFundPercent, isCompanyPay = false } = req;
  const plan = CITY_RATE_PLANS[cityCode];

  const items: CalculatorResultItem[] = plan.items
    .filter((item) => selectedItems.includes(item.type))
    .map((item) => {
      let personalRate = item.personalRate;
      let companyRate = item.companyRate;

      if (item.type === 'HOUSING_FUND' && housingFundPercent !== undefined) {
        personalRate = housingFundPercent;
        companyRate = housingFundPercent;
      }

      const personalAmount = roundAmount(baseAmount * personalRate);
      const companyAmount = roundAmount(baseAmount * companyRate);
      const totalAmount = roundAmount(personalAmount + companyAmount);

      return {
        type: item.type,
        name: item.name,
        base: baseAmount,
        personalRate,
        companyRate,
        personalAmount,
        companyAmount,
        totalAmount,
        legalBasis: item.legalBasis,
      };
    });

  const personalTotal = roundAmount(items.reduce((sum, item) => sum + item.personalAmount, 0));
  const companyTotal = roundAmount(items.reduce((sum, item) => sum + item.companyAmount, 0));
  const grandTotal = roundAmount(personalTotal + companyTotal);

  return {
    cityCode,
    cityName: plan.cityName,
    baseAmount,
    items,
    personalTotal,
    companyTotal,
    grandTotal,
  };
}

export function calculateCompare(req: CompareRequest): CompareResult {
  const { baseAmount, selectedItems, housingFundPercent, cities } = req;

  const results: Partial<Record<CityCode, CalculatorResult>> = {};
  let cheapestCity: CityCode = cities[0];
  let mostExpensiveCity: CityCode = cities[0];
  let minPersonal = Infinity;
  let maxPersonal = -Infinity;
  let minCompany = Infinity;
  let maxCompany = -Infinity;

  cities.forEach((cityCode) => {
    const result = calculateInsurance({
      cityCode,
      baseAmount,
      selectedItems,
      housingFundPercent,
      isCompanyPay: true,
    });
    results[cityCode] = result;

    if (result.personalTotal < minPersonal) {
      minPersonal = result.personalTotal;
      cheapestCity = cityCode;
    }
    if (result.personalTotal > maxPersonal) {
      maxPersonal = result.personalTotal;
      mostExpensiveCity = cityCode;
    }
    if (result.companyTotal < minCompany) {
      minCompany = result.companyTotal;
    }
    if (result.companyTotal > maxCompany) {
      maxCompany = result.companyTotal;
    }
  });

  return {
    results,
    summary: {
      cheapestCity,
      mostExpensiveCity,
      maxDiffPersonal: roundAmount(maxPersonal - minPersonal),
      maxDiffCompany: roundAmount(maxCompany - minCompany),
    },
  };
}

export function getInsuranceTypes(): InsuranceType[] {
  return ['PENSION', 'MEDICAL', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY', 'HOUSING_FUND'];
}
