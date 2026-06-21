export enum ExpertLevel {
  NATIONAL = 'national',
  PROVINCIAL = 'provincial',
  SENIOR = 'senior',
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  APPRAISING = 'appraising',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
}

export enum AuthenticityLevel {
  GENUINE = 'genuine',
  SUSPICIOUS = 'suspicious',
  FAKE = 'fake',
}

export enum Category {
  CERAMIC = '陶瓷',
  JADE = '玉器',
  CALLIGRAPHY_PAINTING = '书画',
  BRONZE = '青铜器',
  COIN = '钱币',
  MISCELLANEOUS = '杂项',
  WOOD = '木器',
  LACQUER = '漆器',
  TEXTILE = '织绣',
  STATIONERY = '文房',
  SEAL = '印章',
  ZISHA = '紫砂',
}

export enum DisputeStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum UserRole {
  USER = 'user',
  EXPERT = 'expert',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

export interface Expert {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  level: ExpertLevel;
  categories: Category[];
  rating: number;
  responseTime: number;
  orderCount: number;
  basePrice: number;
  status?: string;
}

export interface Artwork {
  id: string;
  userId: string;
  category: Category;
  name: string;
  images: string[];
  description: string;
  createdAt: string;
}

export interface AIScreenResult {
  category: Category;
  categoryConfidence: number;
  era: string;
  eraConfidence: number;
  material: string;
  authenticity: AuthenticityLevel;
  authenticityConfidence: number;
  features: string[];
  suggestedExperts: string[];
}

export interface AppraisalOrder {
  id: string;
  artworkId: string;
  expertId: string;
  userId: string;
  status: OrderStatus;
  price: number;
  slaDeadline: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  orderId: string;
  conclusion: string;
  expertSignature?: string;
  watermark?: string;
  blockchainHash: string;
  blockchainHeight: number;
  timestamp: string;
  certificateNo: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: Category;
  era: string;
  tags: string[];
  content: string;
  author: string;
  expertId?: string;
  createdAt: string;
}

export interface CommunityAnswer {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  isExpert: boolean;
  isAdopted: boolean;
  createdAt: string;
}

export interface CommunityQuestion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: Category;
  answers: CommunityAnswer[];
  views: number;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  status: DisputeStatus;
  evidence?: string;
  resolution?: string;
  createdAt: string;
}

export interface ValuationResult {
  artworkId: string;
  estimatedMinPrice: number;
  estimatedMaxPrice: number;
  confidence: number;
  comparableItems: Array<{
    name: string;
    price: number;
    date: string;
    source: string;
  }>;
  marketTrend: 'rising' | 'stable' | 'declining';
  valuationDate: string;
}
