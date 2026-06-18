import type { GeoLocation } from './common';

export type TopicStatus = 'draft' | 'published' | 'reviewing' | 'hidden' | 'deleted';

export type TopicCategory =
  | 'life'
  | 'help'
  | 'activity'
  | 'notice'
  | 'secondhand'
  | 'complaint'
  | 'chat'
  | 'other';

export interface Topic {
  id: string;
  tenantId: string;
  authorId: string;
  category: TopicCategory;
  title: string;
  content: string;
  images?: string[];
  videos?: string[];
  location?: GeoLocation;
  locationName?: string;
  tags?: string[];
  isAnonymous: boolean;
  isTop: boolean;
  isEssence: boolean;
  status: TopicStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  reportCount: number;
  sensitiveScore?: number;
  sensitiveWords?: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicComment {
  id: string;
  topicId: string;
  tenantId: string;
  authorId: string;
  parentId?: string;
  replyToUserId?: string;
  content: string;
  images?: string[];
  likeCount: number;
  isAnonymous: boolean;
  status: 'normal' | 'hidden' | 'deleted';
  sensitiveScore?: number;
  createdAt: Date;
}

export interface TopicLike {
  id: string;
  topicId: string;
  userId: string;
  createdAt: Date;
}

export interface TopicReport {
  id: string;
  topicId: string;
  reporterId: string;
  reason: string;
  description?: string;
  evidenceImages?: string[];
  status: 'pending' | 'resolved' | 'rejected';
  handlerId?: string;
  handleRemark?: string;
  handledAt?: Date;
  createdAt: Date;
}

export interface TopicTraceLog {
  id: string;
  topicId: string;
  userId: string;
  action: 'create' | 'edit' | 'publish' | 'hide' | 'delete' | 'report' | 'restore';
  beforeContent?: string;
  afterContent?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
