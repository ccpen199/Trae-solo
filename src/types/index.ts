export interface Student {
  id: string;
  name: string;
  studentId: string;
  department: string;
  major: string;
  grade: string;
  phone: string;
  avatar?: string;
  practiceHours: number;
  credits: number;
}

export type TeamStatus =
  | 'draft'
  | 'pending'
  | 'advisor_reviewing'
  | 'advisor_rejected'
  | 'dept_reviewing'
  | 'dept_rejected'
  | 'approved'
  | 'ongoing'
  | 'completed'
  | 'certified';

export type CreditProgress =
  | 'not_started'
  | 'hours_collecting'
  | 'hours_confirmed'
  | 'dept_reviewing'
  | 'credited'
  | 'rejected';

export interface Team {
  id: string;
  name: string;
  projectName: string;
  department: string;
  leaderId: string;
  leaderName: string;
  members: Student[];
  status: TeamStatus;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  checkInCount: number;
  logCount: number;

  advisorId?: string;
  advisorName?: string;
  applyTime?: string;

  advisorOpinion?: string;
  advisorStatus?: 'pending' | 'approved' | 'rejected';
  advisorReviewTime?: string;

  departmentOpinion?: string;
  departmentRejectReason?: string;
  departmentStatus?: 'pending' | 'approved' | 'rejected';
  departmentReviewTime?: string;

  creditProgress?: CreditProgress;
  creditAmount?: number;
  creditReviewer?: string;
  creditReviewTime?: string;

  certificationStatus?: 'not_started' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  certificationOpinion?: string;

  totalServiceHours?: number;
  allKeywords?: string[];
  teamAchievements?: string[];
}

export interface CheckInRecord {
  id: string;
  teamId: string;
  teamName: string;
  location: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  timestamp: string;
  description: string;
  hasWatermark?: boolean;
  watermarkInfo?: {
    time: string;
    gps: string;
    team: string;
  };
  authorId?: string;
  authorName?: string;
}

export interface PracticeLog {
  id: string;
  teamId: string;
  teamName: string;
  author: string;
  authorId?: string;
  date: string;
  content: string;
  summary?: string;
  keywords: string[];
  serviceHours: number;
  status?: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  reviewer?: string;
  reviewComment?: string;
  reviewTime?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  donorName: string;
  amount: number;
  recipients: number;
  deadline: string;
  description: string;
  requirements: string;
  status: 'ongoing' | 'closed';
}

export interface Donor {
  id: string;
  name: string;
  logo?: string;
  description: string;
  totalDonations: number;
  projectCount: number;
  industry: string;
}

export interface ScholarshipStory {
  id: string;
  scholarshipId: string;
  scholarshipName: string;
  studentAlias: string;
  content: string;
  date: string;
  likes: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  publishDate: string;
  source: string;
  views: number;
}

export interface Department {
  id: string;
  name: string;
  studentCount: number;
  participationRate: number;
  totalHours: number;
  avgCredits: number;
  teamCount?: number;
  completedTeamCount?: number;
  certifiedTeamCount?: number;
}

export interface PracticeBase {
  id: string;
  name: string;
  type: 'enterprise' | 'village' | 'community';
  address: string;
  contactPerson: string;
  contactPhone: string;
  satisfaction: number;
  positionCount: number;
  description: string;
  totalCheckIns?: number;
  totalTeams?: number;
  totalStudents?: number;
}

export interface StatsData {
  totalStudents: number;
  totalTeams: number;
  totalHours: number;
  totalBases: number;
  participationRate: number;
  avgCredits: number;
  pendingReviewTeams: number;
  certifiedTeams: number;
  monthlyData: { month: string; hours: number; teams: number; logs: number; checkins: number }[];
  departmentRanking: { name: string; hours: number; rate: number; teamCount: number; avgHours: number }[];
  baseSatisfaction: { name: string; score: number; checkins: number; teams: number }[];
}
