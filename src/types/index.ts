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

export interface Team {
  id: string;
  name: string;
  projectName: string;
  department: string;
  leaderId: string;
  leaderName: string;
  members: Student[];
  status: 'pending' | 'approved' | 'rejected' | 'ongoing' | 'completed';
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  checkInCount: number;
  logCount: number;
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
}

export interface PracticeLog {
  id: string;
  teamId: string;
  teamName: string;
  author: string;
  date: string;
  content: string;
  summary?: string;
  keywords: string[];
  serviceHours: number;
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
}

export interface StatsData {
  totalStudents: number;
  totalTeams: number;
  totalHours: number;
  totalBases: number;
  participationRate: number;
  avgCredits: number;
  monthlyData: { month: string; hours: number; teams: number }[];
  departmentRanking: { name: string; hours: number; rate: number }[];
  baseSatisfaction: { name: string; score: number }[];
}
