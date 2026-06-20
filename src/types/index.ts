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
