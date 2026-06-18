export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'supplement' | 're-reviewing'

export type SubsidyType = 'insurance' | 'allowance'

export interface MaterialItem {
  id: string
  label: string
  uploaded: boolean
  isDeficient?: boolean
  fileName?: string
  fileSize?: string
}

export interface ProgressStep {
  key: string
  label: string
  completed: boolean
  current: boolean
  date?: string
}

export interface ApplicationRecord {
  id: string
  applicationNo: string
  subsidyType: SubsidyType
  status: ApplicationStatus
  applyDate: string
  monthlyAmount: number
  months: number
  totalAmount: number
  reason: string
  unemploymentDate: string
  idNumber: string
  bankName: string
  cardNumber: string
  phone: string
  domicile: string
  residence: string
  materials: MaterialItem[]
  progress: ProgressStep[]
}

export const statusLabels: Record<ApplicationStatus, string> = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
  supplement: '待补充材料',
  're-reviewing': '重新审核中',
}

export const statusColors: Record<ApplicationStatus, string> = {
  pending: '#FF7D00',
  reviewing: '#165DFF',
  approved: '#00B42A',
  rejected: '#F53F3F',
  supplement: '#FF7D00',
  're-reviewing': '#165DFF',
}

export const subsidyTypeLabels: Record<SubsidyType, string> = {
  insurance: '失业保险金',
  allowance: '失业补助金',
}

export const ALL_MATERIALS = [
  { id: 'labor_proof', label: '解除劳动关系证明' },
  { id: 'id_card', label: '身份证正反面' },
  { id: 'hukou', label: '户口本' },
  { id: 'photo', label: '一寸免冠照片' },
  { id: 'bank_card', label: '银行卡照片' },
]

