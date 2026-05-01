export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  MUTED = 'MUTED',
  BANNED = 'BANNED'
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED'
}

export enum CommentStatus {
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportType {
  SPAM = 'SPAM',
  HATE = 'HATE',
  HARASSMENT = 'HARASSMENT',
  VIOLENCE = 'VIOLENCE',
  ADULT = 'ADULT',
  ILLEGAL = 'ILLEGAL',
  OTHER = 'OTHER'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  bio: string | null;
  
  reputation: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  level: number;
  experience: number;
  
  mutedUntil: string | null;
  mutedReason: string | null;
  bannedAt: string | null;
  bannedReason: string | null;
  
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  status: PostStatus;
  
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  
  hotScore: number;
  isPinned: boolean;
  isFeatured: boolean;
  
  isLiked?: boolean;
  
  deletedAt: string | null;
  deletedBy: string | null;
  deletedReason: string | null;
  
  createdAt: string;
  updatedAt: string;
  lastBumpedAt: string;
  
  author?: {
    id: string;
    username: string;
    avatarUrl: string | null;
    level?: number;
  };
  
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  status: CommentStatus;
  likeCount: number;
  isLiked?: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  author?: {
    id: string;
    username: string;
    avatarUrl: string | null;
    level?: number;
  };
  
  children?: Comment[];
}

export interface Report {
  id: string;
  postId: string | null;
  commentId: string | null;
  reporterId: string;
  handlerId: string | null;
  type: ReportType;
  reason: string;
  status: ReportStatus;
  
  moderatorAction: string | null;
  resolutionNote: string | null;
  
  createdAt: string;
  handledAt: string | null;
  
  post?: {
    id: string;
    title: string;
    author?: { username: string };
  };
  
  comment?: {
    id: string;
    content: string;
    author?: { username: string };
  };
  
  reporter?: {
    id: string;
    username: string;
  };
  
  handler?: {
    id: string;
    username: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string | null;
  relatedPostId: string | null;
  relatedUserId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  requirementType: string;
  requirementValue: number;
  sortOrder: number;
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  badge: Badge;
}

export interface UserGrowth {
  level: number;
  experience: number;
  reputation: number;
  nextLevelExp: number;
  progress: number;
  badges: {
    id: string;
    name: string;
    description: string;
    iconUrl: string | null;
    awardedAt: string;
  }[];
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  oldValue: any | null;
  newValue: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  
  user?: {
    username: string;
  };
}

export interface DailyStats {
  date: string;
  activeUsers: number;
  newUsers: number;
  postsCreated: number;
  commentsCreated: number;
  likesCreated: number;
  reportsCreated: number;
  postsDeleted: number;
  usersMuted: number;
  usersBanned: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: {
    msg: string;
    param: string;
    location: string;
  }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
