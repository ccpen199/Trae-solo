export type ServiceCategory = 
  | 'grooming' 
  | 'deworming' 
  | 'vaccination' 
  | 'checkup_basic' 
  | 'checkup_deep' 
  | 'dental' 
  | 'surgery' 
  | 'specialty';

export interface SOPStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  requirePhoto: boolean;
  requireNote?: boolean;
  name?: string;
}

export interface ServiceSOP {
  id: string;
  serviceId: string;
  name: string;
  steps: SOPStep[];
  estimatedDuration: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  basePrice: number;
  originalPrice?: number;
  storeIds: string[];
  requiresVet: boolean;
  sopSteps: SOPStep[];
}

export type AppointmentStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'paid' 
  | 'in_service' 
  | 'completed' 
  | 'cancelled';

export interface ServiceTrace {
  id: string;
  appointmentId: string;
  stepId: string;
  stepIndex: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt: string;
  completedBy: string;
  photos?: string[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  beforeImageUrl?: string;
  afterImageUrl?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  orderNo: string;
  ownerId: string;
  ownerName?: string;
  petId: string;
  petName?: string;
  serviceId: string;
  serviceName?: string;
  storeId: string;
  veterinarianId?: string;
  staffId?: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: AppointmentStatus;
  totalPrice: number;
  paidAmount?: number;
  couponId?: string;
  notes?: string;
  createdAt: string;
  serviceTraces: ServiceTrace[];
  traceRecords?: ServiceTrace[];
}

export interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  serviceIds: string[];
  businessHours: BusinessHour[];
}

export type StaffRole = 'groomer' | 'veterinarian' | 'receptionist' | 'manager';

export interface Staff {
  id: string;
  storeId: string;
  name: string;
  role: StaffRole;
  color: string;
  avatar?: string;
  services: string[];
}

export interface Employee {
  id: string;
  storeId: string;
  name: string;
  position: string;
  role: StaffRole;
  avatar?: string;
  phone?: string;
}

export interface Schedule {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'leave' | 'break';
}

export interface StaffSchedule {
  id: string;
  storeId: string;
  employeeId: string;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'full' | 'night';
  createdAt: string;
}
