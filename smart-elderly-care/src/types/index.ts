export type Role = 'government' | 'institution' | 'family'

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  level: number;
}

export interface HealthDevice {
  id: string;
  name: string;
  type: 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'fall_detector' | 'thermometer';
  lastReading: number;
  unit: string;
  status: 'online' | 'offline' | 'alert';
  lastUpdate: string;
  alertThreshold?: { min: number; max: number };
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeSlots: string[];
  startDate: string;
  endDate: string;
  adherence: number;
  isActive: boolean;
}

export interface ElderProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  healthLevel: 'healthy' | 'mild' | 'moderate' | 'severe';
  address: string;
  phone: string;
  idNumber: string;
  emergencyContacts: EmergencyContact[];
  healthDevices: HealthDevice[];
  medications: Medication[];
  avatar: string;
  bloodType: string;
  allergies: string[];
  chronicDiseases: string[];
}

export interface InspectionRecord {
  id: string;
  date: string;
  inspector: string;
  score: number;
  issues: string[];
  status: 'passed' | 'failed' | 'pending';
}

export interface Institution {
  id: string;
  name: string;
  address: string;
  starRating: 1 | 2 | 3 | 4 | 5;
  totalBeds: number;
  availableBeds: number;
  contactPhone: string;
  services: string[];
  inspectionRecords: InspectionRecord[];
  licenseNumber: string;
  established: string;
}

export interface ServiceOrder {
  id: string;
  elderId: string;
  elderName: string;
  type: 'bathing' | 'meal_delivery' | 'medical_escort' | 'cleaning' | 'companionship' | 'rehabilitation';
  serviceProviderId: string;
  serviceProviderName: string;
  serviceProviderCert: string;
  scheduledTime: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  createdAt: string;
  completedAt?: string;
}

export interface GovDashboard {
  regionAgingRate: number;
  totalElders: number;
  totalInstitutions: number;
  totalSubsidy: number;
  subsidyPrecision: number;
  complaintCount: number;
  complaintResolutionRate: number;
  serviceOrderCount: number;
  completedOrderRate: number;
}

export interface NursingTask {
  id: string;
  content: string;
  frequency: string;
  timeSlot: string;
  assignedTo: string;
  completedDates: string[];
  status: 'pending' | 'completed' | 'missed';
}

export interface NursingPlan {
  id: string;
  elderId: string;
  elderName: string;
  planName: string;
  startDate: string;
  endDate: string;
  tasks: NursingTask[];
  status: 'active' | 'completed' | 'paused';
}

export interface AuditEntry {
  id: string;
  action: string;
  operator: string;
  timestamp: string;
  details: string;
}

export interface SubsidyRecord {
  id: string;
  elderId: string;
  elderName: string;
  amount: number;
  type: 'pension' | 'disability' | 'nursing' | 'medical';
  status: 'approved' | 'pending' | 'disbursed' | 'rejected';
  appliedDate: string;
  approvedDate?: string;
  disbursedDate?: string;
  auditTrail: AuditEntry[];
}

export interface BehaviorAlert {
  id: string;
  elderId: string;
  elderName: string;
  type: 'fall' | 'wandering' | 'medication_miss' | 'abnormal_vital' | 'inactivity';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ChainStep {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  handler?: string;
  time?: string;
  remark?: string;
}

export interface TimelineEvent {
  time: string;
  title: string;
  operator: string;
  detail: string;
}

export interface ReviewRecord {
  id: string;
  time: string;
  reviewer: string;
  content: string;
  result: 'satisfied' | 'normal' | 'dissatisfied';
}

export interface ComplaintRecord {
  id: string;
  elderId: string;
  elderName: string;
  content: string;
  type: 'service_quality' | 'subsidy' | 'facility' | 'personnel';
  status: 'submitted' | 'processing' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  institutionId?: string;
  institutionName?: string;
  handler?: string;
  processingDuration?: string;
  closureRate?: number;
  chain?: ChainStep[];
  timeline?: TimelineEvent[];
  reviews?: ReviewRecord[];
  relatedOrderId?: string;
}
