export interface User {
  id: number
  email: string
  username: string
  role: string
  avatar: string | null
  phone: string | null
  realName: string | null
  bio: string | null
  location: string | null
  rating: number
  totalOrders: number
  completedOrders: number
  complaintCount: number
  level: number
  experience: number
  balance: number
  frozenBalance: number
  status: string
  createdAt: string
  skills: Skill[]
}

export interface Skill {
  id: number
  name: string
  category: string
  description: string | null
  icon: string | null
  demandCount: number
  supplyCount: number
}

export interface Task {
  id: number
  title: string
  description: string
  category: string
  status: string
  budgetMin: number
  budgetMax: number
  deadline: string
  publishedAt: string | null
  employerId: number
  employer: {
    id: number
    username: string
    avatar: string | null
  }
  skills: Skill[]
  attachments: TaskAttachment[]
  bids: Bid[]
  milestones: Milestone[]
  fileVersions: FileVersion[]
  totalAmount: number | null
  escrowAmount: number
  riskScore: number
  fraudWarning: boolean
  createdAt: string
  updatedAt: string
  timeLeft?: number
  daysLeft?: number
  selectedBidId?: number | null
  _count?: {
    bids: number
  }
}

export interface TaskAttachment {
  id: number
  taskId: number
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

export interface Bid {
  id: number
  taskId: number
  task?: Task
  providerId: number
  provider: {
    id: number
    username: string
    avatar: string | null
    rating: number
    level: number
    completedOrders?: number
    skills?: Skill[]
  }
  price: number
  deliveryDays: number
  proposal: string
  status: string
  portfolioUrls: string | null
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: number
  taskId: number
  title: string
  description: string | null
  amount: number
  percentage: number
  orderIndex: number
  status: string
  deadline: string | null
  submittedAt: string | null
  approvedAt: string | null
  paidAt: string | null
  feedback: string | null
  rating: number | null
  approver?: {
    id: number
    username: string
  }
}

export interface FileVersion {
  id: number
  taskId: number
  milestoneId: number | null
  uploaderId: number
  uploader: {
    id: number
    username: string
    avatar: string | null
  }
  version: string
  fileName: string
  fileUrl: string
  fileSize: number
  description: string | null
  isFinal: boolean
  createdAt: string
}

export interface Collaboration {
  id: number
  taskId: number
  userId: number
  user: {
    id: number
    username: string
    avatar: string | null
  }
  fileVersionId: number | null
  type: string
  content: string
  positionX: number | null
  positionY: number | null
  pageNumber: number | null
  resolved: boolean
  createdAt: string
}

export interface Payment {
  id: number
  userId: number
  taskId: number | null
  milestoneId: number | null
  type: string
  amount: number
  status: string
  remark: string | null
  paidAt: string | null
  createdAt: string
  task?: {
    id: number
    title: string
  }
}

export interface Dispute {
  id: number
  taskId: number
  task: {
    id: number
    title: string
  }
  initiatorId: number
  initiator: {
    id: number
    username: string
    avatar: string | null
  }
  reason: string
  description: string
  evidenceUrls: string | null
  status: string
  expertId: number | null
  expert?: {
    id: number
    username: string
  }
  verdict: string | null
  refundRatio: number | null
  description_result: string | null
  evidences: DisputeEvidence[]
  createdAt: string
  resolvedAt: string | null
}

export interface DisputeEvidence {
  id: number
  disputeId: number
  userId: number
  user: {
    id: number
    username: string
  }
  fileName: string
  fileUrl: string
  description: string | null
  createdAt: string
}

export interface RiskReport {
  id: number
  userId: number
  taskId: number | null
  type: string
  level: string
  title: string
  description: string | null
  evidence: string | null
  handled: boolean
  result: string | null
  createdAt: string
}

export interface IndustryTrend {
  category: string
  taskCount: number
  totalBudget: number
  avgBudget: number
  completionRate: number
  completedCount: number
}

export interface SkillGap {
  skillId: number
  name: string
  category: string
  demandCount: number
  supplyCount: number
  gapType: string
  gapPercentage: number
}

export interface DashboardStats {
  overview: {
    totalUsers: number
    totalTasks: number
    totalBids: number
    totalAmount: number
    activeTasks: number
    pendingDisputes: number
  }
  recentTasks: Task[]
  topProviders: User[]
}
