export interface User {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  role: 'citizen' | 'enterprise' | 'dept_admin' | 'data_admin';
  verified: boolean;
  avatar: string;
}

export interface ServiceDomain {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  serviceCount: number;
}

export interface ServiceItem {
  id: string;
  domainId: string;
  name: string;
  department: string;
  description: string;
  requiredDocuments: string[];
  processTime: string;
  fee: string;
  onlineEnabled: boolean;
  rating: number;
  applicationCount: number;
  tags: string[];
}

export interface Application {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  currentStep: number;
  steps: ApplicationStep[];
  createdAt: string;
  updatedAt: string;
  result?: {
    type: 'certificate' | 'notification' | 'permit';
    content: string;
    issueDate: string;
  };
}

export interface ApplicationStep {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  completedAt?: string;
  assignee?: string;
  notes?: string;
}

export interface Certificate {
  id: string;
  type: string;
  typeName: string;
  holderName: string;
  holderIdCard: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  issuingAuthority: string;
  category: string;
  icon: string;
}

export interface DashboardStats {
  totalApplications: number;
  activeUsers: number;
  serviceAvailability: number;
  averageProcessTime: number;
  dailyTrend: { date: string; count: number }[];
  domainDistribution: { name: string; value: number }[];
  hourlyHeatmap: number[][];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string;
  result: 'success' | 'failure';
  details: string;
}

export interface CertificateType {
  id: string;
  name: string;
  category: string;
  issuingAuthority: string;
  description: string;
}

export interface CertificateAccessLog {
  id: string;
  time: string;
  certificateName: string;
  accessType: 'verify' | 'display' | 'share' | 'download';
  accessedBy: string;
  purpose: string;
  result: 'success' | 'denied';
}

export interface Announcement {
  id: string;
  title: string;
  type: 'policy' | 'maintenance' | 'reminder';
  date: string;
  content: string;
}
