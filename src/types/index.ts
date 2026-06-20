export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  verified: boolean;
  videos: Video[];
  jobs: Job[];
  teamMembers: TeamMember[];
  stats: {
    views: number;
    followers: number;
    jobApplications: number;
  };
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  type: 'office' | 'team' | 'job' | 'introduction';
  tags: string[];
  views: number;
  likes: number;
  completionRate: number;
  favorites: number;
  conversions: number;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  subtitles?: Subtitle[];
  aiKeywords?: string[];
  score?: number;
}

export interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

export interface Job {
  id: string;
  title: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  experience: string;
  education: string;
  description: string;
  requirements: string[];
  benefits: string[];
  companyId: string;
  companyName: string;
  companyLogo: string;
  videoId?: string;
  videoThumbnail?: string;
  tags: string[];
  postedDate: string;
  applications: number;
  verified: boolean;
  views: number;
  matchedSeekers: number;
}

export interface JobSeeker {
  id: string;
  name: string;
  avatar: string;
  title: string;
  experience: string;
  education: string;
  location: string;
  skills: string[];
  resumeVideo?: Video;
  expectedSalary: string;
  bio: string;
  views: number;
  connections: number;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  position: string;
  department: string;
}

export interface ReviewItem {
  id: string;
  type: 'video' | 'job' | 'company';
  title: string;
  thumbnail?: string;
  submitter: string;
  submitTime: string;
  status: 'pending' | 'ai_reviewed' | 'approved' | 'rejected';
  aiScore?: number;
  aiIssues?: string[];
  notes?: string;
}

export interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number;
  jobCount: number;
  seekerCount: number;
}

export interface ActivityData {
  region: string;
  date: string;
  jobPosts: number;
  applications: number;
  videoViews: number;
  activeUsers: number;
}

export interface ScoreBreakdown {
  industry: number;
  salary: number;
  commute: number;
  interaction: number;
  popularity: number;
  base: number;
}

export interface AIIssueDetail {
  category: 'keyword' | 'quality' | 'copyright' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ReviewItemDetail extends ReviewItem {
  aiIssueDetails?: AIIssueDetail[];
  content?: string;
  reportedCount?: number;
}

export interface ReviewRecord {
  id: string;
  reviewer: string;
  reviewerAvatar?: string;
  time: string;
  action: 'approve' | 'reject' | 'request_material';
  targetId: string;
  targetTitle: string;
  targetType: 'video' | 'job' | 'company';
  reason?: string;
}

export interface VerificationTask {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  type: 'enterprise' | 'job';
  status: 'pending' | 'approved' | 'rejected' | 'need_material';
  aiScore: number;
  issues: string[];
  submitTime: string;
  reportedCount?: number;
}

export interface VerificationRecord {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  verifier: string;
  verifierAvatar?: string;
  verifyDate: string;
  result: 'approved' | 'rejected';
  type: 'enterprise' | 'job';
}

export interface Complaint {
  id: string;
  targetId: string;
  targetTitle: string;
  targetType: 'company' | 'job';
  targetName: string;
  targetLogo: string;
  reporter: string;
  reportTime: string;
  reason: string;
  status: 'pending' | 'handled' | 'dismissed';
}

export interface DailyActivity {
  date: string;
  activeUsers: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  label: string;
}
