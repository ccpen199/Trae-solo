import type { InsuranceItem, PaymentRecord, BenefitItem, CertificateData, IdentityType } from './types'

export const insuranceData: Record<IdentityType, InsuranceItem[]> = {
  employee: [
    { type: '养老保险', status: '正常', startDate: '2010-03', months: 240, totalMonths: 360, balance: '156,000.00', monthlyDeposit: '960.00', lastDate: '2026-05' },
    { type: '医疗保险', status: '正常', startDate: '2010-03', months: 240, totalMonths: 300, balance: '48,000.00', monthlyDeposit: '240.00', lastDate: '2026-05' },
    { type: '失业保险', status: '正常', startDate: '2015-06', months: 180, totalMonths: 240, balance: '-', monthlyDeposit: '-', lastDate: '2026-05' },
    { type: '工伤保险', status: '正常', startDate: '2010-03', months: 240, totalMonths: 360, balance: '-', monthlyDeposit: '-', lastDate: '2026-05' },
    { type: '生育保险', status: '正常', startDate: '2010-03', months: 240, totalMonths: 360, balance: '-', monthlyDeposit: '-', lastDate: '2026-05' },
  ],
  flexible: [
    { type: '养老保险', status: '正常', startDate: '2018-01', months: 101, totalMonths: 180, balance: '68,500.00', monthlyDeposit: '680.00', lastDate: '2026-05' },
    { type: '医疗保险', status: '停缴', startDate: '2018-01', months: 85, totalMonths: 240, balance: '12,300.00', monthlyDeposit: '-', lastDate: '2025-01' },
  ],
  resident: [
    { type: '居民养老', status: '正常', startDate: '2020-01', months: 77, totalMonths: 180, balance: '15,600.00', monthlyDeposit: '200.00', lastDate: '2026-05' },
    { type: '居民医保', status: '正常', startDate: '2020-01', months: 77, totalMonths: 180, balance: '-', monthlyDeposit: '-', lastDate: '2026-05' },
  ],
}

export const paymentRecordsData: Record<string, PaymentRecord[]> = {
  pension: [
    { month: '2026-05', base: '12,000', personal: '960', unit: '1,920', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-04', base: '12,000', personal: '960', unit: '1,920', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-03', base: '12,000', personal: '960', unit: '1,920', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-02', base: '11,500', personal: '920', unit: '1,840', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-01', base: '11,500', personal: '920', unit: '1,840', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2025-12', base: '11,500', personal: '920', unit: '1,840', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
  ],
  medical: [
    { month: '2026-05', base: '12,000', personal: '240', unit: '1,200', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-04', base: '12,000', personal: '240', unit: '1,200', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-03', base: '12,000', personal: '240', unit: '1,200', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-02', base: '11,500', personal: '230', unit: '1,150', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-01', base: '11,500', personal: '230', unit: '1,150', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2025-12', base: '11,500', personal: '230', unit: '1,150', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
  ],
  unemployment: [
    { month: '2026-05', base: '12,000', personal: '60', unit: '60', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-04', base: '12,000', personal: '60', unit: '60', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-03', base: '12,000', personal: '60', unit: '60', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-02', base: '11,500', personal: '57.5', unit: '57.5', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2026-01', base: '11,500', personal: '57.5', unit: '57.5', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
    { month: '2025-12', base: '11,500', personal: '57.5', unit: '57.5', status: '已缴', company: '某某科技有限公司', location: '北京市朝阳区' },
  ],
}

export const benefitsData: Record<string, BenefitItem[]> = {
  pension: [
    {
      name: '基本养老金',
      status: '正常发放',
      amount: '3,280.50',
      period: '按月发放',
      lastDate: '2026-05-15',
      history: [
        { date: '2026-05-15', amount: '3,280.50' },
        { date: '2026-04-15', amount: '3,280.50' },
        { date: '2026-03-15', amount: '3,280.50' },
      ],
    },
  ],
  medical: [
    {
      name: '职工医保待遇',
      status: '正常享受',
      amount: '-',
      period: '实时结算',
      lastDate: '2026-05-20',
      history: [
        { date: '2026-05-20', amount: '门诊报销 156.80' },
        { date: '2026-04-10', amount: '住院报销 2,340.00' },
      ],
    },
  ],
  unemployment: [
    {
      name: '失业保险待遇',
      status: '未享受',
      amount: '-',
      period: '-',
      lastDate: '-',
      history: [],
    },
  ],
}

export const certificateData: CertificateData = {
  certificateNo: 'SB2026051800123456',
  name: '张三',
  idCard: '110101********1234',
  insuranceType: '城镇职工基本养老保险',
  status: '正常参保',
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
}

export const availableYears = ['2026', '2025', '2024', '2023', '2022', '2021', '2020']
