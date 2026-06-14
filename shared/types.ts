export type UserRole = 'student' | 'company' | 'admin';

export interface Student {
  id: string;
  studentId: string;
  name: string;
  school: string;
  major: string;
  grade: string;
  avatar?: string;
  rating: number;
  verified: boolean;
  phone?: string;
  email?: string;
  resume?: {
    skills: string[];
    experience: string;
    introduction: string;
  };
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  licenseNo: string;
  contactName: string;
  contactPhone: string;
  address: string;
  avatar?: string;
  verified: boolean;
  description?: string;
  industry?: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface FilingForm {
  id: string;
  jobId: string;
  companyId: string;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  minWage: number;
  insuranceProvided: boolean;
  insuranceType?: string;
  safetyMeasures: string;
  emergencyContact: string;
  emergencyPhone: string;
  filedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  salaryPerHour: number;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  majorRequired: string[];
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  status: 'draft' | 'published' | 'closed';
  filingForm?: FilingForm;
  company?: Company;
  applicationCount?: number;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'interview' | 'accepted' | 'rejected' | 'working' | 'completed';

export interface Application {
  id: string;
  studentId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  interviewTime?: string;
  workHours?: number;
  salary?: number;
  rating?: number;
  comment?: string;
  student?: Student;
  job?: Job;
  company?: Company;
}

export interface ScheduleCourse {
  day: number;
  startPeriod: number;
  endPeriod: number;
  courseName: string;
  location?: string;
}

export interface Schedule {
  id: string;
  studentId: string;
  courses: ScheduleCourse[];
}

export interface MatchResult {
  job: Job;
  score: number;
  breakdown: {
    majorMatch: number;
    scheduleMatch: number;
    ratingScore: number;
  };
  reasons: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: UserRole;
  content: string;
  type: 'text' | 'file';
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  studentId: string;
  companyId: string;
  jobId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  student?: Student;
  company?: Company;
  job?: Job;
}

export interface Wallet {
  id: string;
  studentId: string;
  balance: number;
  alipayAccount?: string;
  alipayRealName?: string;
  wechatAccount?: string;
  wechatRealName?: string;
}

export interface PayrollRecord {
  id: string;
  applicationId: string;
  companyId: string;
  studentId: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  batchId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface WithdrawRecord {
  id: string;
  studentId: string;
  amount: number;
  channel: 'alipay' | 'wechat';
  status: 'pending' | 'processing' | 'success' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  applicationId: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  workHours: number;
  salary: number;
  rating: number;
  certificateUrl: string;
  sealUrl: string;
  createdAt: string;
}

export type ComplaintType = 'salary' | 'safety' | 'discrimination' | 'fraud' | 'other';
export type ComplaintStatus = 'pending' | 'investigating' | 'resolved' | 'closed';

export interface Complaint {
  id: string;
  studentId: string;
  companyId: string;
  jobId: string;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  result?: string;
  createdAt: string;
  resolvedAt?: string;
  student?: Student;
  company?: Company;
  job?: Job;
}

export interface SchoolStats {
  id: string;
  name: string;
  province: string;
  studentCount: number;
  jobCount: number;
  applicationCount: number;
  complaintCount: number;
  complaintRate: number;
  avgSalary: number;
}

export interface AdminOverview {
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  totalComplaints: number;
  complaintRate: number;
  salaryComplianceRate: number;
  avgSalary: number;
  dailyTrend: TrendItem[];
  schoolDistribution: SchoolDistributionItem[];
  jobTypeDistribution: TypeDistributionItem[];
}

export interface TrendItem {
  date: string;
  students: number;
  jobs: number;
  applications: number;
}

export interface SchoolDistributionItem {
  name: string;
  value: number;
}

export interface TypeDistributionItem {
  name: string;
  value: number;
}
