export type WorkerRole = 'nanny' | 'cleaner' | 'maternity';

export type OrderMode = 'grab' | 'dispatch';

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export type ServiceNodeStatus = 'pending' | 'completed';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'worker' | 'employer' | 'expert';
  phone: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  user_id: string;
  name: string;
  id_card: string;
  role: WorkerRole;
  avatar?: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  experience_years: number;
  native_place: string;
  education: string;
  skills: string;
  languages: string;
  certificates: string;
  health_report_url?: string;
  health_report_expiry?: string;
  lbs_fence: string;
  service_cities: string;
  rating: number;
  review_count: number;
  order_count: number;
  status: 'active' | 'inactive' | 'pending_review';
  created_at: string;
  updated_at: string;
}

export interface SkillCertificate {
  id: string;
  worker_id: string;
  certificate_type: string;
  certificate_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date?: string;
  image_url: string;
  ocr_data: string;
  verified: boolean;
  created_at: string;
}

export interface Employer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  longitude: number;
  latitude: number;
  family_members: number;
  special_requirements: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  employer_id: string;
  worker_id?: string;
  mode: OrderMode;
  service_type: WorkerRole;
  title: string;
  description: string;
  duration_hours: number;
  frequency: string;
  start_date: string;
  end_date?: string;
  work_times: string;
  budget_min: number;
  budget_max: number;
  special_requirements: string;
  status: OrderStatus;
  longitude: number;
  latitude: number;
  address: string;
  city: string;
  district: string;
  checkin_gps?: string;
  checkin_face_verified: boolean;
  checkin_time?: string;
  checkout_time?: string;
  actual_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceNode {
  id: string;
  order_id: string;
  node_name: string;
  node_description: string;
  status: ServiceNodeStatus;
  completed_at?: string;
  note?: string;
  image_url?: string;
  created_at: string;
}

export interface GrabOrderRecord {
  id: string;
  order_id: string;
  worker_id: string;
  grab_time: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  video_url: string;
  duration: number;
  category: WorkerRole | 'general';
  level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
}

export interface TrainingQuiz {
  id: string;
  course_id: string;
  question: string;
  options: string;
  correct_answer: number;
  created_at: string;
}

export interface TrainingProgress {
  id: string;
  worker_id: string;
  course_id: string;
  progress: number;
  quiz_score?: number;
  completed: boolean;
  certificate_url?: string;
  certificate_hash?: string;
  completed_at?: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  user_role: string;
  title: string;
  content: string;
  tags: string;
  is_private: boolean;
  is_answered: boolean;
  expert_id?: string;
  expert_answer?: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface InsurancePolicy {
  id: string;
  worker_id: string;
  order_id?: string;
  policy_number: string;
  insurance_type: string;
  coverage_amount: number;
  premium: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

export interface DisputeTicket {
  id: string;
  order_id: string;
  reporter_id: string;
  reporter_type: 'worker' | 'employer';
  title: string;
  description: string;
  evidence: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  resolution?: string;
  handler_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryRecord {
  id: string;
  worker_id: string;
  order_id: string;
  amount: number;
  bank_card: string;
  bank_name: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface ServiceGrid {
  id: string;
  city: string;
  district: string;
  worker_capacity: number;
  current_workers: number;
  order_demand: number;
  min_rating: number;
  max_orders_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface ConversionFunnel {
  id: string;
  date: string;
  city: string;
  worker_role: WorkerRole;
  registered_workers: number;
  certified_workers: number;
  online_workers: number;
  order_received: number;
  order_accepted: number;
  order_completed: number;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  employer_id: string;
  worker_id: string;
  rating: number;
  content: string;
  tags: string;
  created_at: string;
}
