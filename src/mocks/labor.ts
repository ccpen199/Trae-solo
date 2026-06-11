export interface SalaryReport {
  id: string
  companyName: string
  companyId: string
  amount: number
  months: number
  evidence: string[]
  anonymous: boolean
  status: 'submitted' | 'accepted' | 'investigating' | 'processing' | 'resolved' | 'closed'
  statusName: string
  createTime: string
  workOrder: WorkOrder
}

export interface WorkOrder {
  id: string
  reportId: string
  steps: WorkOrderStep[]
}

export interface WorkOrderStep {
  step: string
  status: 'completed' | 'current' | 'pending'
  time?: string
  handler?: string
  result?: string
}

export interface ContractTemplate {
  id: string
  name: string
  description: string
}

export const contractTemplates: ContractTemplate[] = [
  { id: '1', name: '标准劳动合同', description: '适用于全日制用工，依据《劳动合同法》标准条款' },
  { id: '2', name: '非全日制用工合同', description: '适用于每日工作不超过4小时的灵活用工' },
  { id: '3', name: '劳务派遣合同', description: '适用于劳务派遣用工形式' },
]

export const salaryReports: SalaryReport[] = [
  {
    id: '1',
    companyName: '广州市某某建筑工程有限公司',
    companyId: '91440101MA5C****',
    amount: 45000,
    months: 3,
    evidence: ['工资条截图', '银行流水', '考勤记录'],
    anonymous: false,
    status: 'investigating',
    statusName: '调查核实中',
    createTime: '2026-05-20 09:30:00',
    workOrder: {
      id: 'WO20260520001',
      reportId: '1',
      steps: [
        { step: '线索提交', status: 'completed', time: '2026-05-20 09:30', handler: '张伟', result: '提交成功' },
        { step: '受理分配', status: 'completed', time: '2026-05-20 14:00', handler: '天河区劳动监察大队', result: '已受理，分配调查员' },
        { step: '调查核实', status: 'current', time: '2026-05-22 10:00', handler: '调查员李明' },
        { step: '处置执行', status: 'pending' },
        { step: '结果反馈', status: 'pending' },
        { step: '用户评价', status: 'pending' },
      ],
    },
  },
  {
    id: '2',
    companyName: '深圳某餐饮管理有限公司',
    companyId: '91440300MA5D****',
    amount: 18000,
    months: 2,
    evidence: ['微信聊天记录', '排班表'],
    anonymous: true,
    status: 'resolved',
    statusName: '已处置',
    createTime: '2026-04-15 11:20:00',
    workOrder: {
      id: 'WO20260415001',
      reportId: '2',
      steps: [
        { step: '线索提交', status: 'completed', time: '2026-04-15 11:20', handler: '匿名用户', result: '提交成功' },
        { step: '受理分配', status: 'completed', time: '2026-04-15 16:00', handler: '南山区劳动监察大队', result: '已受理' },
        { step: '调查核实', status: 'completed', time: '2026-04-20 10:00', handler: '调查员王芳', result: '欠薪情况属实' },
        { step: '处置执行', status: 'completed', time: '2026-04-25 14:00', handler: '南山区劳动监察大队', result: '责令支付欠薪，企业已执行' },
        { step: '结果反馈', status: 'completed', time: '2026-04-28 09:00', handler: '系统', result: '欠薪已全额支付' },
        { step: '用户评价', status: 'completed', time: '2026-04-28 10:30', handler: '匿名用户', result: '非常满意' },
      ],
    },
  },
]
