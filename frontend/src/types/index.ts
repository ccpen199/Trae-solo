export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'surveyor' | 'assessor' | 'reviewer' | 'service';
  phone?: string;
  created_at: string;
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
  handler_name?: string;
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
  uploader_name?: string;
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
  creator_name?: string;
}

export interface Part {
  code: string;
  name: string;
}

export const PHOTO_CATEGORY_MAP: Record<string, string> = {
  accident_overview: '事故现场全景',
  vehicle_damage: '车辆损失细节',
  vin_number: '车架号/VIN码',
  id_card: '身份证',
  driver_license: '驾驶证',
  vehicle_license: '行驶证',
  other: '其他',
};

export const TASK_STATUS_MAP: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  surveying: '查勘中',
  assessing: '定损中',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已驳回',
};

export const TASK_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  surveying: 'cyan',
  assessing: 'orange',
  reviewing: 'purple',
  completed: 'green',
  rejected: 'red',
};

export const ROLE_MAP: Record<string, string> = {
  admin: '系统管理员',
  surveyor: '查勘员',
  assessor: '定损员',
  reviewer: '审核员',
  service: '客服',
};
