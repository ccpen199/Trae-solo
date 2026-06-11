export type DifficultyLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export type AcceptancePeriod = '24h' | '72h' | '7d'

export type TaskStatus = 'open' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'cancelled'

export type UserRole = 'worker' | 'employer' | 'admin'

export type ComplianceStatus = 'pending' | 'approved' | 'rejected'

export type SubmissionStatus = 'submitted' | 'pending_review' | 'approved' | 'rejected'

export type RiskAlertType = 'device_duplicate' | 'withdrawal_exceed' | 'ip_anomaly' | 'compliance'

export type RiskSeverity = 'low' | 'medium' | 'high'

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export interface Task {
  id: string
  title: string
  description: string
  difficulty: DifficultyLevel
  deliveryStandards: string[]
  acceptancePeriod: AcceptancePeriod
  basePrice: number
  currentPrice: number
  totalSlots: number
  takenSlots: number
  categoryId: string
  employerId: string
  employerName: string
  status: TaskStatus
  createdAt: string
  deadline: string
  complianceStatus: ComplianceStatus
  complianceNotes?: string
  heatScore?: number
}

export interface TaskSubmission {
  id: string
  taskId: string
  workerId: string
  workerName: string
  taskTitle: string
  attachments: string[]
  status: SubmissionStatus
  reviewNotes?: string
  submittedAt: string
  reviewedAt?: string
  price: number
}

export interface Worker {
  id: string
  phone: string
  name: string
  role: 'worker'
  avatar?: string
  realNameVerified: boolean
  completedTasks: number
  totalEarnings: number
  withdrawableBalance: number
  dailyWithdrawn: number
  commissionLevel: number
}

export interface Employer {
  id: string
  phone: string
  name: string
  role: 'employer'
  avatar?: string
  businessLicense: string
  bankAccountVerified: boolean
  depositBalance: number
  certificationStatus: ComplianceStatus
  publishedTasks: number
  totalDisbursed: number
}

export interface Admin {
  id: string
  name: string
  role: 'admin'
}

export type User = Worker | Employer | Admin

export interface RiskAlert {
  id: string
  type: RiskAlertType
  severity: RiskSeverity
  details: string
  userId: string
  userName: string
  createdAt: string
  resolved: boolean
}

export interface TaskHeatPrediction {
  taskId: string
  taskTitle: string
  difficulty: DifficultyLevel
  historicalCompletionRate: number
  abandonmentRate: number
  predictedHeat: number
  recommended: boolean
  predictedTomorrowSlots: number
  basePrice: number
  completionRate: number
  abandonRate: number
  historicalCompleted: number
  supplyDemandRatio: number
  commissionAttractiveness: number
}

export interface WithdrawalRecord {
  id: string
  workerId: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'flagged'
  createdAt: string
  requiresReview: boolean
}

export interface EarningsBroadcast {
  id: string
  userName: string
  amount: number
  taskTitle: string
  time: string
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  L1: { label: 'L1 入门', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-400', description: '简单填写类' },
  L2: { label: 'L2 基础', color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-400', description: '基础操作类' },
  L3: { label: 'L3 进阶', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-400', description: '进阶执行类' },
  L4: { label: 'L4 精通', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-400', description: '专业技能类' },
  L5: { label: 'L5 专家', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-400', description: '高级专业类' },
}

export const ACCEPTANCE_PERIOD_LABEL: Record<AcceptancePeriod, string> = {
  '24h': '24小时内',
  '72h': '72小时内',
  '7d': '7天内',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: '开放接单',
  in_progress: '进行中',
  pending_review: '待验收',
  completed: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
}
