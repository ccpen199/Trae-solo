export interface User {
  id: number
  username: string
  email?: string
  role: string
  is_active: boolean
  created_at: string
}

export interface FormField {
  id?: number
  field_name: string
  field_label: string
  field_type: string
  is_required: boolean
  is_unique: boolean
  default_value?: string
  validation_rules: Record<string, any>
  options: Array<{ label: string; value: string }>
  sort_order: number
}

export interface FormLogic {
  id?: number
  logic_type: string
  name: string
  dsl_code: string
  is_active: boolean
}

export interface FormDefinition {
  id: number
  name: string
  code: string
  description?: string
  status: 'draft' | 'designing' | 'published' | 'archived'
  schema_json?: Record<string, any>
  table_name?: string
  creator_id: number
  created_at: string
  updated_at?: string
  published_at?: string
  version: number
}

export interface FormDetail extends FormDefinition {
  fields: FormField[]
  logics: FormLogic[]
}

export interface FormSubmission {
  id: number
  form_id: number
  user_id: number
  submission_data: Record<string, any>
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'withdrawn'
  version: number
  created_at: string
  updated_at?: string
  submitted_at?: string
}

export interface SubmissionHistory {
  version: number
  status: string
  data: Record<string, any>
  created_at: string
}

export interface Notification {
  id: number
  title: string
  content: string
  notification_type: string
  resource_type?: string
  resource_id?: number
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: number
  action: string
  action_display: string
  resource_type: string
  resource_id: number
  details: Record<string, any>
  ip_address?: string
  created_at: string
}

export interface PageResult<T> {
  total: number
  page: number
  page_size: number
  data: T[]
}
