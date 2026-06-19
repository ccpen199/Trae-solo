export interface NewsItem {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'mixed';
  status: 'draft' | 'pending' | 'reviewing' | 'approved' | 'published' | 'rejected';
  author: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  cover?: string;
  content?: string;
  copyright: string;
  tags: string[];
  reviewHistory?: ReviewRecord[];
  channels?: string[];
}

export interface ReviewRecord {
  id: string;
  reviewer: string;
  role: string;
  status: 'approved' | 'rejected' | 'pending';
  comment: string;
  createdAt: string;
  level: number;
}

export interface Reporter {
  id: string;
  name: string;
  avatar: string;
  department: string;
  phone: string;
  taskCount: number;
  materialCount: number;
}

export interface Material {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  size: string;
  uploader: string;
  uploadTime: string;
  tags: string[];
  copyright: string;
  location?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  proposer: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  deadline?: string;
  assignees?: string[];
}

export interface SentimentItem {
  id: string;
  title: string;
  source: string;
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  heat: number;
  publishTime: string;
  url: string;
  summary: string;
  keywords: string[];
  region?: string;
}

export interface HotEvent {
  id: string;
  name: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  articleCount: number;
  keywords: string[];
  relatedTopics: string[];
  updateTime: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  cover: string;
  instructor: string;
  duration: number;
  category: string;
  students: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
  chapters: CourseChapter[];
  createdAt: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  duration: number;
  videoUrl?: string;
  resources?: string[];
}

export interface Exam {
  id: string;
  title: string;
  courseId?: string;
  duration: number;
  totalScore: number;
  passScore: number;
  questionCount: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

export interface TrainingRecord {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  studyHours: number;
  examScore?: number;
  certificateUrl?: string;
  completedAt?: string;
  status: 'studying' | 'completed' | 'failed';
}

export interface Asset {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'graphic';
  thumbnail: string;
  fileSize: string;
  format: string;
  copyright: 'original' | 'authorized' | 'public';
  copyrightHolder: string;
  licenseType?: string;
  expirationDate?: string;
  tags: string[];
  metadata: Record<string, string>;
  uploader: string;
  createdAt: string;
  downloads: number;
  views: number;
  status: 'available' | 'pending' | 'restricted';
}

export interface DistributionChannel {
  id: string;
  name: string;
  icon: string;
  type: 'newspaper' | 'tv' | 'radio' | 'website' | 'weibo' | 'wechat' | 'douyin' | 'kuaishou' | 'app';
  status: 'active' | 'inactive';
  followers?: number;
  todayPosts: number;
  todayViews: number;
}

export interface DashboardStats {
  totalArticles: number;
  todayArticles: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  spreadIndex: number;
  matrixCoverage: number;
  reportersOnline: number;
  materialsToday: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'editor' | 'reporter' | 'reviewer' | 'trainee';
  department: string;
  phone: string;
  email: string;
}
