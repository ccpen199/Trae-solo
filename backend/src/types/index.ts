export interface User {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'operation' | 'lecturer' | 'legal' | 'customer_service';
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Lecturer {
  id: number;
  name: string;
  id_card?: string;
  phone?: string;
  email?: string;
  contract_no?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  status: 'active' | 'inactive' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  course_code: string;
  name: string;
  description?: string;
  lecturer_id?: number;
  category?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'offline';
  price: number;
  is_free: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  lecturer?: Lecturer;
}

export interface Material {
  id: number;
  material_code: string;
  name: string;
  type: 'video' | 'courseware' | 'handout' | 'question_bank' | 'authorization' | 'other';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  duration?: number;
  course_id?: number;
  lecturer_id?: number;
  source?: 'original' | 'authorized' | 'public_domain' | 'unknown';
  authorization_status: 'pending' | 'authorized' | 'unauthorized' | 'expired';
  authorization_file_id?: number;
  authorization_start_date?: string;
  authorization_end_date?: string;
  usage_scope?: 'internal' | 'commercial' | 'non_commercial' | 'limited';
  usage_scope_detail?: string;
  watermark_strategy?: 'none' | 'text' | 'image' | 'embedded';
  watermark_content?: string;
  download_permission: number;
  status: 'active' | 'inactive' | 'archived';
  md5_hash?: string;
  version: string;
  description?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  course?: Course;
  lecturer?: Lecturer;
}

export interface MaterialAuthorization {
  id: number;
  material_id: number;
  authorization_file_id?: number;
  authorization_no?: string;
  authorization_type?: 'exclusive' | 'non_exclusive' | 'sublicense';
  authorized_party?: string;
  authorizing_party?: string;
  start_date?: string;
  end_date?: string;
  territory?: string;
  terms?: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
}

export interface PublicationReview {
  id: number;
  course_id: number;
  reviewer_id?: number;
  review_status: 'pending' | 'approved' | 'rejected';
  authorization_verified: number;
  source_verified: number;
  watermark_configured: number;
  download_permission_set: number;
  validity_verified: number;
  issues?: string;
  suggestions?: string;
  reviewed_at?: string;
  created_at: string;
  course?: Course;
  reviewer?: User;
}

export interface PiracyClue {
  id: number;
  clue_no: string;
  source_channel?: 'online_search' | 'user_report' | 'internal_monitor' | 'third_party' | 'other';
  infringing_url?: string;
  infringing_platform?: string;
  infringing_content?: string;
  similarity_score?: number;
  related_course_id?: number;
  related_material_id?: number;
  impact_scope?: 'minor' | 'moderate' | 'major' | 'critical';
  estimated_loss?: number;
  evidence_screenshots?: string;
  evidence_description?: string;
  status: 'pending' | 'investigating' | 'confirmed' | 'processing' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  discovered_date?: string;
  discovered_by?: number;
  assigned_to?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  course?: Course;
  material?: Material;
  discoverer?: User;
  assignee?: User;
}

export interface EnforcementCase {
  id: number;
  case_no: string;
  piracy_clue_id: number;
  case_type?: 'takedown' | 'cease_and_desist' | 'lawsuit' | 'settlement';
  status: 'notice_sent' | 'platform_notified' | 'lawyer_letter_sent' | 'takedown_confirmed' | 'reviewing' | 'closed' | 'appealing';
  related_course_id?: number;
  related_material_id?: number;
  infringing_url?: string;
  infringing_platform?: string;
  notice_sent_date?: string;
  platform_response_date?: string;
  lawyer_letter_sent_date?: string;
  takedown_date?: string;
  settlement_amount?: number;
  result_description?: string;
  handled_by?: number;
  created_at: string;
  updated_at: string;
  clue?: PiracyClue;
  course?: Course;
  handler?: User;
}

export interface EnforcementAttachment {
  id: number;
  case_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  attachment_type?: 'evidence' | 'notice' | 'lawyer_letter' | 'response' | 'other';
  description?: string;
  uploaded_by?: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  module: string;
  record_id?: number;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  total_courses: number;
  total_materials: number;
  pending_reviews: number;
  active_piracy_clues: number;
  active_enforcement_cases: number;
  unauthorized_materials: number;
  expiring_soon_materials: number;
}
