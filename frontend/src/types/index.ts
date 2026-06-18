export type WorkerRole = 'nanny' | 'cleaner' | 'maternity';

export type OrderMode = 'grab' | 'dispatch';

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export const WorkerRoleMap: Record<WorkerRole, string> = {
  nanny: '保姆',
  cleaner: '保洁',
  maternity: '月嫂',
};

export const OrderModeMap: Record<OrderMode, string> = {
  grab: '抢单制',
  dispatch: '派单制',
};

export const OrderStatusMap: Record<OrderStatus, string> = {
  pending: '待接单',
  accepted: '已接单',
  in_progress: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  disputed: '纠纷中',
};

export const OrderStatusColor: Record<OrderStatus, string> = {
  pending: 'orange',
  accepted: 'blue',
  in_progress: 'cyan',
  completed: 'green',
  cancelled: 'default',
  disputed: 'red',
};

export const FrequencyMap: Record<string, string> = {
  once: '单次',
  daily: '每日',
  weekly: '每周',
  biweekly: '双周',
  monthly: '每月',
};

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'worker' | 'employer' | 'expert';
  phone: string;
  avatar?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  experience_years: number;
  native_place: string;
  education: string;
  skills: string[];
  languages: string[];
  rating: number;
  review_count: number;
  order_count: number;
  completed_orders?: number;
  status: 'active' | 'inactive' | 'pending_review';
  health_report_url?: string;
  health_report_expiry?: string;
  service_cities_data?: string[];
  lbs_fence_data?: any;
  certificates_data?: any[];
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
  verified: boolean;
}

export interface Employer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  longitude: number;
  latitude: number;
  family_members: number;
  total_orders?: number;
  completed_orders?: number;
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
  budget_min: number;
  budget_max: number;
  special_requirements_data?: string[];
  status: OrderStatus;
  address: string;
  city: string;
  district: string;
  worker_name?: string;
  employer_name?: string;
  employer_phone?: string;
  completed_nodes?: number;
  total_nodes?: number;
  actual_amount?: number;
  checkin_time?: string;
  checkout_time?: string;
  checkin_face_verified?: boolean;
}

export interface ServiceNode {
  id: string;
  order_id: string;
  node_name: string;
  node_description: string;
  status: 'pending' | 'completed';
  completed_at?: string;
  note?: string;
}

export interface GrabRecord {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_rating: number;
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
  completed_count?: number;
}

export interface TrainingQuiz {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  user_role: string;
  username?: string;
  avatar?: string;
  title: string;
  content: string;
  tags: string;
  is_private: boolean;
  is_answered: boolean;
  expert_answer?: string;
  view_count: number;
  like_count: number;
  comment_count?: number;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  user_id: string;
  username: string;
  role: string;
  content: string;
  created_at: string;
}

export interface InsurancePolicy {
  id: string;
  policy_number: string;
  insurance_type: string;
  coverage_amount: number;
  premium: number;
  start_date: string;
  end_date: string;
  status: string;
  worker_name?: string;
  order_title?: string;
}

export interface DisputeTicket {
  id: string;
  order_id: string;
  reporter_type: string;
  title: string;
  description: string;
  status: string;
  resolution?: string;
  order_title?: string;
  worker_name?: string;
  employer_name?: string;
  created_at?: string;
  order_amount?: number;
}

export interface SalaryRecord {
  id: string;
  worker_id: string;
  worker_name?: string;
  order_title?: string;
  amount: number;
  bank_card: string;
  bank_name: string;
  status: string;
  transaction_id?: string;
  paid_at?: string;
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
  actual_workers?: number;
  grid_orders?: number;
}

export interface FunnelStep {
  name: string;
  value: number;
  rate: string;
}
