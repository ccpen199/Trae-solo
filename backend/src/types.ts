export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'surveyor' | 'assessor' | 'reviewer' | 'service';
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimTask {
  id: string;
  task_no: string;
  source: string;
  accident_location: string;
  accident_time: string;
  policy_no: string;
  policy_holder: string;
  vehicle_info: string;
  owner_name: string;
  owner_phone: string;
  appointment_time?: string;
  status: 'pending' | 'assigned' | 'surveying' | 'assessing' | 'reviewing' | 'completed' | 'rejected';
  current_handler_id?: string;
  is_overdue: number;
  overdue_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  task_id: string;
  category: string;
  file_path: string;
  file_name: string;
  file_size: number;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  watermark_info?: string;
  shoot_time: string;
  is_retake: number;
  original_photo_id?: string;
  retake_reason?: string;
  uploaded_by: string;
  created_at: string;
}

export interface LossItem {
  id: string;
  task_id: string;
  version: number;
  part: string;
  part_name: string;
  accessory?: string;
  accessory_name?: string;
  labor_fee: number;
  residual_value: number;
  total_amount: number;
  price_source: string;
  manual_adjust_reason?: string;
  remarks?: string;
  created_at: string;
  created_by: string;
}

export interface ReviewLog {
  id: string;
  task_id: string;
  version: number;
  reviewer_id: string;
  review_result: string;
  review_comments?: string;
  historical_risk?: string;
  created_at: string;
}
