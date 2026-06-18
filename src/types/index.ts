export type UserRole = 'student' | 'department_admin' | 'school_admin' | 'base' | 'donor';

export interface User {
  id: string;
  role: UserRole;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  department?: string;
  studentId?: string;
  major?: string;
  grade?: string;
}

export interface TeamMember {
  userId: string;
  studentId: string;
  name: string;
  major: string;
  grade: string;
  role: 'leader' | 'member';
}

export interface ItineraryItem {
  id: string;
  date: string;
  title: string;
  description: string;
  location: string;
  coordinates?: [number, number];
}

export interface CheckInRecord {
  id: string;
  teamId: string;
  userId: string;
  timestamp: string;
  location: string;
  coordinates: [number, number];
  photos: string[];
  remark?: string;
}

export interface Journal {
  id: string;
  teamId: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  aiSummary?: string;
  keywords: string[];
  serviceTags: string[];
  createdAt: string;
}

export interface SanxiaxiangTeam {
  id: string;
  name: string;
  theme: string;
  leaderId: string;
  members: TeamMember[];
  practiceBase?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'ongoing' | 'completed';
  itinerary: ItineraryItem[];
  checkIns: CheckInRecord[];
  journals: Journal[];
  createdAt: string;
}

export interface ScholarshipProject {
  id: string;
  donorId: string;
  donorName: string;
  donorLogo?: string;
  name: string;
  amount: number;
  slots: number;
  description: string;
  eligibility: string;
  applicationDeadline: string;
  status: 'recruiting' | 'reviewing' | 'closed' | 'completed';
  applicants: ScholarshipApplicant[];
  createdAt: string;
}

export interface ScholarshipApplicant {
  userId: string;
  projectId: string;
  studentId: string;
  name: string;
  applicationMaterials: string;
  status: 'pending' | 'shortlisted' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface BeneficiaryStory {
  id: string;
  projectId?: string;
  anonymousName: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: 'policy' | 'case' | 'notice' | 'activity';
  subjectTags: string[];
  author: string;
  publishedAt: string;
  views: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  organizer: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  registeredCount: number;
  creditStandard: number;
  registrationDeadline: string;
  status: 'draft' | 'open' | 'closed' | 'ongoing' | 'completed';
  participants: ActivityParticipant[];
  createdAt: string;
}

export interface ActivityParticipant {
  userId: string;
  activityId: string;
  status: 'registered' | 'approved' | 'rejected' | 'completed';
  registeredAt: string;
}

export interface PracticeBase {
  id: string;
  name: string;
  type: 'enterprise' | 'village' | 'community';
  contactPerson: string;
  contactPhone: string;
  address: string;
  description: string;
  logo?: string;
  satisfactionScore: number;
  positions: BasePosition[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
}

export interface BasePosition {
  id: string;
  baseId: string;
  title: string;
  description: string;
  requirements: string;
  slots: number;
  subsidy?: string;
  status: 'open' | 'closed';
}

export interface CreditApplication {
  id: string;
  userId: string;
  studentId: string;
  type: 'sanxiaxiang' | 'activity' | 'volunteer' | 'other';
  relatedId: string;
  relatedName: string;
  creditHours: number;
  proofMaterials: string[];
  status: 'pending' | 'approved' | 'rejected';
  applicantRemark?: string;
  reviewerRemark?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  appliedAt: string;
}

export interface Transcript {
  userId: string;
  studentId: string;
  name: string;
  department: string;
  major: string;
  grade: string;
  totalCredits: number;
  records: CreditRecord[];
}

export interface CreditRecord {
  id: string;
  type: string;
  name: string;
  creditHours: number;
  date: string;
  status: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalActivities: number;
  participationRate: number;
  totalServiceHours: number;
  averageCreditsPerStudent: number;
  departmentRank: DepartmentRank[];
  baseSatisfaction: BaseSatisfaction[];
  monthlyTrend: MonthlyData[];
}

export interface DepartmentRank {
  department: string;
  participationRate: number;
  serviceHours: number;
  teams: number;
}

export interface BaseSatisfaction {
  baseName: string;
  score: number;
  reviews: number;
}

export interface MonthlyData {
  month: string;
  activities: number;
  participants: number;
  hours: number;
}
