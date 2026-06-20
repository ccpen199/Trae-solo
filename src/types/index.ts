// 钓点类型
export interface FishingSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  waterType: 'lake' | 'river' | 'reservoir' | 'sea' | 'pond';
  waterTypeName: string;
  avgDepth: number;
  maxDepth: number;
  obstacles: Obstacle[];
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyName: string;
  fishSpecies: string[];
  rules: string[];
  distance?: number;
  province?: string;
  city?: string;
  isCharged?: boolean;
  waterTemp?: number;
}

// 障碍物
export interface Obstacle {
  type: 'rock' | 'weed' | 'tree' | 'platform' | 'island' | 'other';
  typeName: string;
  description: string;
  position?: { lat: number; lng: number };
}

// 鱼种
export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  aliases: string[];
  image: string;
  habits: SpeciesHabit[];
  optimalTemp: [number, number];
  optimalDepth: [number, number];
  feedingTimes: string[];
  difficulty: number;
  description: string;
  unlocked?: boolean;
}

// 鱼种习性标签
export type HabitType = 'oxygen' | 'nocturnal' | 'phototaxis' | 'temperature' | 'pressure' | 'tide';

export interface SpeciesHabit {
  type: HabitType;
  name: string;
  description: string;
  value: number;
}

// 钓法
export type FishingMethodType = 'tai' | 'lure' | 'sea' | 'blackpit';

export interface FishingMethod {
  id: string;
  name: string;
  type: FishingMethodType;
  description: string;
  suitableSpecies: string[];
  suitableWater: string[];
  equipment: string[];
  icon: string;
}

// 环境因子数据
export interface EnvironmentData {
  timestamp: number;
  spotId: string;
  source: string;
  temperature: number;
  humidity: number;
  pressure: number;
  pressureTrend: 'rising' | 'falling' | 'stable';
  windSpeed: number;
  windDirection: number;
  windDirectionName: string;
  waterTemp: number;
  dissolvedOxygen: number;
  waterLevel: number;
  tideType?: 'high' | 'low' | 'rising' | 'falling';
  tideTypeName?: string;
  tideHeight?: number;
  sunrise: number;
  sunset: number;
  moonrise?: number;
  moonset?: number;
  moonPhase: number;
  moonPhaseName: string;
  moonIllumination: number;
  uvIndex: number;
  visibility: number;
}

// 钓鱼指数
export interface FishingIndex {
  spotId: string;
  speciesId: string;
  methodId: string;
  timestamp: number;
  overallScore: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  levelName: string;
  factors: IndexFactor[];
  suggestion: string;
  bestBait?: string;
  bestDepth?: string;
}

export interface IndexFactor {
  name: string;
  key: string;
  score: number;
  weight: number;
  description: string;
  icon?: string;
}

// 热力图数据点
export interface HeatmapDataPoint {
  day: number;
  hour: number;
  score: number;
  timestamp: number;
}

// 渔获记录
export interface CatchRecord {
  id: string;
  userId: string;
  spotId: string;
  spotName: string;
  speciesId: string;
  speciesName: string;
  methodId: string;
  methodName: string;
  timestamp: number;
  catchTime: number;
  duration: number;
  weight: number;
  length: number;
  quantity: number;
  photos: string[];
  imageUrl: string;
  description: string;
  weatherTags: string[];
  tags: string[];
  locationVerified: boolean;
  likes?: number;
  comments?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rarityName: string;
}

// 用户档案
export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  level: number;
  levelName: string;
  exp: number;
  experience: number;
  expToNext: number;
  totalCatches: number;
  totalWeight: number;
  totalHours: number;
  speciesCount: number;
  spotCount: number;
  visitedSpots: number;
  unlockedAchievements: number;
  fishingDays: number;
  achievements: Achievement[];
  skillScore: number;
  joinDate: number;
  followers: number;
  following: number;
  title: string;
  titleRarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// 成就
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  rarity: AchievementRarity;
  rarityName: string;
  progress?: number;
  target?: number;
}

// 社交动态
export type PostType = 'catch' | 'checkin' | 'tip';

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  type: PostType;
  typeName: string;
  spotId?: string;
  spotName?: string;
  catchRecordId?: string;
  content: string;
  images: string[];
  tags: string[];
  hydroTags?: string[];
  likes: number;
  likesCount: number;
  comments: number;
  commentsCount: number;
  createdAt: number;
  locationVerified: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  distance?: number;
}

// 评论
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: number;
  likes: number;
  replies?: Comment[];
}

// 数据源
export interface DataSource {
  id: string;
  name: string;
  type: 'weather' | 'water' | 'tide' | 'astronomy' | 'fishery' | 'ocean' | 'hydrology';
  typeName: string;
  status: 'active' | 'inactive' | 'error' | 'degraded' | 'testing';
  statusName: string;
  apiUrl: string;
  updateFrequency: string;
  lastUpdate: number;
  successRate: number;
  priority: number;
  description: string;
  provider: string;
  coverage: string;
  latency: number;
  dataFields: string[];
}

// 指数模型版本
export interface IndexModelVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  status: 'draft' | 'testing' | 'production' | 'deprecated';
  statusName: string;
  createdAt: number;
  activatedAt?: number;
  accuracy: number;
  usageCount: number;
  factors: ModelFactor[];
  releaseDate: string;
  updateCount: number;
}

export interface ModelFactor {
  name: string;
  key: string;
  weight: number;
  description: string;
}

// 用户行为埋点
export interface UserBehaviorMetric {
  date: string;
  activeUsers: number;
  newUsers: number;
  pageViews: number;
  avgSessionDuration: number;
  retentionRate: number;
  indexQueries: number;
  aiAnalysisCount: number;
  socialPosts: number;
}

// 选项类型
export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: string;
}
