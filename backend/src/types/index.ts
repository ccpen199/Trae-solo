export interface Transfer {
  id: number;
  transfer_no: string;
  patient_id: number;
  patient_name: string;
  from_hospital_id: number;
  from_hospital_name: string;
  from_department: string;
  from_doctor_id: number;
  from_doctor_name: string;
  to_hospital_id: number;
  to_hospital_name: string;
  to_department: string;
  to_doctor_id: number;
  to_doctor_name: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  primary_diagnosis: string;
  transfer_reason: string;
  current_condition: string;
  treatment_history: string;
  examination_results: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'supplement' | 'rejected' | 'coordinating' | 'transiting' | 'completed' | 'cancelled';
  rejection_reason?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  transfer_id: number;
  reviewer_id: number;
  reviewer_name: string;
  result: 'accepted' | 'supplement' | 'rejected';
  comments: string;
  supplement_requirements?: string;
  created_at: string;
}

export interface Coordination {
  id: number;
  transfer_id: number;
  coordinator_id: number;
  coordinator_name: string;
  bed_available: boolean;
  bed_number?: string;
  estimated_arrival_time?: string;
  preparation_notes: string;
  contact_person?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: number;
  transfer_id: number;
  arrival_time: string;
  received_by: number;
  received_by_name: string;
  patient_condition: string;
  diagnosis: string;
  treatment_given: string;
  admission_decision: 'admitted' | 'observed' | 'discharged' | 'transferred_again';
  ward?: string;
  bed_number?: string;
  notes?: string;
  created_at: string;
}

export interface Hospital {
  id: number;
  name: string;
  level: string;
  address: string;
  phone: string;
  departments: string;
  created_at: string;
}

export interface Doctor {
  id: number;
  hospital_id: number;
  hospital_name: string;
  name: string;
  department: string;
  title: string;
  phone: string;
  created_at: string;
}

export interface Patient {
  id: number;
  name: string;
  gender: 'male' | 'female';
  age: number;
  id_card: string;
  phone: string;
  address: string;
  medical_history?: string;
  allergies?: string;
  created_at: string;
}

export interface OperationLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  ip: string;
  details: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export type TransferStatus = Transfer['status'];
export type UrgencyLevel = Transfer['urgency'];
export type ReviewResult = Review['result'];
