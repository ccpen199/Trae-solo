export const roleLabels: Record<string, string> = {
  designer: '交互设计师',
  pm: '产品经理',
  developer: '研发工程师',
  researcher: '用户研究员',
}

export const schemeStatusLabels: Record<string, string> = {
  draft: '草稿',
  in_review: '评审中',
  approved: '已通过',
  rejected: '已驳回',
  archived: '已归档',
}

export const stepStatusLabels: Record<string, string> = {
  pending: '待评审',
  reviewing: '评审中',
  approved: '已通过',
  issue: '有问题',
}

export const issueTypeLabels: Record<string, string> = {
  unclear_entry: '入口不清',
  missing_state: '状态缺失',
  uncovered_exception: '异常未覆盖',
  copy_risk: '文案风险',
  dev_cost: '研发成本',
  other: '其他',
}

export const syncStatusLabels: Record<string, string> = {
  pending: '待同步',
  syncing: '同步中',
  synced: '已同步',
}

export interface User {
  id: number
  username: string
  role: string
  created_at: string
}

export interface Scheme {
  id: number
  name: string
  business_goal: string | null
  user_roles: string[]
  key_flows: string[]
  prototype_link: string | null
  state_diagram: string | null
  review_scope: string | null
  status: string
  created_by: number | null
  created_by_username: string
  step_count?: number
  comment_count?: number
  created_at: string
  updated_at: string
}

export interface Step {
  id: number
  scheme_id: number
  title: string
  description: string | null
  step_order: number
  entry_condition: string | null
  expected_result: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  step_id: number
  author_id: number
  author_name: string
  author_role: string
  content: string
  issue_type: string | null
  parent_comment_id: number | null
  resolved: number
  replies?: Comment[]
  step_title?: string
  scheme_id?: number
  created_at: string
  updated_at: string
}

export interface Decision {
  id: number
  scheme_id: number
  dispute_point: string
  alternatives: string[]
  chosen_index: number
  reason: string | null
  affected_pages: string[]
  verification_method: string | null
  created_by: number | null
  created_by_username: string
  created_at: string
  updated_at: string
}

export interface Change {
  id: number
  scheme_id: number
  version: string | null
  summary: string | null
  related_requirements: string[]
  pending_sync: string[]
  sync_status: string
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface IssueTypeCount {
  type: string
  count: number
}

export interface IssueWithComments {
  issueTypes: IssueTypeCount[]
  topIssues: Comment[]
}

export interface SchemeRound {
  id: number
  name: string
  status: string
  step_count: number
  comment_count: number
  approved_step_count: number
}
