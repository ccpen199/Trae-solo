export interface User {
  id: number;
  username: string | null;
  phone: string | null;
  role: 'worker' | 'employer' | 'admin' | 'platform' | 'ops' | 'university';
  nickname: string;
  avatar: string;
  status: 'active' | 'banned' | 'suspended';
  identity_tags: string[];
  skill_certs: string[];
  credit_score: number;
  employer_type: string;
  employer_name: string;
  business_license: string;
  university_name: string;
  created_at: string;
  updated_at: string;
}

export interface DemoAccount {
  username: string;
  password: string;
  role: string;
  nickname: string;
}

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  description: string;
  category: string;
  pay_type: 'daily' | 'weekly' | 'project' | 'online';
  pay_amount: number;
  pay_unit: string;
  location: string;
  lat: number;
  lng: number;
  work_start: string;
  work_end: string;
  safety_level: 1 | 2 | 3;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'closed';
  review_ocr_status: 'pending' | 'passed' | 'failed';
  review_ocr_result: string;
  review_site_status: 'pending' | 'passed' | 'failed';
  review_site_photos: string[];
  required_skills: string[];
  required_count: number;
  applied_count: number;
  employer_nickname?: string;
  employer_name?: string;
  employer_avatar?: string;
  employer_type?: string;
  business_license?: string;
  employer_created_at?: string;
  review_logs?: JobReviewLog[];
  created_at: string;
  updated_at: string;
}

export interface JobReviewLog {
  id: number;
  job_id: number;
  reviewer_id: number | null;
  review_type: 'ocr' | 'site' | 'status';
  old_status: string;
  new_status: string;
  result: string;
  reviewer_nickname?: string;
  created_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  worker_id: number;
  status: 'applied' | 'accepted' | 'rejected' | 'completed';
  cover_letter: string;
  nickname?: string;
  avatar?: string;
  identity_tags?: string[];
  skill_certs?: string[];
  credit_score?: number;
  worker_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  job_id: number;
  employer_id: number;
  worker_id: number;
  last_message: string;
  last_message_at: string;
  employer_nickname?: string;
  employer_avatar?: string;
  worker_nickname?: string;
  worker_avatar?: string;
  job_title?: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'system' | 'interview_invite';
  is_read: number;
  sender_nickname?: string;
  sender_avatar?: string;
  created_at: string;
}

export interface InterviewAppointment {
  id: number;
  conversation_id: number;
  job_id: number;
  proposed_time: string;
  confirmed_time: string;
  status: 'proposed' | 'confirmed' | 'cancelled';
  location: string;
  notes: string;
  created_at: string;
}

export interface Settlement {
  id: number;
  job_id: number;
  employer_id: number;
  worker_id: number;
  amount: number;
  platform_fee: number;
  actual_amount: number;
  status: 'frozen' | 'confirmed' | 'released' | 'failed';
  worker_bank_info: Record<string, string>;
  job_title?: string;
  employer_nickname?: string;
  worker_nickname?: string;
  created_at: string;
  released_at: string;
}

export interface RiskReport {
  id: number;
  reporter_id: number;
  target_employer_id: number | null;
  job_id: number | null;
  report_type: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  status: 'pending' | 'verified' | 'dismissed';
  reporter_nickname?: string;
  employer_nickname?: string;
  job_title?: string;
  created_at: string;
}

export interface BlacklistEntry {
  id: number;
  employer_id: number;
  reason: string;
  reported_count: number;
  employer_nickname?: string;
  employer_phone?: string;
  created_at: string;
}

export interface RiskMapPoint {
  lat: number;
  lng: number;
  count: number;
  types: string;
}

export interface UniversityPartner {
  id: number;
  university_name: string;
  contact_name: string;
  contact_phone: string;
  employment_office_code: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface InternshipCertificate {
  id: number;
  worker_id: number;
  job_id: number;
  university_partner_id: number;
  cert_number: string;
  issued_at: string;
  status: string;
  worker_nickname?: string;
  job_title?: string;
  university_name?: string;
}

export interface JobPushRule {
  id: number;
  university_partner_id: number;
  category: string;
  keywords: string[];
  target_roles: string[];
  university_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target_type: string;
  target_id: number;
  detail: Record<string, unknown>;
  ip_address: string;
  user_nickname?: string;
  created_at: string;
}

export interface OpinionAlert {
  id: number;
  job_id: number | null;
  alert_type: string;
  content_snippet: string;
  risk_score: number;
  status: 'pending' | 'reviewed' | 'dismissed';
  job_title?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