export const mockApplications: ApplicationRecord[] = [
  {
    id: '1',
    applicationNo: 'UN202606001',
    subsidyType: 'insurance',
    status: 'reviewing',
    applyDate: '2026-06-15',
    monthlyAmount: 1890,
    months: 6,
    totalAmount: 11340,
    reason: '非因本人意愿中断就业',
    unemploymentDate: '2026-06-10',
    idNumber: '3301**********1234',
    bankName: '中国工商银行',
    cardNumber: '6222 **** **** 1234',
    phone: '138****5678',
    domicile: '浙江省杭州市西湖区',
    residence: '浙江省杭州市余杭区',
    materials: [
      { id: 'labor_proof', label: '解除劳动关系证明', uploaded: true, fileName: '解除证明.pdf', fileSize: '1.2MB' },
      { id: 'id_card', label: '身份证正反面', uploaded: true, fileName: '身份证.jpg', fileSize: '850KB' },
      { id: 'hukou', label: '户口本', uploaded: false, isDeficient: true },
      { id: 'photo', label: '一寸免冠照片', uploaded: true, fileName: '照片.jpg', fileSize: '320KB' },
      { id: 'bank_card', label: '银行卡照片', uploaded: true, fileName: '银行卡.jpg', fileSize: '450KB' },
    ],
    progress: [
      { key: 'submitted', label: '已提交', completed: true, current: false, date: '2026-06-15 10:30' },
      { key: 'preliminary', label: '初审中', completed: false, current: true },
      { key: 'review', label: '复核中', completed: false, current: false },
      { key: 'approved', label: '已发放', completed: false, current: false },
    ],
  },
  {
    id: '2',
    applicationNo: 'UN202605023',
    subsidyType: 'allowance',
    status: 'approved',
    applyDate: '2026-05-20',
    monthlyAmount: 1000,
    months: 3,
    totalAmount: 3000,
    reason: '本人意愿中断就业',
    unemploymentDate: '2026-05-15',
    idNumber: '3301**********1234',
    bankName: '中国工商银行',
    cardNumber: '6222 **** **** 1234',
    phone: '138****5678',
    domicile: '浙江省杭州市西湖区',
    residence: '浙江省杭州市余杭区',
    materials: [
      { id: 'labor_proof', label: '解除劳动关系证明', uploaded: true, fileName: '解除证明.pdf', fileSize: '1.2MB' },
      { id: 'id_card', label: '身份证正反面', uploaded: true, fileName: '身份证.jpg', fileSize: '850KB' },
      { id: 'hukou', label: '户口本', uploaded: true, fileName: '户口本.pdf', fileSize: '2.1MB' },
      { id: 'photo', label: '一寸免冠照片', uploaded: true, fileName: '照片.jpg', fileSize: '320KB' },
      { id: 'bank_card', label: '银行卡照片', uploaded: true, fileName: '银行卡.jpg', fileSize: '450KB' },
    ],
    progress: [
      { key: 'submitted', label: '已提交', completed: true, current: false, date: '2026-05-20 14:20' },
      { key: 'preliminary', label: '初审通过', completed: true, current: false, date: '2026-05-22 09:15' },
      { key: 'review', label: '复核通过', completed: true, current: false, date: '2026-05-25 16:30' },
      { key: 'approved', label: '已发放', completed: true, current: false, date: '2026-05-28 10:00' },
    ],
  },
  {
    id: '3',
    applicationNo: 'UN202604089',
    subsidyType: 'insurance',
    status: 'supplement',
    applyDate: '2026-06-18',
    monthlyAmount: 1890,
    months: 6,
    totalAmount: 11340,
    reason: '非因本人意愿中断就业',
    unemploymentDate: '2026-06-05',
    idNumber: '3301**********1234',
    bankName: '中国工商银行',
    cardNumber: '6222 **** **** 1234',
    phone: '138****5678',
    domicile: '浙江省杭州市西湖区',
    residence: '浙江省杭州市余杭区',
    materials: [
      { id: 'labor_proof', label: '解除劳动关系证明', uploaded: false, isDeficient: true },
      { id: 'id_card', label: '身份证正反面', uploaded: true, fileName: '身份证.jpg', fileSize: '850KB' },
      { id: 'hukou', label: '户口本', uploaded: false, isDeficient: true },
      { id: 'photo', label: '一寸免冠照片', uploaded: true, fileName: '照片.jpg', fileSize: '320KB' },
      { id: 'bank_card', label: '银行卡照片', uploaded: true, fileName: '银行卡.jpg', fileSize: '450KB' },
    ],
    progress: [
      { key: 'submitted', label: '已提交', completed: true, current: false, date: '2026-06-18 09:00' },
      { key: 'preliminary', label: '待补充材料', completed: false, current: true },
      { key: 'review', label: '复核中', completed: false, current: false },
      { key: 'approved', label: '已发放', completed: false, current: false },
    ],
  },
  {
    id: '4',
    applicationNo: 'UN202603045',
    subsidyType: 'insurance',
    status: 'rejected',
    applyDate: '2026-03-10',
    monthlyAmount: 1890,
    months: 0,
    totalAmount: 0,
    reason: '其他',
    unemploymentDate: '2026-03-05',
    idNumber: '3301**********1234',
    bankName: '中国工商银行',
    cardNumber: '6222 **** **** 1234',
    phone: '138****5678',
    domicile: '浙江省杭州市西湖区',
    residence: '浙江省杭州市余杭区',
    materials: [
      { id: 'labor_proof', label: '解除劳动关系证明', uploaded: true, fileName: '解除证明.pdf', fileSize: '1.2MB' },
      { id: 'id_card', label: '身份证正反面', uploaded: true, fileName: '身份证.jpg', fileSize: '850KB' },
      { id: 'hukou', label: '户口本', uploaded: true, fileName: '户口本.pdf', fileSize: '2.1MB' },
      { id: 'photo', label: '一寸免冠照片', uploaded: true, fileName: '照片.jpg', fileSize: '320KB' },
      { id: 'bank_card', label: '银行卡照片', uploaded: true, fileName: '银行卡.jpg', fileSize: '450KB' },
    ],
    progress: [
      { key: 'submitted', label: '已提交', completed: true, current: false, date: '2026-03-10 11:00' },
      { key: 'preliminary', label: '初审不通过', completed: true, current: false, date: '2026-03-12 15:30' },
      { key: 'review', label: '复核中', completed: false, current: false },
      { key: 'approved', label: '已发放', completed: false, current: false },
    ],
  },
]
