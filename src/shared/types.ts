export interface User {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  userType: 'citizen' | 'enterprise' | 'staff' | 'admin';
  authLevel: number;
  avatar?: string;
  createdAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
  caCertificate?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  type: 'id_card' | 'household' | 'social_security' | 'marriage' | 'other';
  isElectronic: boolean;
  required: boolean;
  description: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'upload';
  required: boolean;
  prefillSource?: string;
  options?: { label: string; value: string }[];
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  departmentId: string;
  department: string;
  description: string;
  handlingTime: string;
  requiredMaterials: MaterialItem[];
  formFields: FormField[];
  hotLevel: number;
  isOnline: boolean;
}

export interface UploadedMaterial {
  id: string;
  materialId: string;
  name: string;
  type: 'ocr' | 'upload' | 'electronic';
  url: string;
  ocrResult?: Record<string, any>;
  verified: boolean;
}

export interface Application {
  id: string;
  serviceId: string;
  serviceName: string;
  applicantId: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'supplement' | 'approved' | 'rejected';
  formData: Record<string, any>;
  materials: UploadedMaterial[];
  currentStep: number;
  totalSteps: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime: string;
}

export interface ApplicationLog {
  id: string;
  applicationId: string;
  action: string;
  remark: string;
  operatorId: string;
  createdAt: Date;
}

export interface Certificate {
  id: string;
  userId: string;
  type: 'id_card' | 'household' | 'social_security' | 'marriage' | 'birth' | 'real_estate' | 'business_license' | 'other';
  certificateNumber: string;
  name: string;
  issueDate: Date;
  expiryDate: Date;
  issuer: string;
  imageUrl: string;
  isValid: boolean;
}

export interface GuideStep {
  step: number;
  title: string;
  description: string;
  department: string;
  duration: string;
}

export interface GuideResponse {
  intent: string;
  matchedServices: ServiceItem[];
  handlingPath: GuideStep[];
  materialList: MaterialItem[];
  estimatedTime: string;
}

export interface PerformanceData {
  date: string;
  totalApplications: number;
  completedCount: number;
  completionRate: number;
  averageHandlingTime: number;
  rejectionCount: number;
  rejectionReasons: { reason: string; count: number }[];
}

export interface SystemStatus {
  id: string;
  name: string;
  departmentId: string;
  department: string;
  status: 'normal' | 'warning' | 'error';
  responseTime: number;
  lastChecked: Date;
  isFailover: boolean;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  content: string;
  eligibilityCriteria: Record<string, any>;
  effectiveDate: Date;
  expiryDate: Date;
}

export interface PolicyMatch {
  id: string;
  userId: string;
  policyId: string;
  policy: Policy;
  matchScore: number;
  matchedCriteria: Record<string, any>;
  matchedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'card' | 'list';
  data?: any;
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon: string;
  gradient: 'blue' | 'orange' | 'green' | 'purple';
}

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}
