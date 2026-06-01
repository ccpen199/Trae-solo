export interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AgreementPrice {
  institutionId: number;
  price: number;
}

export interface ComplianceReview {
  id: number;
  date: string;
  result: 'pass' | 'fail' | 'pending';
  reviewer: string;
  remark: string;
}

export interface Doctor {
  id: number;
  name: string;
  licenseNo: string;
  specialty: string;
  title: string;
  practiceScope: string;
  status: 'active' | 'pending' | 'suspended';
  availableInstitutions: number[];
  availableTimeSlots?: TimeSlot[];
  agreementPrices?: AgreementPrice[];
  visitPrice: number;
  complianceStatus?: string;
  practiceCertExpiry?: string;
  complianceReviews?: ComplianceReview[];
  createdAt: string;
}

export interface Department {
  id: number;
  institutionId: number;
  name: string;
  roomCount: number;
  slotCount: number;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  serviceTypes: string[];
  createdAt: string;
}

export interface Institution {
  id: number;
  name: string;
  departments: Department[];
  address: string;
  contact: string;
  minQualification: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Schedule {
  id: number;
  doctorId: number;
  institutionId: number;
  departmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  slotCount: number;
  bookedCount?: number;
  status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  conflicts: ConflictItem[];
  isHospitalShift?: number;
  createdAt: string;
}

export interface Appointment {
  id: number;
  scheduleId: number;
  patientName: string;
  patientPhone: string;
  slotTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  rescheduledFrom?: number;
  notificationLog?: string;
  createdAt: string;
}

export interface Settlement {
  id: number;
  period: string;
  doctorId: number;
  institutionId: number;
  visitCount: number;
  totalIncome: number;
  defaultCount: number;
  status: 'pending' | 'settled';
  createdAt: string;
}

export interface ConflictItem {
  type: 'hospital_shift' | 'cross_institution' | 'practice_scope' | 'rest_time';
  severity: 'warning' | 'error';
  message: string;
}

export interface DashboardStats {
  doctorCount: number;
  institutionCount: number;
  scheduleCount: number;
  appointmentCount: number;
  pendingSettlementAmount: number;
  monthlyVisits: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
