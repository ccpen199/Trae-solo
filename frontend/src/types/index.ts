export type ProblemType = 'bug' | 'feature' | 'performance' | 'ui' | 'other'
export type Severity = 'critical' | 'major' | 'minor' | 'trivial'
export type FeedbackStatus = 'pending' | 'accepted' | 'supplementing' | 'processing' | 'fixed' | 'verifying' | 'closed'
export type SourceChannel = 'web' | 'app' | 'wechat' | 'email' | 'phone' | 'other'

export interface ConsoleError {
  message: string
  timestamp?: string
  stack?: string
}

export interface NetworkError {
  url: string
  status: number
  method: string
  timestamp?: string
}

export interface FeedbackItem {
  id: string
  title: string
  description: string
  page_url: string
  browser_info: string
  os_info: string
  screen_resolution: string
  user_agent: string
  problem_type: ProblemType
  severity: Severity
  contact: string
  reproduce_steps: string
  console_errors: ConsoleError[] | null
  network_errors: NetworkError[] | null
  status: FeedbackStatus
  module: string
  version: string
  affected_users_count: number
  source_channel: SourceChannel
  merge_parent_id: string | null
  merged_children_ids: string[] | null
  merged_affected_users_count: number | null
  defect_id: string | null
  assignee: string | null
  verifier: string | null
  close_reason: string | null
  created_at: number
  updated_at: number
}

export interface StatusLog {
  id: string
  feedback_id: string
  old_status: string | null
  new_status: string
  operator: string
  remark: string | null
  created_at: number
}

export interface Attachment {
  id: string
  feedback_id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  content_type: string
  created_at: number
}

export interface Comment {
  id: string
  feedback_id: string
  author: string
  content: string
  created_at: number
}

export interface FeedbackDetail extends FeedbackItem {
  attachments: Attachment[]
  status_logs: StatusLog[]
  comments: Comment[]
}

export interface ListParams {
  page?: number
  pageSize?: number
  module?: string
  status?: FeedbackStatus
  version?: string
  source_channel?: SourceChannel
  keyword?: string
  min_affected?: number
  max_affected?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ListResponse<T> {
  list: T[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface SubmitData {
  title: string
  description: string
  page_url: string
  browser_info: string
  os_info: string
  screen_resolution: string
  user_agent: string
  problem_type: ProblemType
  severity: Severity
  module: string
  version: string
  contact: string
  reproduce_steps: string
  console_errors?: ConsoleError[]
  network_errors?: NetworkError[]
  source_channel?: SourceChannel
  affected_users_count?: number
}

export interface StatsOverview {
  total: number
  status_counts: {
    pending: number
    accepted: number
    supplementing: number
    processing: number
    fixed: number
    verifying: number
    closed: number
  }
  pending_total: number
  at_risk_count: number
  avg_response_time_ms: number
  avg_fix_time_ms: number
  avg_satisfaction: number
}

export interface HotIssue {
  id: string
  title: string
  affected_users_count: number
  comments_count: number
  status: FeedbackStatus
}

export interface VersionQuality {
  version: string
  total: number
  closed: number
  close_rate: number
  severity_breakdown: {
    critical: number
    major: number
    minor: number
    trivial: number
  }
  avg_resolution_time_ms: number
}

export interface ResponseTimeData {
  date: string
  avg_time_ms: number
  count: number
}

export interface SatisfactionData {
  category: string
  count: number
}

export interface RiskItem {
  id: string
  title: string
  severity: Severity
  status: FeedbackStatus
  module: string
  affected_users_count: number
  created_at: number
  risk_type: 'overdue' | 'high_severity' | 'high_impact'
}

export interface DefectItem {
  id: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignee?: string
  created_by?: string
  created_at: number
  updated_at?: number
}
