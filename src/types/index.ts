export interface ServiceItem {
  id: string
  name: string
  icon: string
  category: string
  dept: string
  url: string
}

export interface ExpiringItem {
  id: string
  title: string
  deadline: string
  daysLeft: number
  urgency: "high" | "medium" | "low"
  actionUrl: string
  serviceId: string
}

export interface PolicyItem {
  id: string
  title: string
  subsidy: string
  deadline: string
  matchScore: number
  tags: string[]
}

export interface HeatmapData {
  x: number
  y: number
  value: number
  label: string
}

export interface CitizenProfile {
  id: string
  name: string
  avatar: string
  tags: string[]
  role: "citizen" | "staff" | "admin"
  profileRadar: {
    serviceActivity: number
    paymentFrequency: number
    servicePreference: number
    policyMatch: number
    digitalLevel: number
  }
  highFreqServices: ServiceItem[]
  expiringReminders: ExpiringItem[]
  matchedPolicies: PolicyItem[]
  preferenceHeatmap: HeatmapData[]
}

export interface DeptService {
  deptId: string
  deptName: string
  deptIcon: string
  deptColor: string
  services: ServiceDetail[]
}

export interface ServiceDetail {
  id: string
  name: string
  description: string
  category: string
  materials: string[]
  steps: string[]
  duration: string
  fee: string
  onlineAvailable: boolean
}

export interface KnowledgeNode {
  id: string
  label: string
  type: "policy" | "clause" | "condition" | "service"
  content: string
}

export interface KnowledgeEdge {
  source: string
  target: string
  relation: "references" | "requires" | "excludes" | "triggers"
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  references?: KnowledgeNode[]
  timestamp: number
  actionLink?: { label: string; serviceId: string }
}

export interface OrchestrationFlow {
  id: string
  name: string
  description: string
  steps: OrchestrationStep[]
  applicantName?: string
  applyDate?: string
  failureReason?: string
  retryCount?: number
  supervisionStatus?: "none" | "submitted" | "accepted"
}

export interface OrchestrationStep {
  id: string
  name: string
  dept: string
  apiEndpoint: string
  autoTriggered: boolean
  status: "pending" | "processing" | "completed" | "failed"
  startTime?: string
  endTime?: string
  failureReason?: string
  operator?: string
  retryCount?: number
}

export interface FeedbackItem {
  id: string
  serviceId: string
  serviceName: string
  rating: number
  comment: string
  keywords: string[]
  category: string
  createdAt: string
}

export interface WorkOrder {
  id: string
  feedbackId: string
  dept: string
  status: "pending" | "processing" | "resolved" | "closed"
  deadline: string
  description: string
  createdAt: string
  handler?: string
  handleNote?: string
  sourceRating?: number
  sourceComment?: string
  clusterCategory?: string
  resolvedAt?: string
}

export interface ClusterAnalysis {
  categories: { name: string; count: number; percentage: number }[]
  wordCloud: { text: string; value: number }[]
  trend: { date: string; count: number }[]
}

export interface ServiceRecord {
  id: string
  serviceName: string
  dept: string
  status: "completed" | "processing" | "failed"
  date: string
  category: string
  materialsChecked?: boolean[]
  currentStep?: number
  totalSteps?: number
  resultDoc?: string
}

export interface OfflinePackage {
  id: string
  name: string
  description: string
  size: string
  version: string
  updatedAt: string
  downloaded: boolean
  cachedAt?: string
  expiresAt?: string
}

export interface ServiceApplication {
  id: string
  serviceId: string
  serviceName: string
  dept: string
  deptColor: string
  status: "draft" | "submitted" | "material_checking" | "material_passed" | "material_failed" | "processing" | "completed" | "failed"
  materialsChecked: boolean[]
  materials: string[]
  currentStep: number
  totalSteps: number
  steps: string[]
  submitTime: string
  failReason?: string
  resultDoc?: string
  category: string
}

export type UserRole = "citizen" | "staff" | "admin"

export interface RolePermission {
  role: UserRole
  canApply: boolean
  canViewAllRecords: boolean
  canHandleWorkOrders: boolean
  canManageKnowledge: boolean
  canConfigOrchestration: boolean
  canViewClusterAnalysis: boolean
  canSupervise: boolean
}
