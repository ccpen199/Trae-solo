export interface CityData {
  name: string
  insuredRate: number
  employedRate: number
  salaryResolvedRate: number
  population: number
  insuredCount: number
}

export interface PolicyDoc {
  id: string
  title: string
  department: string
  publishDate: string
  category: string
  summary: string
}

export const cityDataList: CityData[] = [
  { name: '广州', insuredRate: 95.2, employedRate: 92.8, salaryResolvedRate: 98.5, population: 1881, insuredCount: 1520 },
  { name: '深圳', insuredRate: 96.8, employedRate: 94.5, salaryResolvedRate: 99.1, population: 1768, insuredCount: 1580 },
  { name: '佛山', insuredRate: 93.5, employedRate: 91.2, salaryResolvedRate: 97.3, population: 950, insuredCount: 720 },
  { name: '东莞', insuredRate: 92.1, employedRate: 90.8, salaryResolvedRate: 96.8, population: 1047, insuredCount: 780 },
  { name: '珠海', insuredRate: 94.6, employedRate: 93.1, salaryResolvedRate: 98.0, population: 247, insuredCount: 195 },
  { name: '中山', insuredRate: 91.8, employedRate: 89.5, salaryResolvedRate: 95.6, population: 442, insuredCount: 328 },
  { name: '惠州', insuredRate: 89.3, employedRate: 87.6, salaryResolvedRate: 94.2, population: 606, insuredCount: 410 },
  { name: '江门', insuredRate: 88.5, employedRate: 86.9, salaryResolvedRate: 93.8, population: 480, insuredCount: 320 },
  { name: '汕头', insuredRate: 86.2, employedRate: 84.5, salaryResolvedRate: 92.1, population: 550, insuredCount: 340 },
  { name: '湛江', insuredRate: 84.8, employedRate: 82.3, salaryResolvedRate: 91.5, population: 700, insuredCount: 395 },
  { name: '茂名', insuredRate: 83.5, employedRate: 81.0, salaryResolvedRate: 90.8, population: 620, insuredCount: 350 },
  { name: '肇庆', insuredRate: 85.9, employedRate: 83.7, salaryResolvedRate: 92.5, population: 410, insuredCount: 280 },
]

export const policyDocs: PolicyDoc[] = [
  {
    id: '1',
    title: '广东省人力资源和社会保障厅关于调整2026年度社会保险缴费基数的通知',
    department: '广东省人力资源和社会保障厅',
    publishDate: '2026-01-15',
    category: '社会保险',
    summary: '根据广东省统计部门公布的2025年度全省城镇单位就业人员平均工资数据，现对2026年度社会保险缴费基数上下限进行调整。',
  },
  {
    id: '2',
    title: '广东省就业困难人员认定管理办法（2026年修订）',
    department: '广东省人力资源和社会保障厅',
    publishDate: '2026-02-20',
    category: '就业服务',
    summary: '为进一步规范就业困难人员认定管理，完善就业援助制度，促进就业困难人员就业创业，修订本办法。',
  },
  {
    id: '3',
    title: '广东省职称评审管理服务实施办法',
    department: '广东省人力资源和社会保障厅',
    publishDate: '2026-03-10',
    category: '人才服务',
    summary: '规范职称评审程序，加强职称评审管理，保证职称评审质量，优化职称评审服务。',
  },
  {
    id: '4',
    title: '广东省劳动保障监察条例（2026年修正）',
    department: '广东省人力资源和社会保障厅',
    publishDate: '2026-04-05',
    category: '劳动维权',
    summary: '加强劳动保障监察，规范劳动用工秩序，维护劳动者合法权益，构建和谐劳动关系。',
  },
  {
    id: '5',
    title: '关于进一步做好高校毕业生就业创业工作的通知',
    department: '广东省人力资源和社会保障厅',
    publishDate: '2026-05-08',
    category: '就业服务',
    summary: '落实就业优先战略，促进高校毕业生高质量充分就业，加大创业扶持力度。',
  },
  {
    id: '6',
    title: '广东省职业技能提升行动实施方案（2026-2028年）',
    department: '广东省人力资源和社会保障厅',
    publishDate: '2026-05-22',
    category: '人才服务',
    summary: '大规模开展职业技能培训，加快建设知识型、技能型、创新型劳动者大军。',
  },
]

export const dashboardStats = {
  totalInsured: 82650000,
  totalEmployed: 68500000,
  salaryCases: 12850,
  resolvedRate: 96.2,
  monthlyActive: 15200000,
  policyCount: 3680,
}
