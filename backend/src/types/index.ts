export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface JwtPayload {
  userId: number;
  role: 'worker' | 'enterprise' | 'admin';
  phone: string;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

export interface User {
  id: number;
  role: 'worker' | 'enterprise' | 'admin';
  phone: string;
  password_hash: string;
  real_name?: string;
  id_card_number?: string;
  avatar_url?: string;
  face_verified: number;
  face_data?: string;
  status: 'active' | 'disabled' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: number;
  user_id: number;
  gender?: 'male' | 'female';
  age?: number;
  work_years: number;
  hometown?: string;
  current_location?: string;
  primary_skill?: string;
  secondary_skills?: string;
  daily_wage_expected: number;
  craftsman_level: number;
  craftsman_score: number;
  quality_score: number;
  peer_score: number;
  attendance_score: number;
  total_projects: number;
  total_work_days: number;
  bio?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Enterprise {
  id: number;
  user_id: number;
  company_name: string;
  unified_social_code?: string;
  business_license_url?: string;
  legal_person?: string;
  legal_person_id_card?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  industry_type?: string;
  registered_capital?: number;
  verified: number;
  verified_by?: number;
  verified_at?: string;
  credit_score: number;
  total_projects: number;
  total_workers_hired: number;
  created_at: string;
  updated_at: string;
}

export interface JobPost {
  id: number;
  enterprise_id: number;
  title: string;
  skill_required: string;
  workers_needed: number;
  start_date: string;
  end_date: string;
  daily_wage: number;
  work_location: string;
  latitude?: number;
  longitude?: number;
  geofence_radius: number;
  accommodation_provided: number;
  accommodation_detail?: string;
  meals_provided: number;
  meals_detail?: string;
  insurance_provided: number;
  insurance_detail?: string;
  work_hours?: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  wage_deposit_amount: number;
  deposit_paid: number;
  created_at: string;
  updated_at: string;
}

export type JobApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';

export interface JobApplication {
  id: number;
  job_post_id: number;
  worker_id: number;
  application_status: JobApplicationStatus;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  hire_date?: string;
  completion_date?: string;
  worker_signoff: number;
  worker_signoff_at?: string;
  enterprise_confirm: number;
  enterprise_confirm_at?: string;
  notes?: string;
}

export type AttendanceStatus = 'normal' | 'late' | 'early_leave' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: number;
  job_application_id: number;
  worker_id: number;
  job_post_id: number;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_lat?: number;
  check_in_lng?: number;
  check_out_lat?: number;
  check_out_lng?: number;
  check_in_valid: number;
  check_out_valid: number;
  offline_mode: number;
  work_hours: number;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
}

export interface QualityInspection {
  id: number;
  job_application_id: number;
  worker_id: number;
  inspector_id?: number;
  inspection_date: string;
  quality_score: number;
  inspection_items?: string;
  issues_found?: string;
  rectification_required: number;
  rectification_completed: number;
  photos?: string;
  remarks?: string;
  created_at: string;
}

export interface PeerReview {
  id: number;
  job_post_id: number;
  reviewer_worker_id: number;
  target_worker_id: number;
  review_score: number;
  teamwork_score: number;
  skill_score: number;
  attitude_score: number;
  review_content?: string;
  created_at: string;
}

export type WageGuaranteeStatus = 'locked' | 'partial_released' | 'fully_released' | 'refunded';

export interface WageGuarantee {
  id: number;
  job_post_id: number;
  enterprise_id: number;
  guarantee_no: string;
  deposit_amount: number;
  paid_amount: number;
  payment_method?: string;
  payment_order_no?: string;
  payment_time?: string;
  release_status: WageGuaranteeStatus;
  total_released: number;
  escrow_account?: string;
  created_at: string;
  updated_at: string;
}

export type WageReleaseStatus = 'pending' | 'processing' | 'released' | 'failed' | 'held';

export interface WageRelease {
  id: number;
  wage_guarantee_id: number;
  job_application_id: number;
  worker_id: number;
  release_no: string;
  amount: number;
  release_reason: string;
  scheduled_release_date: string;
  actual_release_date?: string;
  status: WageReleaseStatus;
  bank_name?: string;
  bank_account?: string;
  account_holder?: string;
  payslip_url?: string;
  created_at: string;
}

export interface Certificate {
  id: number;
  worker_id: number;
  cert_type: string;
  cert_name: string;
  cert_number?: string;
  issue_date?: string;
  expire_date?: string;
  cert_image_url?: string;
  verified: number;
  created_at: string;
}

export interface Contract {
  id: number;
  job_application_id: number;
  contract_no: string;
  contract_content: string;
  total_amount: number;
  signed_by_worker: number;
  signed_by_enterprise: number;
  worker_signed_at?: string;
  enterprise_signed_at?: string;
  status: string;
  created_at: string;
}

export type AlertType = 'contract_breach' | 'wage_delay' | 'attendance_abnormal' | 'quality_issue' | 'credit_risk';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'ignored';

export interface RiskAlert {
  id: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  related_type?: string;
  related_id?: number;
  enterprise_id?: number;
  worker_id?: number;
  title: string;
  description?: string;
  data_context?: string;
  status: AlertStatus;
  handled_by?: number;
  handled_at?: string;
  handling_notes?: string;
  created_at: string;
  updated_at: string;
}
