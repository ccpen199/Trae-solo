export interface User {
  id: number;
  name: string;
  idCard: string;
  phone: string;
  email: string;
  userType: 'natural' | 'legal';
  roles: string[];
  avatar?: string;
}

export interface License {
  id: number;
  userId: number;
  licenseType: string;
  licenseNumber: string;
  holderName: string;
  data: any;
  status: 'valid' | 'expired' | 'invalid';
  issueDate: string;
  expiryDate?: string;
  issuedBy: string;
  createdAt: string;
}

export interface LicenseUsageRecord {
  id: number;
  licenseId: number;
  scenario: string;
  operator: string;
  location: string;
  createdAt: string;
}

export interface ServiceItem {
  id: number;
  name: string;
  code: string;
  category: string;
  department: string;
  handlingLimit: number;
  handlingTimeLimit?: number;
  handlingFee: string;
  description: string;
  materials: any[];
  materialList?: any[];
  scenarioGuide: any[];
  scenarioTree?: any;
  formSchema: any;
  status: 'active' | 'inactive';
  runningCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Application {
  id: number;
  applicationNo: string;
  serviceItemId: number;
  serviceItemName: string;
  serviceName?: string;
  userId: number;
  userName: string;
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'completed' | 'reviewing';
  formData: any;
  scenarioPath?: any[];
  materialHashList?: string[];
  materials: any[];
  currentNode: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
}

export interface TimelineEvent {
  id: number;
  applicationId: number;
  nodeName: string;
  status: 'completed' | 'pending' | 'processing' | 'rejected';
  operator: string;
  remark: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface LoginRequest {
  idCard: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'textarea' | 'radio';
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: any;
}

export interface MaterialItem {
  name: string;
  code: string;
  required: boolean;
  format: string;
  source: 'manual' | 'license' | 'ocr';
  licenseType?: string;
}

export interface ScenarioNode {
  id: string;
  question: string;
  options: { label: string; value: string; nextNode?: string; result?: any }[];
}

export interface QrCodeData {
  token: string;
  licenseType: string;
  licenseNumber: string;
  holderName: string;
  expiresAt: string;
  qrCode: string;
}
