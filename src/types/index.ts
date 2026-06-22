export type City = {
  id: string
  name: string
  province: string
  pinyin: string
  population: number
  serviceCount: number
}

export type ItemCategory = 'household' | 'education' | 'traffic' | 'social_security' | 'medical' | 'housing' | 'business' | 'other'

export type SubjectType = 'personal' | 'enterprise' | 'both'

export type ReviewStatus = 'draft' | 'pending_editor' | 'pending_supervisor' | 'pending_legal' | 'published' | 'rejected'

export type ReviewStage = 'editor' | 'supervisor' | 'legal'

export type MaterialItem = {
  id: string
  name: string
  required: boolean
  description: string
  exampleImage?: string
  commonErrors: string[]
  format?: string
  notes?: string
}

export type TimeLimit = {
  legal: string
  promise: string
  description?: string
}

export type OnlineEntry = {
  name: string
  url: string
  platform: 'province_gov' | 'city_gov' | 'wechat_mini' | 'app'
}

export type ServiceGuide = {
  id: string
  cityId: string
  title: string
  category: ItemCategory
  subjectType: SubjectType
  department: string
  description: string
  handlingConditions: string[]
  materials: MaterialItem[]
  timeLimit: TimeLimit
  fees: string
  handlingProcess: string[]
  onlineEntries: OnlineEntry[]
  offlineLocations: {
    name: string
    address: string
    phone: string
    hours: string
  }[]
  faqs: {
    question: string
    answer: string
  }[]
  reviewStatus: ReviewStatus
  version: string
  updatedAt: string
  views: number
  searchCount: number
}

export type ReviewRecord = {
  id: string
  guideId: string
  stage: ReviewStage
  reviewer: string
  reviewerRole: ReviewStage
  action: 'approve' | 'reject' | 'comment'
  comment: string
  createdAt: string
}

export type VaccineSite = {
  id: string
  name: string
  address: string
  district: string
  phone: string
  vaccines: {
    name: string
    available: number
    total: number
    updatedAt: string
  }[]
  queueLength: number
  waitMinutes: number
}

export type PcrSite = {
  id: string
  name: string
  address: string
  district: string
  lat: number
  lng: number
  openHours: string
  price: number
  queuePrediction: {
    time: string
    peopleCount: number
    waitMinutes: number
  }[]
}

export type OilPrice = {
  cityId: string
  date: string
  gasoline: {
    type: string
    price: number
    change: number
  }[]
  diesel: {
    type: string
    price: number
    change: number
  }[]
  source: string
  nextAdjustDate: string
}

export type SearchRecord = {
  keyword: string
  count: number
  trend: number
  category?: ItemCategory
}

export type ComplaintStatus = 'pending' | 'processing' | 'resolved' | 'reviewed'

export type DisposalRecord = {
  id: string
  date: string
  action: string
  operator: string
  department: string
  content: string
}

export type ComplaintPoint = {
  id: string
  keyword: string
  count: number
  trend: number
  relatedGuideIds: string[]
  description: string
  status: ComplaintStatus
  progress: number
  responsibleDept: string
  responsiblePerson: string
  disposalDeadline: string
  disposalConclusion?: string
  disposalRecords: DisposalRecord[]
  reviewRecords: DisposalRecord[]
  relatedSuggestionId?: string
}

export type OptimizationSuggestion = {
  id: string
  type: 'content' | 'process' | 'service'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  dataSource: string
  relatedMetrics: {
    name: string
    value: number
    unit?: string
  }[]
}

export type User = {
  id: string
  name: string
  role: ReviewStage | 'admin' | 'citizen'
  cityId: string
  department?: string
}
