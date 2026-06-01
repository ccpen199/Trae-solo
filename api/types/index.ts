export interface Doctor {
  id: number;
  name: string;
  licenseNo: string;
  specialty: string;
  title: string;
  practiceScope: string;
  status: 'active' | 'pending' | 'suspended';
  availableInstitutions: number[];
  visitPrice: number;
  complianceStatus?: string;
  practiceCertExpiry?: string;
  createdAt: string;
}

export interface Department {
  id: number;
  institutionId: number;
  name: string;
  roomCount: number;
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

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  operator: string;
  createdAt: string;
}

export interface CreateDoctorDto {
  name: string;
  licenseNo: string;
  specialty: string;
  title: string;
  practiceScope: string;
  status?: 'active' | 'pending' | 'suspended';
  availableInstitutions?: number[];
  visitPrice?: number;
  practiceCertExpiry?: string;
}

export interface UpdateDoctorDto extends Partial<CreateDoctorDto> {}

export interface CreateInstitutionDto {
  name: string;
  address?: string;
  contact?: string;
  minQualification?: string;
  status?: 'active' | 'inactive';
  departments?: Array<{ name: string; roomCount?: number }>;
}

export interface UpdateInstitutionDto extends Partial<CreateInstitutionDto> {}

export interface CreateScheduleDto {
  doctorId: number;
  institutionId: number;
  departmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  slotCount?: number;
  status?: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  isHospitalShift?: number;
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {}

export interface CreateAppointmentDto {
  scheduleId: number;
  patientName: string;
  patientPhone: string;
  slotTime: string;
}

export interface UpdateAppointmentDto {
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
}

export interface CalculateSettlementDto {
  period: string;
  doctorId?: number;
  institutionId?: number;
}

export interface DashboardStats {
  doctorCount: number;
  institutionCount: number;
  scheduleCount: number;
  appointmentCount: number;
  pendingSettlementAmount: number;
  monthlyVisits: number;
}
