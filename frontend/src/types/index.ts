export interface User {
  id: number;
  username: string;
  role: 'worker' | 'enterprise' | 'admin';
  realName?: string;
  phone?: string;
  idCard?: string;
  avatar?: string;
  status?: string;
}

export interface WorkerProfile {
  id?: number;
  userId?: number;
  gender?: string;
  birthDate?: string;
  address?: string;
  education?: string;
  workYears?: number;
  skillLevel?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  hasBiometricData?: number;
  biometricDeleted?: number;
}

export interface EnterpriseProfile {
  id?: number;
  userId?: number;
  companyName?: string;
  unifiedCreditCode?: string;
  businessLicense?: string;
  legalRepresentative?: string;
  contactPhone?: string;
  companyAddress?: string;
  qualificationLevel?: string;
}

export interface Trade {
  id: number;
  gbCode: string;
  gbName: string;
  category: string;
  description?: string;
}

export interface TradeCertification {
  id: number;
  workerId: number;
  tradeId: number;
  certificateNumber: string;
  certificateType: string;
  certificateImage?: string;
  ocrResult?: string;
  ocrConfidence?: number;
  verificationSource?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: number;
  gbCode?: string;
  gbName?: string;
  category?: string;
  workerName?: string;
  createdAt: string;
}

export interface SkillAssessment {
  id: number;
  workerId: number;
  tradeId: number;
  theoryScore?: number;
  theoryPassed?: number;
  practicalVideoUrl?: string;
  practicalScore?: number;
  practicalPassed?: number;
  overallLevel?: number;
  assessorId?: number;
  assessmentStatus: 'pending' | 'theory_passed' | 'practical_passed' | 'completed' | 'failed';
  createdAt: string;
  assessedAt?: string;
  gbCode?: string;
  gbName?: string;
  category?: string;
  workerName?: string;
}

export interface JobPosting {
  id: number;
  enterpriseId: number;
  tradeId: number;
  projectId?: number;
  title: string;
  description?: string;
  salaryType: 'daily' | 'piece' | 'monthly';
  salaryMin: number;
  salaryMax?: number;
  salaryDetails?: any;
  includesBoard?: number;
  includesLodging?: number;
  safetyTrainingRequired?: string;
  workLocation: string;
  requirementDescription?: string;
  peopleNeeded?: number;
  status: 'active' | 'closed' | 'filled';
  createdAt: string;
  gbCode?: string;
  gbName?: string;
  category?: string;
  companyName?: string;
  projectName?: string;
}

export interface ConstructionProject {
  id: number;
  enterpriseId: number;
  projectName: string;
  projectCode: string;
  projectType?: string;
  projectAddress: string;
  geofenceLat?: number;
  geofenceLng?: number;
  geofenceRadius?: number;
  budget?: number;
  status: 'planning' | 'approved' | 'started' | 'under_construction' | 'completed' | 'closed';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  createdAt: string;
  updatedAt?: string;
  companyName?: string;
  workerCount?: number;
  workers?: any[];
  socialSecurityWarnings?: any[];
}

export interface LaborContract {
  id: number;
  workerId: number;
  enterpriseId: number;
  jobPostingId: number;
  projectId?: number;
  contractNo: string;
  contractType?: string;
  startDate: string;
  endDate: string;
  salaryAmount: number;
  salaryType: 'daily' | 'piece' | 'monthly';
  contractContent?: string;
  workerSigned: number;
  workerSignedAt?: string;
  enterpriseSigned: number;
  enterpriseSignedAt?: string;
  contractFile?: string;
  status: 'draft' | 'signed' | 'terminated' | 'expired';
  createdAt: string;
  workerUsername?: string;
  workerName?: string;
  workerPhone?: string;
  workerIdCard?: string;
  enterpriseUsername?: string;
  companyName?: string;
  unifiedCreditCode?: string;
  enterprisePhone?: string;
  jobTitle?: string;
  jobDescription?: string;
  workLocation?: string;
  projectName?: string;
  projectAddress?: string;
}

export interface AttendanceRecord {
  id: number;
  workerId: number;
  projectId?: number;
  contractId?: number;
  checkInTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkInFaceVerified?: number;
  checkInGeofenceVerified?: number;
  checkOutTime?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  workHours?: number;
  status: 'normal' | 'late' | 'early_leave' | 'absent' | 'overtime';
  createdAt: string;
  projectName?: string;
  projectAddress?: string;
  username?: string;
  realName?: string;
}

export interface Payroll {
  id: number;
  workerId: number;
  enterpriseId: number;
  contractId?: number;
  projectId?: number;
  periodYear: number;
  periodMonth: number;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  socialSecurity: number;
  netSalary: number;
  bankTransferStatus: 'pending' | 'processing' | 'completed' | 'failed';
  bankTransferId?: string;
  payslipFile?: string;
  workerViewed?: number;
  createdAt: string;
  workerName?: string;
  workerUsername?: string;
  workerPhone?: string;
  enterpriseUsername?: string;
  companyName?: string;
  unifiedCreditCode?: string;
  projectName?: string;
  projectAddress?: string;
  contractNo?: string;
  contractStart?: string;
  contractEnd?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface LoginResponse {
  token: string;
  user: User & WorkerProfile & EnterpriseProfile;
}
