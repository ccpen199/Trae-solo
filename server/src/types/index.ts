export type UserRole = 'publisher' | 'annotator' | 'reviewer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  skills: Skill[]
  accuracy: number
  totalTasks: number
  level: number
  points: number
  joinedAt: string
}

export interface Skill {
  id: string
  name: string
  category: TaskType
  level: number
  accuracy: number
  certified: boolean
}

export type TaskType = 'image_segmentation' | 'audio_transcription' | 'video_action' | 'medical_ct' | 'text_classification'

export type TaskStatus = 'draft' | 'published' | 'in_progress' | 'reviewing' | 'completed' | 'archived'

export interface Task {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  publisherId: string
  publisherName: string
  totalUnits: number
  completedUnits: number
  unitPrice: number
  rewardPool: number
  requiredSkillLevel: number
  consistencyThreshold: number
  annotationPerUnit: number
  deadline: string
  createdAt: string
  coverImage?: string
  tags: string[]
  qualityConfig: QualityConfig
}

export interface QualityConfig {
  samplingRate: number
  minConsistency: number
  adversarialEnabled: boolean
  adversarialRatio: number
  reviewThreshold: number
}

export interface TaskUnit {
  id: string
  taskId: string
  index: number
  content: TaskUnitContent
  status: 'pending' | 'assigned' | 'completed' | 'reviewed' | 'rejected'
  annotations: Annotation[]
  isAdversarial: boolean
  groundTruth?: Annotation
}

export interface TaskUnitContent {
  type: TaskType
  imageUrl?: string
  audioUrl?: string
  videoUrl?: string
  text?: string
  metadata?: Record<string, any>
}

export interface Annotation {
  id: string
  unitId: string
  annotatorId: string
  annotatorName: string
  data: AnnotationData
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'disputed'
  reviewComment?: string
}

export interface AnnotationData {
  labels?: Label[]
  segments?: Segment[]
  boundingBoxes?: BoundingBox[]
  text?: string
  tags?: string[]
  polygons?: PolygonPoint[][]
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface Segment {
  id: string
  label: string
  startTime: number
  endTime: number
  attributes?: Record<string, string>
}

export interface BoundingBox {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  attributes?: Record<string, string>
}

export interface PolygonPoint {
  x: number
  y: number
}

export interface Settlement {
  id: string
  userId: string
  userName: string
  taskId: string
  taskName: string
  amount: number
  units: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod: 'wechat' | 'bank'
  createdAt: string
  completedAt?: string
}

export interface Dispute {
  id: string
  unitId: string
  taskId: string
  taskName: string
  annotatorId: string
  annotatorName: string
  reason: string
  status: 'pending' | 'resolved' | 'rejected'
  createdAt: string
  resolverId?: string
  resolution?: string
}
