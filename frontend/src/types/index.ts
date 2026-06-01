export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  roleName: string;
  roleDescription: string;
  permissions: string[];
}

export interface AgentProfile {
  id: number;
  name: string;
  description: string;
  model_config: Record<string, any>;
  tone_preferences: string[];
  variable_requirements: string[];
  approval_workflow: Record<string, any>;
  status: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerTag {
  id: number;
  name: string;
  category: string;
  color: string;
  description: string;
}

export interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  company_website: string;
  position: string;
  industry: string;
  company_size: string;
  region: string;
  decision_maker_level: string;
  
  purchase_intent: string;
  lifecycle_stage: string;
  followup_status: string;
  budget_range: string;
  expected_purchase_date: string;
  
  source_channel: string;
  first_contact_date: string | null;
  last_contact_date: string | null;
  total_emails_sent: number;
  total_emails_opened: number;
  total_replies: number;
  reply_rate: number;
  
  pain_points: string;
  interests: string;
  objections: string;
  key_requirements: string;
  competitor_used: string;
  
  internal_notes: string;
  status: string;
  is_sensitive: number;
  score: number;
  created_by: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  
  tags?: CustomerTag[];
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  tone: string;
  category: string;
  variable_fields: string[];
  status: string;
  version: number;
  created_by: number;
  created_by_name: string;
  approved_by: number;
  approved_by_name: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
}

export interface VariableField {
  id: number;
  name: string;
  key: string;
  type: string;
  required: number;
  default_value: string;
  description: string;
  validation_rules: Record<string, any>;
  status: string;
  created_at: string;
}

export interface EmailGeneration {
  id: number;
  agent_id: number;
  agent_name: string;
  template_id: number | null;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  is_sensitive?: number;
  subject: string;
  content: string;
  tone: string;
  variables: Record<string, string>;
  validation_result: {
    variables_valid: boolean;
    missing_fields: string[];
    warnings: string[];
  };
  status: string;
  preview_approved_by: number | null;
  preview_approved_at: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface SendRecord {
  id: number;
  generation_id: number;
  subject: string;
  customer_name: string;
  customer_email: string;
  sent_at: string;
  sent_by: number;
  sent_by_name: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  replies?: ReplyClassification[];
}

export interface ReplyClassification {
  id: number;
  send_record_id: number;
  reply_content: string;
  classification: string;
  confidence: number;
  classified_by: number;
  classified_by_name: string;
  classified_at: string;
  is_manual: number;
  notes: string;
  created_at: string;
}

export interface WorkbenchAlert {
  id: number;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  responsible_role: string;
  suggested_action: string;
  closing_criteria: string;
  related_entity_type: string;
  related_entity_id: number;
  status: string;
  assignee_id: number | null;
  assignee_name: string | null;
  closed_by: number | null;
  closed_by_name: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  operator_id: number;
  operator_name: string;
  reason: string;
  change_summary: string;
  old_values: string | null;
  new_values: string | null;
  affected_objects: string | null;
  recovery_path: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  total?: number;
  message?: string;
  error?: string;
}
