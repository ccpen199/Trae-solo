export interface GovernmentService {
  id: string;
  name: string;
  category: 'personal' | 'enterprise' | 'life';
  bureau: string;
  icon: string;
  description: string;
  processingTime: string;
  visitCount: number;
  tags: string[];
  isOneStop?: boolean;
}

export interface Credential {
  id: string;
  name: string;
  type: 'id_card' | 'passport' | 'driver_license' | 'social_security' | 'household' | 'marriage' | 'business_license';
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  qrCode?: string;
}

export interface ServiceProgress {
  id: string;
  serviceName: string;
  applicationNo: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  submittedAt: string;
  estimatedDate: string;
  currentStep: number;
  totalSteps: number;
  steps: { name: string; status: 'pending' | 'current' | 'completed'; time?: string }[];
  bureau: string;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  issuer: string;
  publishDate: string;
  matchingScore: number;
  summary: string;
  tags: string[];
}

export interface EnterpriseService {
  id: string;
  name: string;
  type: 'establish' | 'cancel' | 'subsidy' | 'tax' | 'permit';
  description: string;
  duration: string;
  steps: { title: string; desc: string; required: boolean; bureau?: string }[];
  requiredMaterials: string[];
}

export interface TransitInfo {
  id: string;
  line: string;
  station: string;
  direction: string;
  nextArrival: number;
  nextNextArrival: number;
  status: 'normal' | 'delay' | 'suspended';
}

export interface HospitalAppointment {
  id: string;
  hospital: string;
  level: string;
  department: string;
  doctor: string;
  title: string;
  date: string;
  timeSlots: { time: string; available: number; total: number }[];
  fee: number;
}

export interface VenueInfo {
  id: string;
  name: string;
  type: 'library' | 'gym' | 'museum' | 'stadium' | 'community';
  address: string;
  capacity: number;
  currentUsage: number;
  todayOpening: string;
  image?: string;
}

export interface GridEvent {
  id: string;
  title: string;
  type: 'environmental' | 'traffic' | 'infrastructure' | 'civil' | 'safety';
  level: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  reporter: string;
  reportTime: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  handler: string;
  progress: number;
}

export interface DemographicData {
  ageGroup: string;
  male: number;
  female: number;
}

export interface AppealCategory {
  category: string;
  count: number;
}
